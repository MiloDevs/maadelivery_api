const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true }, // User ID
    firstName: { type: String, required: true }, // First name
    lastName: { type: String, required: true }, // Last name
    email: { type: String, required: true }, // Email
    phoneNumber: { type: String, required: true }, // Phone number
    lastLogin: { type: Date, required: true }, // Date of last login
    createdAt: { type: Date, required: true }, // Date of creation
    otpStatus: { type: String, enum: ['pending', 'approved', 'expired'] }, // pending, approved, expired
    otp: { type: String }, // OTP
    otpExpiry: { type: Date } // OTP expiry
});

// check if the model is already defined else define it
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;