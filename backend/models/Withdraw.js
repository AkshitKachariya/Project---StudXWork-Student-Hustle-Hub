const mongoose = require('mongoose');

const WithdrawSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  amount:        { type: Number, required: true },
  method:        { type: String, enum: ['upi','bank','paypal'], required: true },
  accountDetail: { type: String, required: true },
  status:        { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  adminNote:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Withdraw', WithdrawSchema);
