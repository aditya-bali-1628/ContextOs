const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { searchWorkspace } = require('../services/ai');
const SearchHistory = require('../models/SearchHistory');

// GET /api/search/history?workspaceId=...
router.get('/history', protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const history = await SearchHistory.find({ workspace: workspaceId, user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(history);
  } catch (err) {
    console.error('Fetch search history error:', err);
    res.status(500).json({ message: 'Failed to fetch search history' });
  }
});

// DELETE /api/search/history?workspaceId=...
// Clears this user's search history for the given workspace.
router.delete('/history', protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    await SearchHistory.deleteMany({ workspace: workspaceId, user: req.user._id });
    res.json({ message: 'Search history cleared' });
  } catch (err) {
    console.error('Clear search history error:', err);
    res.status(500).json({ message: 'Failed to clear search history' });
  }
});

router.post('/', protect, async (req, res) => {
  const { query, workspaceId } = req.body;
  const userId = req.user._id;
  try {
    const results = await searchWorkspace(query, workspaceId, userId);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

module.exports = router;