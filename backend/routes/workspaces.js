const express = require('express');
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Create workspace
router.post('/', protect, async (req, res) => {
  const { name } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const workspace = await Workspace.create({ name, slug, owner: req.user.id, members: [{ user: req.user.id, role: 'admin' }] });
  res.status(201).json(workspace);
});

// Get user's workspaces
router.get('/', protect, async (req, res) => {
  const workspaces = await Workspace.find({ 'members.user': req.user.id });
  res.json(workspaces);
});

// Switch active workspace
router.put('/switch/:id', protect, async (req, res) => {
  const workspace = await Workspace.findOne({ _id: req.params.id, 'members.user': req.user.id });
  if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
  req.user.activeWorkspace = workspace._id;
  await req.user.save();
  res.json({ activeWorkspace: workspace._id });
});

module.exports = router;