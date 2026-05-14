const User = require('../models/User');
const Task = require('../models/Task');
const Job = require('../models/Job');

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const queryObj = q && q.trim() !== '' ? {
      $and: [
        { 
          $or: [
            { name: new RegExp(q, 'i') },
            { companyName: new RegExp(q, 'i') }
          ]
        },
        { role: { $ne: 'admin' } }
      ]
    } : {
      role: { $ne: 'admin' }
    };

    // Search Users (Students & Recruiters)
    const users = await User.find(queryObj)
      .select('name email role companyName profilePicture skills location college bio')
      .limit(50)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        users,
        tasks: [],
        jobs: []
      }
    });
  } catch (error) {
    console.error('Global Search Error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform search' });
  }
};
