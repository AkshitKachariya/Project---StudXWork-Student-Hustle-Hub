const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  target:    { type: String, enum: ['all','student','recruiter'], default: 'all' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Notice', NoticeSchema);
