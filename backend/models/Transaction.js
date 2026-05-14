const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [1, 'Amount must be at least 1']
  },
  fees: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['upi', 'bank', 'bank_transfer'],
    required: true
  },
  paymentDetails: {
    // For deposit: User enters their TXN ID. For withdrawal: User enters their UPI/Bank details.
    upiId: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    branchName: String,
    transactionId: String // User provided TXN ID for deposits
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: String,
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema, 'wallet_transactions');

