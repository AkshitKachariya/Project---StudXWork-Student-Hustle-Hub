const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAnalytics, getUsers, toggleUser, deleteUser,
  getPendingNotes, approveNote, rejectNote,
  getPendingWithdrawals, processWithdrawal,
  getAllTasks, getAllJobs,
  getSupportTickets, replyToTicket,
  broadcastNotice
} = require('../controllers/adminController');
const Support = require('../models/Support');

const adminOnly = [protect, authorize('admin')];

router.get('/analytics',                 ...adminOnly, getAnalytics);
router.get('/users',                     ...adminOnly, getUsers);
router.put('/users/:id/toggle',          ...adminOnly, toggleUser);
router.delete('/users/:id',              ...adminOnly, deleteUser);
router.get('/notes/pending',             ...adminOnly, getPendingNotes);
router.put('/notes/:id/approve',         ...adminOnly, approveNote);
router.delete('/notes/:id/reject',       ...adminOnly, rejectNote);
router.get('/withdrawals',               ...adminOnly, getPendingWithdrawals);
router.put('/withdrawals/:id',           ...adminOnly, processWithdrawal);
router.get('/tasks',                     ...adminOnly, getAllTasks);
router.get('/jobs',                      ...adminOnly, getAllJobs);
router.get('/support',                   ...adminOnly, getSupportTickets);
router.put('/support/:id/reply',         ...adminOnly, replyToTicket);
router.post('/notice',                   ...adminOnly, broadcastNotice);

// Support ticket creation (any logged in user)
router.post('/support', protect, async (req, res) => {
  const { subject, message } = req.body;
  const ticket = await require('../models/Support').create({ user: req.user.id, subject, message });
  res.status(201).json({ success: true, data: ticket });
});

module.exports = router;
