const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String, // e.g., 'upload', 'search', 'chat', 'view'
  resource: String, // document ID or 'search'
  metadata: Object,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);