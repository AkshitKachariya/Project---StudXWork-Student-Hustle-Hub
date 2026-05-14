const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, default: '' },
  context:  { type: String, enum: ['task','job'], required: true },
  refId:    { type: mongoose.Schema.ObjectId },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Rating', RatingSchema);
