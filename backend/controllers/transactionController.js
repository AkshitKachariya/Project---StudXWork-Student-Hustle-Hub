const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Request deposit (Recruiter only)
// @route   POST /api/transactions/deposit
exports.requestDeposit = async (req, res) => {
  try {
    const { amount, method, paymentDetails } = req.body;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, error: 'Only recruiters can deposit money' });
    }

    // Clean payment details based on method
    const cleanDetails = {};
    if (method === 'upi') cleanDetails.upiId = paymentDetails.upiId;
    if (method === 'card') {
      cleanDetails.cardLast4 = paymentDetails.cardLast4;
      cleanDetails.cardHolderName = paymentDetails.cardHolderName;
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount,
      method,
      paymentDetails: cleanDetails,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Request withdrawal (Student or Recruiter)
// @route   POST /api/transactions/withdraw
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, paymentDetails } = req.body;

    if (req.user.walletBalance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
    }

    // Clean payment details
    const cleanDetails = {};
    if (method === 'upi') cleanDetails.upiId = paymentDetails.upiId;
    if (method === 'bank_transfer') {
      cleanDetails.bankName = paymentDetails.bankName;
      cleanDetails.accountNumber = paymentDetails.accountNumber;
      cleanDetails.ifscCode = paymentDetails.ifscCode;
      cleanDetails.accountHolderName = paymentDetails.accountHolderName;
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'withdrawal',
      amount,
      method,
      paymentDetails: cleanDetails,
      status: 'pending'
    });

    req.user.walletBalance -= amount;
    await req.user.save();

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get my transactions
// @route   GET /api/transactions/my
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all transactions (Admin only)
// @route   GET /api/transactions/all
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user', 'name email role walletBalance').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update transaction status (Admin only)
// @route   PUT /api/transactions/:id/status
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Transaction already processed' });
    }

    transaction.status = status;
    transaction.adminNote = adminNote;

    const user = await User.findById(transaction.user);

    if (status === 'approved') {
      if (transaction.type === 'deposit') {
        user.walletBalance += transaction.amount;
      }
      // If withdrawal, amount was already deducted on request.
    } else if (status === 'rejected') {
      if (transaction.type === 'withdrawal') {
        // Refund the amount
        user.walletBalance += transaction.amount;
      }
    }

    await user.save();
    await transaction.save();

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
