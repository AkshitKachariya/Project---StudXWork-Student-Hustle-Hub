const mongoose = require('mongoose');

const TicketMessageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  message:  { type: String, required: true },
  attachments: [{ filename: String, originalName: String, path: String }],
  createdAt: { type: Date, default: Date.now },
});

const SupportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, required: true },
  title:    { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Task Issue', 'Payment Issue', 'Technical Issue', 'Account Issue', 'General Inquiry'],
    required: true 
  },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  userRole:  { type: String, enum: ['student', 'recruiter'], required: true },
  assignedTo: { type: mongoose.Schema.ObjectId, ref: 'User', default: null }, // Admin ID
  
  relatedTaskId: { type: mongoose.Schema.ObjectId, ref: 'Task', default: null },
  relatedPaymentId: { type: String, default: null }, // Reference to WalletTx or generic payment ID
  
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'LOW' 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], 
    default: 'OPEN' 
  },
  
  attachments: [{ filename: String, originalName: String, path: String }],
  messages: [TicketMessageSchema],
  
  adminNotes: { type: String, default: '' }, // Internal notes for admins
  resolvedAt: { type: Date, default: null },
  closedAt:   { type: Date, default: null },
}, { timestamps: true });

// Generate unique Ticket ID before saving
SupportTicketSchema.pre('validate', async function() {
  if (this.isNew && !this.ticketId) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const prefix = 'STX';
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.ticketId = `${prefix}-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
});

module.exports = mongoose.models.Support || mongoose.model('Support', SupportTicketSchema);
