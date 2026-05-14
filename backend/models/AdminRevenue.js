const mongoose = require('mongoose');

const AdminRevenueSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Transaction',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit_fee', 'withdrawal_fee'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'collected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminRevenue', AdminRevenueSchema);
