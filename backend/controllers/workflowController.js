const Task = require('../models/Task');
const Application = require('../models/Application');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');

// ── VALID STATE TRANSITIONS (Finite State Machine) ──
const VALID_TRANSITIONS = {
  open:        ['in_bidding', 'assigned'],
  in_bidding:  ['assigned', 'open'],
  assigned:    ['in_progress'],
  in_progress: ['submitted'],
  submitted:   ['review'],
  review:      ['completed', 'revision', 'rejected'],
  revision:    ['submitted'],
  completed:   [],
  rejected:    [],
};

function canTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

function addLog(task, action, userId, message = '') {
  task.activityLog.push({ action, by: userId, message, timestamp: new Date() });
}

// ─── 1. ACCEPT BID (Recruiter) ─────────────────────────
// Recruiter accepts a student's bid → deposits escrow → assigns task
exports.acceptBid = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const app = await Application.findById(applicationId)
      .populate('task').populate('applicant');
    
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });
    if (!app.task) return res.status(400).json({ success: false, error: 'No task linked to this application' });

    const task = await Task.findById(app.task._id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (task.recruiter.toString() !== req.user.id)
      return res.status(403).json({ success: false, error: 'Not authorized' });
    if (task.status !== 'open' && task.status !== 'in_bidding')
      return res.status(400).json({ success: false, error: `Cannot assign task in '${task.status}' status` });

    // Escrow: deduct from recruiter wallet
    const escrowAmount = app.bidAmount > 0 ? app.bidAmount : task.budget;
    const recruiter = await User.findById(req.user.id);
    if (recruiter.walletBalance < escrowAmount)
      return res.status(400).json({ success: false, error: `Insufficient wallet balance. Need ₹${escrowAmount} for escrow. Current balance: ₹${recruiter.walletBalance}` });

    // Deduct escrow from recruiter
    recruiter.walletBalance -= escrowAmount;
    await recruiter.save();
    await WalletTx.create({ user: recruiter._id, type: 'debit', amount: escrowAmount, source: 'task', reference: task._id.toString(), note: `Escrow deposit for task: ${task.title}` });

    // Update task
    task.assignedTo = app.applicant._id;
    task.status = 'in_progress';
    task.escrowAmount = escrowAmount;
    task.escrowDeposited = true;
    addLog(task, 'ASSIGNED', req.user.id, `Assigned to ${app.applicant.name} with escrow ₹${escrowAmount}`);
    addLog(task, 'STATUS_CHANGE', req.user.id, 'Status: open → in_progress');
    await task.save();

    // Accept this application, reject others
    app.status = 'accepted';
    await app.save();
    await Application.updateMany(
      { task: task._id, _id: { $ne: app._id }, status: 'pending' },
      { status: 'rejected' }
    );

    // Real-time notifications
    if (req.io) {
      req.io.emit(`appUpdate_${app.applicant._id}`);
      req.io.emit(`taskUpdate_${app.applicant._id}`, { taskId: task._id, status: 'in_progress' });
      req.io.emit(`walletUpdate_${recruiter._id}`, { balance: recruiter.walletBalance, amount: -escrowAmount });
    }

    res.status(200).json({ success: true, message: `Task assigned to ${app.applicant.name}. ₹${escrowAmount} held in escrow.`, data: task });
  } catch (error) {
    console.error('AcceptBid Error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept bid' });
  }
};

// ─── 2. SUBMIT WORK (Student) ───────────────────────────
exports.submitWork = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, links, fileUrls } = req.body;
    const task = await Task.findById(taskId);
    
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if ((task.assignedTo?.toString()) !== req.user.id)
      return res.status(403).json({ success: false, error: 'You are not assigned to this task' });
    if (task.status !== 'in_progress' && task.status !== 'revision')
      return res.status(400).json({ success: false, error: `Cannot submit in '${task.status}' status` });

    // Build submission object
    const version = task.submissions.length + 1;

    // Parse file URLs from request body
    let parsedFileUrls = [];
    try { parsedFileUrls = fileUrls ? (typeof fileUrls === 'string' ? JSON.parse(fileUrls) : fileUrls) : []; } catch { parsedFileUrls = []; }
    
    const files = parsedFileUrls.map(f => ({
      filename: f.name || f.url.split('/').pop() || 'file',
      originalName: f.name || f.url.split('/').pop() || 'file',
      path: f.url,
      size: 0
    }));

    let parsedLinks = [];
    try { parsedLinks = links ? (typeof links === 'string' ? JSON.parse(links) : links) : []; } catch { parsedLinks = []; }

    const submission = { version, message: message || '', files, links: parsedLinks, submittedAt: new Date() };
    task.submissions.push(submission);
    task.currentSubmission = task.submissions.length - 1;
    const oldStatus = task.status;
    task.status = 'submitted';
    task.revisionFeedback = '';
    addLog(task, 'SUBMITTED', req.user.id, `Submission v${version} uploaded`);
    addLog(task, 'STATUS_CHANGE', req.user.id, `Status: ${oldStatus} → submitted`);
    await task.save();

    // Notify recruiter
    if (req.io) {
      req.io.emit(`taskUpdate_${task.recruiter}`, { taskId: task._id, status: 'submitted', version });
    }

    res.status(200).json({ success: true, message: `Submission v${version} uploaded successfully`, data: task });
  } catch (error) {
    console.error('SubmitWork Error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit work' });
  }
};

