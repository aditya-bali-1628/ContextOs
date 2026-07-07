const ActivityLog = require('../models/ActivityLog');

const logActivity = (action) => async (req, res, next) => {
  // After the route handler, log the activity (using res.on('finish') or explicit call)
  const originalJson = res.json;
  res.json = function(data) {
    const logEntry = {
      workspace: req.body.workspaceId || req.params.workspaceId,
      user: req.user._id,
      action: action,
      resource: req.params.id || req.body.documentId || 'system',
      metadata: { status: res.statusCode }
    };
    ActivityLog.create(logEntry).catch(err => console.error('Logging failed', err));
    originalJson.call(this, data);
  };
  next();
};

module.exports = logActivity;