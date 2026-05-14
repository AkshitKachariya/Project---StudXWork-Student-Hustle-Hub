const Job = require('../models/Job');
const Application = require('../models/Application');

exports.getJobs = async (req, res) => {
  const { page = 1, limit = 10, type, search } = req.query;
  const query = { status: 'active' };
  if (type) query.type = type;
  if (search) query.title = { $regex: search, $options: 'i' };
  
  const options = { 
    page: parseInt(page), 
    limit: parseInt(limit), 
    populate: { path: 'recruiter', select: 'name companyName profilePicture' }, 
    sort: { createdAt: -1 } 
  };

  try {
    const jobs = await Job.paginate(query, options);

    if (req.user && req.user.role === 'student') {
      const jobIds = jobs.docs.map(j => j._id);
      const applications = await Application.find({
        applicant: req.user.id,
        job: { $in: jobIds },
        status: { $ne: 'rejected' }
      });
      const appliedJobIds = applications.map(a => a.job.toString());

      jobs.docs = jobs.docs.map(j => {
        const jObj = j.toObject();
        jObj.hasApplied = appliedJobIds.includes(j._id.toString());
        return jObj;
      });
    }

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name companyName profilePicture companyWebsite');
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    
    const jobObj = job.toObject();
    
    if (req.user && req.user.role === 'student') {
      const application = await Application.findOne({
        applicant: req.user.id,
        job: req.params.id,
        status: { $ne: 'rejected' }
      });
      jobObj.hasApplied = !!application;
    }

    res.status(200).json({ success: true, data: jobObj });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch job details' });
  }
};

exports.createJob = async (req, res) => {
  req.body.recruiter = req.user.id;
  const job = await Job.create(req.body);
  if (req.io) req.io.emit('newListing', { type: 'job', title: job.title });
  res.status(201).json({ success: true, data: job });
};

exports.updateJob = async (req, res) => {
  let job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, error: 'Not authorized' });
  job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json({ success: true, data: job });
};

exports.deleteJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  if (job.recruiter.toString() !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ success: false, error: 'Not authorized' });
  await job.deleteOne();
  res.status(200).json({ success: true, message: 'Job deleted' });
};

exports.getMyJobs = async (req, res) => {
  const jobs = await Job.find({ recruiter: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: jobs.length, data: jobs });
};
