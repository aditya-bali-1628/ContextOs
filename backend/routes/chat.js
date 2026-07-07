const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chatStream } = require('../services/ai');
const ChatMessage = require('../models/ChatMessage');

// GET /api/chat/history?workspaceId=...
// Returns this user's persisted chat messages for a workspace, oldest first,
// so Chat.js can restore the conversation after navigating away and back.
router.get('/history', protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const messages = await ChatMessage.find({ workspace: workspaceId, user: req.user._id })
      .sort({ createdAt: 1 })
      .lean();
    res.json(messages.map(m => ({ role: m.role, content: m.content })));
  } catch (err) {
    console.error('Fetch chat history error:', err);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

router.get('/stream', protect, async (req, res) => {
  console.log('[/api/chat/stream] request received:', req.query);

  const { query, workspaceId } = req.query;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Save the user's message immediately, so it's persisted even if the
  // assistant's response fails partway through.
  ChatMessage.create({
    workspace: workspaceId,
    user: req.user._id,
    role: 'user',
    content: query,
  }).catch(err => console.error('Failed to save user message:', err));

  let fullAnswer = '';

  try {
    const stream = await chatStream(query, workspaceId, req.user._id);
    for await (const chunk of stream) {
      if (chunk.token) {
        fullAnswer += chunk.token;
      }
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();

    // Only persist the assistant message if we actually got a full answer
    // (i.e. the stream wasn't interrupted by a quota error or parse failure).
    if (fullAnswer) {
      ChatMessage.create({
        workspace: workspaceId,
        user: req.user._id,
        role: 'assistant',
        content: fullAnswer,
      }).catch(err => console.error('Failed to save assistant message:', err));
    }
  } catch (error) {
    console.error('[/api/chat/stream] error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;