const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  requestDeposit,
  requestWithdrawal,
  getMyTransactions,
  getAllTransactions,
  updateTransactionStatus
} = require('../controllers/transactionController');

router.get('/my', protect, getMyTransactions);
router.post('/deposit', protect, authorize('recruiter'), requestDeposit);
router.post('/withdraw', protect, requestWithdrawal);

// Admin only routes
router.get('/all', protect, authorize('admin'), getAllTransactions);
router.put('/:id/status', protect, authorize('admin'), updateTransactionStatus);

module.exports = router;
