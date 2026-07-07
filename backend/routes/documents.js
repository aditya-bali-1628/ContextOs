const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { processDocument } = require('../services/ingestion');
const { deleteDocumentVectors } = require('../services/ai');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');

// GET /api/documents?workspaceId=...
router.get('/', protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const docs = await Document.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(docs);
  } catch (err) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// POST /api/documents/upload
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('=== FILE DEBUG ===');
    console.log(req.file);
    console.log('Original Path:', req.file.path);
    console.log('Absolute Path:', path.resolve(req.file.path));
    console.log('==================');

    const { workspaceId } = req.body;

    const doc = await Document.create({
      workspace: workspaceId,
      uploadedBy: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      filePath: path.resolve(req.file.path), // CHANGED
    });

    processDocument(doc).catch(err =>
      console.error('Processing failed:', err)
    );

    // Log activity — was previously missing, which meant totalUploads
    // always showed 0 on the dashboard and there was no upload history.
    ActivityLog.create({
      workspace: workspaceId,
      user: req.user._id,
      action: 'upload',
      resource: doc._id.toString(),
      metadata: { fileName: doc.originalName, fileType: doc.fileType },
    }).catch(err => console.error('Activity log failed:', err));

    res.status(201).json(doc);

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Remove vectors from Pinecone first, so search/chat can't surface a
    // half-deleted document if a later step fails.
    try {
      await deleteDocumentVectors(doc._id.toString(), doc.workspace.toString());
    } catch (err) {
      console.error('Pinecone vector deletion failed:', err);
      // Continue anyway — don't block the user from deleting a doc just
      // because the vector store had an issue. Worth monitoring though.
    }

    // Remove the file from disk
    if (doc.filePath) {
      fs.unlink(doc.filePath, (err) => {
        if (err) console.error('File deletion failed:', err);
      });
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted', id: req.params.id });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

module.exports = router;