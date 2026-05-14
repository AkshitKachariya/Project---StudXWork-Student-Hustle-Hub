const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// GET profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.params.id || req.user.id).select('-password');
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.status(200).json({ success: true, data: user });
};

// UPDATE profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name','bio','phone','skills','college','companyName','companyWebsite','companyDescription'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
};

// GET all students (recruiter/admin)
exports.getAllStudents = async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password');
  res.status(200).json({ success: true, count: students.length, data: students });
};

// GET all recruiters (admin)
exports.getAllRecruiters = async (req, res) => {
  const recruiters = await User.find({ role: 'recruiter' }).select('-password');
  res.status(200).json({ success: true, count: recruiters.length, data: recruiters });
};
