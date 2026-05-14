const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ApplicationSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  job:       { type: mongoose.Schema.ObjectId, ref: 'Job', default: null },
  task:      { type: mongoose.Schema.ObjectId, ref: 'Task', default: null },
  proposal:  { type: String, required: true },
  bidAmount: { type: Number, default: 0 },
  status:    { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  interview: {
    date:     String,
    time:     String,
    location: String,
    message:  String,
  },
  interviewDetails: {
    date:     { type: String },
    time:     { type: String },
    location: { type: String },
    message:  { type: String },
  },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

ApplicationSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Application', ApplicationSchema);
