const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileName: String,
  originalName: String,
  fileType: String,
  filePath: String,
  extractedText: String,
  metadata: { type: Map, of: String },
  pineconeIds: [String], // track vector IDs
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);