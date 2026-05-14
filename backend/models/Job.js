const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const JobSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  type:         { type: String, enum: ['internship','part-time','full-time','freelance'], required: true },
  location:     { type: String, default: 'Remote' },
  salary:       { type: String, default: 'Negotiable' },
  skills:       [String],
  recruiter:    { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  status:       { type: String, enum: ['active','closed'], default: 'active' },
  lastDate:     { type: Date },
}, { timestamps: true });

JobSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Job', JobSchema);
