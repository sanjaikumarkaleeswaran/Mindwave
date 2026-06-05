const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Event = require('../models/Event');
const ics = require('ics');
const { v4: uuidv4 } = require('uuid');

// Get calendar sync URL
router.get('/sync-url', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.calendarSyncToken) {
      user.calendarSyncToken = uuidv4();
      await user.save();
    }
    
    const host = req.get('host');
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const url = `${baseUrl}/api/calendar/sync/${user.calendarSyncToken}.ics`;
    
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Serve ICS file
router.get('/sync/:token.ics', async (req, res) => {
  try {
    const user = await User.findOne({ calendarSyncToken: req.params.token });
    if (!user) {
      return res.status(404).send('Invalid token');
    }

    const events = [];

    // Fetch goals and milestones
    const goals = await Goal.find({ user: user._id });
    goals.forEach(goal => {
      if(goal.milestones) {
          goal.milestones.forEach(m => {
            if (m.dueDate) {
              const d = new Date(m.dueDate);
              events.push({
                title: `Goal: ${m.title}`,
                description: `Part of goal: ${goal.title}`,
                start: [d.getFullYear(), d.getMonth() + 1, d.getDate()],
                startInputType: 'utc',
                duration: { hours: 1 },
                status: m.completed ? 'CONFIRMED' : 'TENTATIVE',
              });
            }
          });
      }
    });

    // Fetch events
    const userEvents = await Event.find({ user: user._id });
    userEvents.forEach(evt => {
       if(evt.date) {
           const d = new Date(evt.date);
           events.push({
               title: evt.title || 'Event',
               description: evt.description || '',
               start: [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()],
               startInputType: 'utc',
               duration: { hours: 1 }
           });
       }
    });

    if (events.length === 0) {
       // ics package requires at least one event or throws error. Add a placeholder if empty
       events.push({
          title: 'MindWave Sync Connected',
          description: 'Your calendar is successfully synced with MindWave.',
          start: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()],
          duration: { hours: 1 }
       });
    }

    ics.createEvents(events, (error, value) => {
      if (error) {
        console.error('ICS Gen Error:', error);
        return res.status(500).send('Error generating calendar');
      }
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename="mindwave.ics"');
      res.send(value);
    });

  } catch (err) {
    console.error('ICS Route Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
