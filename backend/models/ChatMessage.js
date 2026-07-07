const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: MongoDB automatically deletes documents once `createdAt` is
// older than 30 days — no manual cleanup job needed, mirroring WhatsApp-style
// disappearing messages.
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// Fetching a workspace's chat history in order is the main query pattern.
chatMessageSchema.index({ workspace: 1, user: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);