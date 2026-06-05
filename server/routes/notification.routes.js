const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const auth = require('../middleware/auth');
const User = require('../models/User');

webpush.setVapidDetails(
  'mailto:admin@mindwave.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Get VAPID public key
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push
router.post('/subscribe', auth, async (req, res) => {
  try {
    const subscription = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Initialize array if undefined
    if (!user.pushSubscriptions) {
        user.pushSubscriptions = [];
    }

    // remove existing duplicate if exists (by endpoint)
    user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
    user.pushSubscriptions.push(subscription);
    await user.save();
    
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error saving subscription', error: error.message });
  }
});

// Optional: Manual test trigger
router.post('/test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(400).json({ message: 'No subscriptions found' });
    }
    
    const payload = JSON.stringify({ title: 'MindWave', body: 'Test push notification!' });
    const sendPromises = user.pushSubscriptions.map(sub => webpush.sendNotification(sub, payload));
    
    await Promise.all(sendPromises);
    res.json({ success: true, message: 'Push sent' });
  } catch (error) {
    res.status(500).json({ message: 'Push failed', error: error.message });
  }
});

module.exports = router;
