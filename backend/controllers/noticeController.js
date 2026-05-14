const Notice = require('../models/Notice');

exports.getNotices = async (req, res) => {
  const { role } = req.query;
  const query = { isActive: true };
  if (role) query.target = { $in: [role, 'all'] };
  const notices = await Notice.find(query).populate('createdBy', 'name').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: notices });
};

exports.createNotice = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const notice = await Notice.create(req.body);
    
    if (req.io) {
      req.io.emit('newNotice', notice);
    }
    
    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create notice' });
  }
};

exports.updateNotice = async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!notice) return res.status(404).json({ success: false, error: 'Notice not found' });
  res.status(200).json({ success: true, data: notice });
};

exports.deleteNotice = async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Notice deleted' });
};
