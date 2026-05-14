const User = require('../models/User');
const Task = require('../models/Task');
const Job = require('../models/Job');
const Note = require('../models/Note');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const WalletTx = require('../models/WalletTx');
const Rating = require('../models/Rating');
const Support = require('../models/Support');
const Notice = require('../models/Notice');
const AdminRevenue = require('../models/AdminRevenue');

// Analytics Dashboard
exports.getAnalytics = async (req, res) => {
  try {
    const [students, recruiters, tasks, jobs, notes, applications, revenue, adminFees] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'recruiter' }),
      Task.countDocuments(),
      Job.countDocuments(),
      Note.countDocuments({ isApproved: true }),
      Application.countDocuments(),
      WalletTx.aggregate([{ $match: { type: 'credit', source: { $in: ['task','note'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      AdminRevenue.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    // Robust sum for deposits and withdrawals (Matching frontend filtering logic)
    const allTx = await Transaction.find().lean();
    
    const totalDep = allTx
      .filter(t => t.type === 'deposit' && (t.status || '').toLowerCase() === 'approved')
      .reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0);
      
    const totalWith = allTx
      .filter(t => t.type === 'withdrawal' && (t.status || '').toLowerCase() === 'approved')
      .reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0);

    res.status(200).json({ success: true, data: { 
      students, 
      recruiters, 
      tasks, 
      jobs, 
      notes, 
      applications, 
      totalDeposits: totalDep,
      totalWithdrawals: totalWith,
      totalRevenue: Number((revenue[0]?.total || 0) + (adminFees[0]?.total || 0)).toFixed(2),
      adminFees: Number(adminFees[0]?.total || 0).toFixed(2)
    } });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics data' });
  }
};

// User management
exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = { _id: { $ne: req.user.id } };
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(parseInt(limit)).skip((parseInt(page)-1)*parseInt(limit));
    const total = await User.countDocuments(query);
    res.status(200).json({ success: true, total, data: users });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

exports.toggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();

  // Real-time update via Socket.io
  if (req.io) {
    req.io.emit(`account_status_${user._id}`, { isActive: user.isActive });
  }

  res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'suspended'}`, data: user });
};

// Admin delete user
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'User deleted' });
};

// Notes moderation
exports.getPendingNotes = async (req, res) => {
  const notes = await Note.find({ isApproved: false }).populate('uploader', 'name email');
  res.status(200).json({ success: true, data: notes });
};
exports.approveNote = async (req, res) => {
  const note = await Note.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  res.status(200).json({ success: true, data: note });
};
exports.rejectNote = async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Note rejected and removed' });
};

// Withdraw management
exports.getPendingWithdrawals = async (req, res) => {
  const withdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' }).populate('user', 'name email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: withdrawals });
};
exports.processWithdrawal = async (req, res) => {
  const { status, adminNote } = req.body;
  const withdrawal = await Transaction.findById(req.params.id).populate('user');
  if (!withdrawal) return res.status(404).json({ success: false, error: 'Request not found' });

  withdrawal.status = status;
  withdrawal.adminNote = adminNote || '';
  await withdrawal.save();

  // If rejected, refund the user
  if (status === 'rejected') {
    const user = await User.findById(withdrawal.user._id);
    user.walletBalance += withdrawal.amount;
    await user.save();
    await WalletTx.create({ user: user._id, type: 'credit', amount: withdrawal.amount, source: 'admin', note: 'Withdrawal rejected – refunded' });
  }

  res.status(200).json({ success: true, data: withdrawal });
};

// All tasks (admin view)
exports.getAllTasks = async (req, res) => {
  const tasks = await Task.find().populate('recruiter', 'name companyName').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: tasks });
};

// All jobs (admin view)
exports.getAllJobs = async (req, res) => {
  const jobs = await Job.find().populate('recruiter', 'name companyName').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: jobs });
};

// Support tickets
exports.getSupportTickets = async (req, res) => {
  const tickets = await Support.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: tickets });
};
exports.replyToTicket = async (req, res) => {
  const ticket = await Support.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
  ticket.replies.push({ adminNote: req.body.reply });
  ticket.status = req.body.status || ticket.status;
  await ticket.save();
  res.status(200).json({ success: true, data: ticket });
};

// Broadcast notice
exports.broadcastNotice = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const notice = await Notice.create(req.body);
    
    // Real-time broadcast
    if (req.io) {
      req.io.emit('newNotice', notice);
    }
    
    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    console.error('Broadcast Notice Error:', error);
    res.status(500).json({ success: false, error: 'Failed to broadcast notice' });
  }
};
