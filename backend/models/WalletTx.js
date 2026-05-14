const mongoose = require('mongoose');

const WalletTxSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['credit','debit'], required: true },
  amount:    { type: Number, required: true },
  source:    { type: String, enum: ['task','job','note','withdraw','topup','admin'], required: true },
  reference: { type: String, default: '' },
  note:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('WalletTx', WalletTxSchema);
