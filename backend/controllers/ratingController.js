const Rating = require('../models/Rating');
const User = require('../models/User');

exports.addRating = async (req, res) => {
  const { revieweeId, rating, comment, context, refId } = req.body;
  if (revieweeId === req.user.id.toString())
    return res.status(400).json({ success: false, error: 'Cannot rate yourself' });

  const existing = await Rating.findOne({ reviewer: req.user.id, reviewee: revieweeId, refId });
  if (existing) return res.status(400).json({ success: false, error: 'Already rated for this context' });

  const review = await Rating.create({ reviewer: req.user.id, reviewee: revieweeId, rating, comment, context, refId });
  const populated = await review.populate('reviewer', 'name profilePicture');
  res.status(201).json({ success: true, data: populated });
};

exports.getUserRatings = async (req, res) => {
  const ratings = await Rating.find({ reviewee: req.params.userId, isApproved: true })
    .populate('reviewer', 'name profilePicture')
    .sort({ createdAt: -1 });

  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0;
  res.status(200).json({ success: true, average: avg, count: ratings.length, data: ratings });
};

exports.getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find().populate('reviewer', 'name').populate('reviewee', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: ratings });
  } catch (error) {
    console.error('Get All Ratings Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
  }
};

exports.toggleApproval = async (req, res) => {
  const rating = await Rating.findById(req.params.id);
  if (!rating) return res.status(404).json({ success: false, error: 'Rating not found' });
  rating.isApproved = !rating.isApproved;
  await rating.save();
  res.status(200).json({ success: true, data: rating });
};
