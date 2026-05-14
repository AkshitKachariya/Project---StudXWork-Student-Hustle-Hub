const User = require('../models/User');
const Job = require('../models/Job');
const Task = require('../models/Task');
const Note = require('../models/Note');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const Support = require('../models/Support');
const Notice = require('../models/Notice');
const Rating = require('../models/Rating');
const Message = require('../models/Message');
const WalletTx = require('../models/WalletTx');
const AdminRevenue = require('../models/AdminRevenue');

exports.getCounters = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'User not found in request' });
    
    const role = (req.user.role || '').toLowerCase();
    const userId = req.user.id;
    console.log(`[StatsAPI] role=${role}, userId=${userId}`);
    
    let data = {};
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (role === 'admin') {
      const [
        students, recruiters, jobs, tasks, notes, 
        depositsAll, depositsPending, depositsNew,
        withdrawalsAll, withdrawalsPending, withdrawalsNew,
        ratings, notices,
        supportsAll, supportsNew, supportsPending,
        revenue, adminFees
      ] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'recruiter' }),
        Job.countDocuments(),
        Task.countDocuments(),
        Note.countDocuments(),
        Transaction.countDocuments({ type: 'deposit' }),
        Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
        Transaction.countDocuments({ type: 'deposit', createdAt: { $gte: yesterday } }),
        Transaction.countDocuments({ type: 'withdrawal' }),
        Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
        Transaction.countDocuments({ type: 'withdrawal', createdAt: { $gte: yesterday } }),
        Rating.countDocuments(),
        Notice.countDocuments({ isActive: true }),
        Support.countDocuments(),
        Support.countDocuments({ createdAt: { $gte: yesterday } }),
        Support.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
        WalletTx.aggregate([{ $match: { type: 'credit', source: { $in: ['task','note'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        AdminRevenue.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
      ]);

      data = {
        users: students + recruiters,
        jobs, tasks, notes,
        deposits: { total: depositsAll, pending: depositsPending, new: depositsNew },
        withdrawals: { total: withdrawalsAll, pending: withdrawalsPending, new: withdrawalsNew },
        ratings, notices,
        supports: { total: supportsAll, new: supportsNew, pending: supportsPending },
        totalRevenue: Number((revenue[0]?.total || 0) + (adminFees[0]?.total || 0)).toFixed(2)
      };
    } else if (role === 'recruiter') {
      const myJobIds = await Job.find({ recruiter: userId }).distinct('_id');
      const myTaskIds = await Task.find({ recruiter: userId }).distinct('_id');

      const [
        myJobsCount, myTasksCount,
        appsAll, appsPending, appsNew,
        msgsAll, msgsNew,
        noticesCount
      ] = await Promise.all([
        Job.countDocuments({ recruiter: userId }),
        Task.countDocuments({ recruiter: userId }),
        Application.countDocuments({ $or: [{ job: { $in: myJobIds } }, { task: { $in: myTaskIds } }] }),
        Application.countDocuments({ status: 'pending', $or: [{ job: { $in: myJobIds } }, { task: { $in: myTaskIds } }] }),
        Application.countDocuments({ createdAt: { $gte: yesterday }, $or: [{ job: { $in: myJobIds } }, { task: { $in: myTaskIds } }] }),
        Message.countDocuments({ receiver: userId }),
        Message.countDocuments({ receiver: userId, isRead: false }),
        Notice.countDocuments({ isActive: true, target: { $in: ['all', 'recruiter'] } })
      ]);

      data = {
        listings: { jobs: myJobsCount, tasks: myTasksCount },
        applications: { total: appsAll, pending: appsPending, new: appsNew },
        messages: { total: msgsAll, new: msgsNew, pending: msgsNew },
        notice: noticesCount
      };
    } else if (role === 'student') {
      const [
        browseTasks, browseJobs,
        myApps, myTasks,
        notesCount,
        msgsAll, msgsNew,
        noticesCount
      ] = await Promise.all([
        Task.countDocuments({ status: { $in: ['open', 'in_bidding'] } }),
        Job.countDocuments({ status: 'active' }),
        Application.countDocuments({ applicant: userId }),
        Task.countDocuments({ assignedTo: userId }),
        Note.countDocuments({ uploader: userId }),
        Message.countDocuments({ receiver: userId }),
        Message.countDocuments({ receiver: userId, isRead: false }),
        Notice.countDocuments({ isActive: true, target: { $in: ['all', 'student'] } })
      ]);

      data = {
        browseTasks,
        browseJobs,
        myApplications: myApps,
        myTasks,
        studyNotes: notesCount,
        messages: { total: msgsAll, new: msgsNew, pending: msgsNew },
        notice: noticesCount
      };
    } else {
      console.log(`[StatsAPI] Unrecognized role: "${role}"`);
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[StatsAPI] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};
