const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register, login, verifyOtp, resendOtp, getMe, logout,
  forgotPassword, verifyResetOtp, resetPassword, changePassword
} = require('../controllers/authController');

router.post('/register',          register);
router.post('/login',             login);
router.post('/verify-otp',        verifyOtp);
router.post('/resend-otp',        resendOtp);
router.post('/forgot-password',   forgotPassword);
router.post('/verify-reset-otp',  verifyResetOtp);
router.post('/reset-password',    resetPassword);
router.get('/me',                 protect, getMe);
router.put('/change-password',    protect, changePassword);
router.get('/logout',             logout);

module.exports = router;
