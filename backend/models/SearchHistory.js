const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  answer: { type: String, required: true },
  sources: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

searchHistorySchema.index({ workspace: 1, user: 1, createdAt: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);