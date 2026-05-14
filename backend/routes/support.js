const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createTicket,
  getTickets,
  getTicket,
  addMessage,
  updateTicket,
  reopenTicket
} = require('../controllers/supportController');

// All routes are protected
router.use(protect);

// User & Admin routes
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicket);
router.post('/:id/messages', addMessage);

// Admin Only
router.patch('/:id', authorize('admin'), updateTicket);

// User Only
router.post('/:id/reopen', authorize('student', 'recruiter'), reopenTicket);

module.exports = router;
