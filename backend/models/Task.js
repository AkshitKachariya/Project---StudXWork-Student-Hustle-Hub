const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const SubmissionSchema = new mongoose.Schema({
  version:   { type: Number, default: 1 },
  message:   { type: String, default: '' },
  files:     [{ filename: String, originalName: String, path: String, size: Number }],
  links:     [{ label: String, url: String }],
  submittedAt: { type: Date, default: Date.now },
});

const ActivityLogSchema = new mongoose.Schema({
  action:    { type: String, required: true },
  by:        { type: mongoose.Schema.ObjectId, ref: 'User' },
  message:   { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

const TaskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  budget:      { type: Number, required: true },
  deadline:    { type: Date, required: true },
  skills:      [String],
  recruiter:   { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  assignedTo:  { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  status:      { 
    type: String, 
    enum: ['open','in_bidding','assigned','in_progress','submitted','review','revision','completed','rejected'], 
    default: 'open' 
  },
  isApproved:  { type: Boolean, default: true },

  // Escrow
  escrowAmount:   { type: Number, default: 0 },
  escrowDeposited: { type: Boolean, default: false },

  // Submissions (version history)
  submissions:    [SubmissionSchema],
  currentSubmission: { type: Number, default: 0 }, // index pointer

  // Revision feedback
  revisionFeedback: { type: String, default: '' },
  revisionCount:    { type: Number, default: 0 },

  // Rejection reason
  rejectionReason:  { type: String, default: '' },

  // Activity log (audit trail)
  activityLog: [ActivityLogSchema],

  // Completion
  completedAt: { type: Date, default: null },
  ratingDone:  { recruiter: { type: Boolean, default: false }, student: { type: Boolean, default: false } },
}, { timestamps: true });

TaskSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Task', TaskSchema);
