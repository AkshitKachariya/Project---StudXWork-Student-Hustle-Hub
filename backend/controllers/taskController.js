const Task = require('../models/Task');
const Application = require('../models/Application');

exports.getTasks = async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) query.title = { $regex: search, $options: 'i' };

  try {
    const options = { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      populate: { path: 'recruiter', select: 'name companyName profilePicture' }, 
      sort: { createdAt: -1 } 
    };
    
    const tasks = await Task.paginate(query, options);

    // If user is logged in as student, check if they applied to these tasks
    if (req.user && req.user.role === 'student') {
      const taskIds = tasks.docs.map(t => t._id);
      const applications = await Application.find({ 
        applicant: req.user.id, 
        task: { $in: taskIds },
        status: { $ne: 'rejected' }
      });
      const appliedTaskIds = applications.map(a => a.task.toString());

      // Manually set hasApplied flag
      tasks.docs = tasks.docs.map(t => {
        const tObj = t.toObject();
        tObj.hasApplied = appliedTaskIds.includes(t._id.toString());
        return tObj;
      });
    }

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('recruiter', 'name companyName profilePicture')
      .populate('assignedTo', 'name profilePicture');
    
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    const taskObj = task.toObject();
    
    if (req.user && req.user.role === 'student') {
      const application = await Application.findOne({ 
        applicant: req.user.id, 
        task: req.params.id,
        status: { $ne: 'rejected' }
      });
      taskObj.hasApplied = !!application;
    }

    res.status(200).json({ success: true, data: taskObj });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch task details' });
  }
};

exports.createTask = async (req, res) => {
  try {
    req.body.recruiter = req.user.id;
    const task = await Task.create(req.body);
    if (req.io) req.io.emit('newListing', { type: 'task', title: task.title });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create task' });
  }
};

exports.updateTask = async (req, res) => {
  let task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  if (task.recruiter.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, error: 'Not authorized' });
  task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: task });
};

exports.deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  if (task.recruiter.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, error: 'Not authorized' });
  await task.deleteOne();
  res.status(200).json({ success: true, message: 'Task deleted' });
};

// Recruiter: get MY tasks
exports.getMyTasks = async (req, res) => {
  const tasks = await Task.find({ recruiter: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
};