// ─── 3. REVIEW SUBMISSION (Recruiter) ───────────────────
// Recruiter approves, requests revision, or rejects

// 3a. APPROVE
exports.approveSubmission = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('assignedTo', 'name');
    
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (task.recruiter.toString() !== req.user.id)
      return res.status(403).json({ success: false, error: 'Not authorized' });
    if (task.status !== 'submitted' && task.status !== 'review')
      return res.status(400).json({ success: false, error: `Cannot approve in '${task.status}' status` });

    // Release escrow to student
    const student = await User.findById(task.assignedTo._id);
    student.walletBalance += task.escrowAmount;
    await student.save();
    await WalletTx.create({ user: student._id, type: 'credit', amount: task.escrowAmount, source: 'task', reference: task._id.toString(), note: `Payment for completed task: ${task.title}` });

    // Update task
    task.status = 'completed';
    task.completedAt = new Date();
    addLog(task, 'APPROVED', req.user.id, `Submission approved. ₹${task.escrowAmount} released to ${student.name}`);
    addLog(task, 'STATUS_CHANGE', req.user.id, 'Status → completed');
    await task.save();

    // Notify student
    if (req.io) {
      req.io.emit(`taskUpdate_${student._id}`, { taskId: task._id, status: 'completed' });
      req.io.emit(`walletUpdate_${student._id}`, { balance: student.walletBalance, amount: task.escrowAmount });
    }

    res.status(200).json({ success: true, message: `Task approved! ₹${task.escrowAmount} released to ${student.name}`, data: task });
  } catch (error) {
    console.error('ApproveSubmission Error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve submission' });
  }
};

// 3b. REQUEST REVISION
exports.requestRevision = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { feedback } = req.body;
    if (!feedback?.trim()) return res.status(400).json({ success: false, error: 'Feedback is required for revision request' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (task.recruiter.toString() !== req.user.id)
      return res.status(403).json({ success: false, error: 'Not authorized' });
    if (task.status !== 'submitted' && task.status !== 'review')
      return res.status(400).json({ success: false, error: `Cannot request revision in '${task.status}' status` });

    task.status = 'revision';
    task.revisionFeedback = feedback;
    task.revisionCount += 1;
    addLog(task, 'REVISION_REQUESTED', req.user.id, `Revision #${task.revisionCount}: ${feedback}`);
    addLog(task, 'STATUS_CHANGE', req.user.id, 'Status → revision');
    await task.save();

    if (req.io) {
      req.io.emit(`taskUpdate_${task.assignedTo}`, { taskId: task._id, status: 'revision', feedback });
    }

    res.status(200).json({ success: true, message: 'Revision requested', data: task });
  } catch (error) {
    console.error('RequestRevision Error:', error);
    res.status(500).json({ success: false, error: 'Failed to request revision' });
  }
};

// 3c. REJECT WORK
exports.rejectWork = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (task.recruiter.toString() !== req.user.id)
      return res.status(403).json({ success: false, error: 'Not authorized' });
    if (task.status !== 'submitted' && task.status !== 'review')
      return res.status(400).json({ success: false, error: `Cannot reject in '${task.status}' status` });

    // Refund escrow to recruiter
    const recruiter = await User.findById(req.user.id);
    recruiter.walletBalance += task.escrowAmount;
    await recruiter.save();
    await WalletTx.create({ user: recruiter._id, type: 'credit', amount: task.escrowAmount, source: 'task', reference: task._id.toString(), note: `Escrow refund - task rejected: ${task.title}` });

    task.status = 'rejected';
    task.rejectionReason = reason || 'Work did not meet requirements';
    addLog(task, 'REJECTED', req.user.id, `Task rejected: ${task.rejectionReason}`);
    addLog(task, 'STATUS_CHANGE', req.user.id, 'Status → rejected');
    await task.save();

    if (req.io) {
      req.io.emit(`taskUpdate_${task.assignedTo}`, { taskId: task._id, status: 'rejected' });
      req.io.emit(`walletUpdate_${recruiter._id}`, { balance: recruiter.walletBalance, amount: task.escrowAmount });
    }

    res.status(200).json({ success: true, message: 'Task rejected. Escrow refunded.', data: task });
  } catch (error) {
    console.error('RejectWork Error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject work' });
  }
};

// ─── 4. GET MY ASSIGNED TASKS (Student) ─────────────────
exports.getMyAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('recruiter', 'name companyName profilePicture')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assigned tasks' });
  }
};

// ─── 5. GET TASK WORKSPACE (Student/Recruiter detailed view) ──
exports.getTaskWorkspace = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('recruiter', 'name companyName profilePicture')
      .populate('assignedTo', 'name profilePicture skills college')
      .populate('activityLog.by', 'name');

    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    // Only allow recruiter (owner) or assigned student
    const userId = req.user.id;
    const isRecruiter = task.recruiter._id.toString() === userId;
    const isStudent = task.assignedTo?._id?.toString() === userId;
    if (!isRecruiter && !isStudent && req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Not authorized to view this workspace' });

    res.status(200).json({ success: true, data: task, role: isRecruiter ? 'recruiter' : 'student' });
  } catch (error) {
    console.error('GetTaskWorkspace Error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
};
