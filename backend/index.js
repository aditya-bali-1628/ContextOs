const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.resolve(__dirname, '../.env') });



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const documentRoutes = require('./routes/documents');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');
const searchRoutes = require('./routes/search');

const app = express();
app.use(cors());
app.use(express.json());
const _dirname = path.resolve();

app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

app.use(express.static(path.join(_dirname, "frontend/build")))
app.get('/*splat', (req, res) => {
  // BUG FIX: was `res.sendFile(path.resolve)` — passed the function itself
  // instead of calling it with the actual path to index.html, which would
  // crash on every request that fell through to this catch-all route.
  res.sendFile(path.resolve(_dirname, 'frontend', 'build', 'index.html'));
})

const PORT = process.env.PORT || 5000;

// Safety net: log unexpected unhandled rejections instead of letting them
// crash the entire server (e.g. SDK-internal stream parse errors that
// bypass normal try/catch). This keeps one bad request from taking down
// every other user's connection.
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION (server kept running):', reason);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));