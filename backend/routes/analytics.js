const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { protect } = require('../middleware/auth');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');

router.get('/stats', protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;

    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

    // Summary Cards
    const [
      totalDocuments,
      totalActivities,
      totalViews,
      totalChats,
      totalSearches,
      totalUploads
    ] = await Promise.all([
      Document.countDocuments({ workspace: workspaceObjectId }),

      ActivityLog.countDocuments({
        workspace: workspaceObjectId
      }),

      ActivityLog.countDocuments({
        workspace: workspaceObjectId,
        action: 'view'
      }),

      ActivityLog.countDocuments({
        workspace: workspaceObjectId,
        action: 'chat'
      }),

      ActivityLog.countDocuments({
        workspace: workspaceObjectId,
        action: 'search'
      }),

      ActivityLog.countDocuments({
        workspace: workspaceObjectId,
        action: 'upload'
      })
    ]);

    // Most Active Users
    const activeUsers = await ActivityLog.aggregate([
      {
        $match: {
          workspace: workspaceObjectId
        }
      },
      {
        $group: {
          _id: '$user',
          actions: { $sum: 1 }
        }
      },
      {
        $sort: {
          actions: -1
        }
      },
      {
        $limit: 5
      }
    ]);

    // Document Upload Trend
    const uploadsByDay = await Document.aggregate([
      {
        $match: {
          workspace: workspaceObjectId
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);

    // Activity Trend
    const activityByDay = await ActivityLog.aggregate([
      {
        $match: {
          workspace: workspaceObjectId
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);

    // File Types
    const fileTypes = await Document.aggregate([
      {
        $match: {
          workspace: workspaceObjectId
        }
      },
      {
        $group: {
          _id: '$fileType',
          count: {
            $sum: 1
          }
        }
      }
    ]);

    res.json({
      summary: {
        totalDocuments,
        totalActivities,
        totalViews,
        totalChats,
        totalSearches,
        totalUploads
      },
      activeUsers,
      uploadsByDay,
      activityByDay,
      fileTypes
    });

  } catch (error) {
    console.error('Analytics Error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});

// GET /api/analytics/history?workspaceId=...&type=documents|uploads|chats|searches|activities
// Powers the dashboard drill-down: clicking a stat card lands on a page
// listing the underlying records for that stat.
router.get('/history', protect, async (req, res) => {
  try {
    const { workspaceId, type } = req.query;
    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

    let items = [];

    if (type === 'documents') {
      const docs = await Document.find({ workspace: workspaceObjectId })
        .sort({ createdAt: -1 })
        .lean();
      items = docs.map(d => ({
        id: d._id,
        title: d.originalName,
        subtitle: d.fileType,
        date: d.createdAt,
      }));
    } else if (type === 'uploads') {
      const logs = await ActivityLog.find({ workspace: workspaceObjectId, action: 'upload' })
        .sort({ timestamp: -1 })
        .populate('user', 'name email')
        .lean();
      items = logs.map(l => ({
        id: l._id,
        title: l.metadata?.fileName || 'Unknown file',
        subtitle: l.user?.name || l.user?.email || 'Unknown user',
        date: l.timestamp,
      }));
    } else if (type === 'chats') {
      const logs = await ActivityLog.find({ workspace: workspaceObjectId, action: 'chat' })
        .sort({ timestamp: -1 })
        .populate('user', 'name email')
        .lean();
      items = logs.map(l => ({
        id: l._id,
        title: l.metadata?.query || '(no query recorded)',
        subtitle: l.user?.name || l.user?.email || 'Unknown user',
        date: l.timestamp,
      }));
    } else if (type === 'searches') {
      const logs = await ActivityLog.find({ workspace: workspaceObjectId, action: 'search' })
        .sort({ timestamp: -1 })
        .populate('user', 'name email')
        .lean();
      items = logs.map(l => ({
        id: l._id,
        title: l.metadata?.query || '(no query recorded)',
        subtitle: l.user?.name || l.user?.email || 'Unknown user',
        date: l.timestamp,
      }));
    } else if (type === 'activities') {
      const logs = await ActivityLog.find({ workspace: workspaceObjectId })
        .sort({ timestamp: -1 })
        .populate('user', 'name email')
        .lean();
      items = logs.map(l => ({
        id: l._id,
        title: `${l.action}${l.metadata?.query ? `: ${l.metadata.query}` : ''}${l.metadata?.fileName ? `: ${l.metadata.fileName}` : ''}`,
        subtitle: l.user?.name || l.user?.email || 'Unknown user',
        date: l.timestamp,
      }));
    } else {
      return res.status(400).json({ message: 'Invalid history type' });
    }

    res.json({ type, items });
  } catch (error) {
    console.error('Analytics history error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;