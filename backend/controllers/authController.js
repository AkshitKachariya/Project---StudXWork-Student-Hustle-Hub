const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode)
    .cookie('token', token, { httpOnly: true, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), sameSite: 'strict' })
    .json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ success: false, error: 'All fields are required' });

  const cleanEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });

  const user = await User.create({ 
    name, 
    email: cleanEmail, 
    password, 
    role,
    companyName: role === 'recruiter' ? req.body.companyName : undefined 
  });
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: '🔐 StudXWork – Verify Your Email',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;border:3px solid #1E1E24;padding:32px">
        <h2 style="color:#FF4A5A">StudXWork</h2>
        <p>Hi <strong>${user.name}</strong>, welcome! Use the OTP below to verify your email:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;background:#FFC82C;border:2px solid #1E1E24;padding:16px;text-align:center;margin:20px 0">${otp}</div>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:12px">If you didn't create an account, ignore this email.</p>
      </div>`
    });
    res.status(200).json({ success: true, message: 'OTP sent to your email', userId: user._id });
  } catch (err) {
    user.otp = undefined; user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({ success: false, error: 'Email could not be sent. Check your email config in .env' });
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  if (user.otp !== otp || user.otpExpire < Date.now())
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });

  user.isVerified = true; user.otp = undefined; user.otpExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
};

// RESEND OTP
exports.resendOtp = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  if (user.isVerified) return res.status(400).json({ success: false, error: 'Email already verified' });

  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  user.otp = otp; user.otpExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  try {
    await sendEmail({ email: user.email, subject: '🔐 StudXWork – Resend OTP', html: `<p>Your new OTP: <strong>${otp}</strong></p>` });
    res.status(200).json({ success: true, message: 'OTP resent' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Email could not be sent' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    
    if (!user) {
      console.log(`Login failed: User not found for email ${cleanEmail}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for email ${cleanEmail}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, error: 'EMAIL_NOT_VERIFIED', userId: user._id });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account suspended. Contact admin.' });
    }

    console.log(`Login successful: ${cleanEmail}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
};

// ME
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

// LOGOUT
exports.logout = (req, res) => {
  res.cookie('token', 'none', { 
    expires: new Date(0), 
    httpOnly: true, 
    sameSite: 'strict', 
    path: '/' 
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// FORGOT PASSWORD – send OTP
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ success: false, error: 'No user with that email' });

  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  user.resetPasswordToken = otp; user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: '🔑 StudXWork – Password Reset OTP',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;border:3px solid #1E1E24;padding:32px">
        <h2 style="color:#FF4A5A">Password Reset</h2>
        <p>Your password reset OTP:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;background:#FFC82C;border:2px solid #1E1E24;padding:16px;text-align:center;margin:20px 0">${otp}</div>
        <p>Expires in 10 minutes.</p></div>`
    });
    res.status(200).json({ success: true, message: 'Reset OTP sent to email' });
  } catch (err) {
    user.resetPasswordToken = undefined; user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({ success: false, error: 'Email could not be sent' });
  }
};

// VERIFY RESET OTP
exports.verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email, resetPasswordToken: otp, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  res.status(200).json({ success: true, message: 'OTP verified. Set new password.' });
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email, resetPasswordToken: otp, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });

  user.password = password;
  user.resetPasswordToken = undefined; user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Security: Verify the email matches the logged-in user session (Case-insensitive)
    if (email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Unauthorized email modification attempt' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, error: 'User session invalid' });

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'The current password you entered is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully! Please login again.' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};