const Application = require('../models/Application');
const Task = require('../models/Task');
const Job = require('../models/Job');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');
const mongoose = require('mongoose');

// Student: apply to job or task
exports.apply = async (req, res) => {
  const { jobId, taskId, proposal, bidAmount } = req.body;
  if (!jobId && !taskId)
    return res.status(400).json({ success: false, error: 'Provide a job or task ID' });

  // Prevent duplicate (only if not rejected)
  const dupQuery = { applicant: req.user.id, status: { $ne: 'rejected' } };
  if (jobId) dupQuery.job = jobId;
  if (taskId) dupQuery.task = taskId;
  const existing = await Application.findOne(dupQuery);
  if (existing) return res.status(400).json({ success: false, error: 'Already applied' });

  // Check task is still accepting applications
  if (taskId) {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (!['open', 'in_bidding'].includes(task.status))
      return res.status(400).json({ success: false, error: 'Task is no longer accepting applications' });
    
    // Move to in_bidding on first application
    if (task.status === 'open') {
      task.status = 'in_bidding';
      task.activityLog.push({ action: 'BID_RECEIVED', by: req.user.id, message: 'First bid received', timestamp: new Date() });
      await task.save();
    }
  }

  const app = await Application.create({ applicant: req.user.id, job: jobId || null, task: taskId || null, proposal, bidAmount: bidAmount || 0 });

  // Notify Recruiter
  if (req.io) {
    let recruiterId;
    if (jobId) {
      const job = await Job.findById(jobId);
      recruiterId = job?.recruiter;
    } else if (taskId) {
      const task = await Task.findById(taskId);
      recruiterId = task?.recruiter;
    }
    if (recruiterId) {
      req.io.emit(`newApplication_${recruiterId}`, { appId: app._id });
    }
  }

  res.status(201).json({ success: true, data: app });
};

// Student: my applications
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user.id })
      .populate('job task')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, count: apps.length, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
};

// Recruiter: get applicants for a job or task
exports.getApplicants = async (req, res) => {
  try {
    const { jobId, taskId } = req.query;
    const query = {};
    
    // Security: If specific ID provided, ensure it belongs to this recruiter
    if (jobId) {
      const job = await Job.findOne({ _id: jobId, recruiter: req.user.id });
      if (!job) return res.status(403).json({ success: false, error: 'Unauthorized access to this job' });
      query.job = jobId;
    } else if (taskId) {
      const task = await Task.findOne({ _id: taskId, recruiter: req.user.id });
      if (!task) return res.status(403).json({ success: false, error: 'Unauthorized access to this task' });
      query.task = taskId;
    } else {
      // If no ID provided, find ALL applicants for THIS recruiter's posts
      const [myJobs, myTasks] = await Promise.all([
        Job.find({ recruiter: req.user.id }).select('_id'),
        Task.find({ recruiter: req.user.id }).select('_id')
      ]);
      query.$or = [
        { job: { $in: myJobs.map(j => j._id) } },
        { task: { $in: myTasks.map(t => t._id) } }
      ];
    }

    const apps = await Application.find(query)
      .populate('applicant', 'name email profilePicture skills college')
      .populate('job', 'title')
      .populate('task', 'title budget status assignedTo')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, count: apps.length, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch applicants' });
  }
};

// Recruiter: hire / reject (for JOBS only - tasks use workflow)
exports.updateStatus = async (req, res) => {
  const { status, interview, rejectionReason } = req.body;
  const appId = req.params.id;

  try {
    const application = await Application.findById(appId);
    if (!application) return res.status(404).json({ success: false, error: 'Application not found' });

    application.status = status;
    if (status === 'rejected') {
      application.rejectionReason = rejectionReason || 'No reason provided';
    }

    if (status === 'accepted' && interview) {
      if (!interview.date || !interview.time || !interview.location) {
        return res.status(400).json({ success: false, error: 'Interview Date, Time, and Location are required' });
      }
      application.interviewDetails = {
        date: interview.date,
        time: interview.time,
        location: interview.location,
        message: interview.message || ""
      };
      // For backward compatibility (if any)
      application.interview = application.interviewDetails;
      
      application.markModified('interviewDetails');
      application.markModified('interview');
    }

    await application.save();
    
    // Fetch again with populations for the response
    const updatedApp = await Application.findById(appId).populate('job task applicant');

    // Real-time notify student
    if (req.io) {
      req.io.emit(`appUpdate_${updatedApp.applicant._id}`);
    }

    res.status(200).json({ success: true, data: updatedApp });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// Recruiter: release payment after task completion (LEGACY - kept for backward compat)
exports.releasePayment = async (req, res) => {
  const application = await Application.findById(req.params.id).populate('task').populate('applicant');
  if (!application) return res.status(404).json({ success: false, error: 'Application not found' });
  if (application.status !== 'accepted')
    return res.status(400).json({ success: false, error: 'Application not accepted' });

  const amount = application.task ? application.task.budget : application.bidAmount;

  // Credit student wallet
  const student = await User.findById(application.applicant._id);
  student.walletBalance += amount;
  await student.save();

  await WalletTx.create({ user: student._id, type: 'credit', amount, source: 'task', reference: application._id.toString(), note: 'Payment for completed task' });

  // Mark task completed
  if (application.task) await Task.findByIdAndUpdate(application.task._id, { status: 'completed' });

  res.status(200).json({ success: true, message: `Payment of ₹${amount} released to ${student.name}` });

  // Real-time notify student
  if (req.io) {
    req.io.emit(`walletUpdate_${student._id}`, { balance: student.walletBalance, amount });
  }
};
