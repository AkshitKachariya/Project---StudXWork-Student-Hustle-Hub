const Transaction = require('../models/Transaction');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');
const AdminRevenue = require('../models/AdminRevenue');

// @desc    Request a deposit
// @route   POST /api/wallet/deposit
// @access  Private
exports.requestDeposit = async (req, res) => {
  try {
    const { amount, method, paymentDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide a valid amount' });
    }

    // 2% fee on deposit
    const fees = amount * 0.02;
    const finalAmount = amount - fees;

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount,
      fees,
      finalAmount,
      method,
      paymentDetails,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Deposit Request Error Details:', JSON.stringify(error, null, 2));
    res.status(500).json({ success: false, error: error.message || 'Something went wrong' });
  }
};

// @desc    Request a withdrawal
// @route   POST /api/wallet/withdraw
// @access  Private
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, paymentDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide a valid amount' });
    }

    const user = await User.findById(req.user.id);
    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
    }

    // 5% fee on withdrawal
    const fees = amount * 0.05;
    const finalAmount = amount - fees;

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'withdrawal',
      amount,
      fees,
      finalAmount,
      method,
      paymentDetails,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Withdrawal Request Error Details:', JSON.stringify(error, null, 2));
    res.status(500).json({ success: false, error: error.message || 'Something went wrong' });
  }
};

// @desc    Get user's wallet history
// @route   GET /api/wallet/history
// @access  Private
exports.getWalletHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    const walletTransactions = await WalletTx.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: {
        pendingRequests: transactions,
        history: walletTransactions
      }
    });
  } catch (error) {
    console.error('Wallet History Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Admin: Get all pending requests
// @route   GET /api/wallet/admin/requests
// @access  Private/Admin
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Transaction.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    console.log(`[ADMIN] Total Transactions Found: ${requests.length}`);
    requests.forEach(r => console.log(`[ADMIN] ID: ${r._id}, Type: ${r.type}, Status: ${r.status}, Amount: ${r.amount}`));

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Admin Requests Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user wallet balance and info
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get Wallet Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Admin: Process request (Approve/Reject)
// @route   PUT /api/wallet/admin/requests/:id
// @access  Private/Admin
exports.processRequest = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const transaction = await Transaction.findById(req.params.id).populate('user');

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Transaction already processed' });
    }

    if (status === 'approved') {
      const user = await User.findById(transaction.user._id);

      if (transaction.type === 'deposit') {
        // Add finalAmount (after 2% fee) to user's wallet
        user.walletBalance += transaction.finalAmount;
        await user.save();

        // Create WalletTx entry
        await WalletTx.create({
          user: user._id,
          type: 'credit',
          amount: transaction.finalAmount,
          source: 'topup',
          reference: transaction._id,
          note: `Deposit approved. Original: ${transaction.amount}, Fee: ${transaction.fees} deducted.`
        });

        // Record Admin Revenue
        await AdminRevenue.create({
          transaction: transaction._id,
          user: user._id,
          amount: transaction.fees,
          type: 'deposit_fee',
          status: 'collected'
        });

      } else if (transaction.type === 'withdrawal') {
        // Deduct full amount from user's wallet (User requested 'amount', they get 'finalAmount')
        if (user.walletBalance < transaction.amount) {
          return res.status(400).json({ success: false, error: 'Insufficient balance to approve withdrawal' });
        }
        
        user.walletBalance -= transaction.amount;
        await user.save();

        // Create WalletTx entry
        await WalletTx.create({
          user: user._id,
          type: 'debit',
          amount: transaction.amount,
          source: 'withdraw',
          reference: transaction._id,
          note: `Withdrawal approved. Original: ${transaction.amount}, Fee: ${transaction.fees} deducted from payout.`
        });

        // Record Admin Revenue
        await AdminRevenue.create({
          transaction: transaction._id,
          user: user._id,
          amount: transaction.fees,
          type: 'withdrawal_fee',
          status: 'collected'
        });
      }
    }

    transaction.status = status;
    transaction.adminNote = adminNote;
    await transaction.save();

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Process Request Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


