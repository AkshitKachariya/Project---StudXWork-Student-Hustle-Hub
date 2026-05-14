const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'] },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['student', 'recruiter', 'admin'], default: 'student' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  profilePicture: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  // Student fields
  skills: [String],
  resume: { type: String, default: '' },
  college: { type: String, default: '' },
  // Recruiter fields
  companyName: { type: String, default: '' },
  companyWebsite: { type: String, default: '' },
  companyDescription: { type: String, default: '' },
  // Wallet
  walletBalance: { type: Number, default: 0 },
  // OTP / Reset
  otp: String,
  otpExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
