const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String }, // URL to profile picture
  preferences: {
    theme: { type: String, default: 'dark' },
    aiTone: { type: String, default: 'helpful' },
    voiceEnabled: { type: Boolean, default: false },
    selectedModel: { type: String, default: 'llama-3.3-70b-versatile' },
    productivityTarget: { type: Number, default: 75 }
  },
  lastNotificationCheck: { type: Date, default: Date.now },
  pushSubscriptions: [{
    endpoint: String,
    expirationTime: Date,
    keys: {
      p256dh: String,
      auth: String
    }
  }],
  calendarSyncToken: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isVerified: {
    type: Boolean,
    default: true
  },
  verificationToken: String,
  verificationTokenExpire: Date
});

module.exports = mongoose.model('User', UserSchema);
