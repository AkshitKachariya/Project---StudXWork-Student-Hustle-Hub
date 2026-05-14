const express = require('express');
const router = express.Router();
const { 
  requestDeposit, 
  requestWithdrawal, 
  getWalletHistory, 
  getPendingRequests, 
  processRequest 
} = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/deposit', requestDeposit);
router.post('/withdraw', requestWithdrawal);
router.get('/history', getWalletHistory);

// Admin only routes
router.get('/admin/requests', authorize('admin'), getPendingRequests);
router.put('/admin/requests/:id', authorize('admin'), processRequest);

module.exports = router;
