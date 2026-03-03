const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Goal = require('../models/Goal');

// GET all goals
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(goals);
    } catch (err) {
        console.error('GET /goals error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// POST create goal
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, category, targetDate, color, milestones } = req.body;
        if (!title) return res.status(400).json({ msg: 'Title is required' });

        const goal = new Goal({
            userId: req.user.id,
            title,
            description,
            category,
            targetDate,
            color,
            milestones: (milestones || []).map(m => ({ text: m, completed: false }))
        });
        await goal.save();
        res.json(goal);
    } catch (err) {
        console.error('POST /goals error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// PUT update goal
router.put('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        const allowed = ['title', 'description', 'category', 'targetDate', 'progress', 'status', 'color', 'milestones'];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) goal[field] = req.body[field];
        });
        await goal.save();
        res.json(goal);
    } catch (err) {
        console.error('PUT /goals/:id error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// PATCH toggle milestone
router.patch('/:id/milestone/:milestoneId', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        const milestone = goal.milestones.id(req.params.milestoneId);
        if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

        milestone.completed = !milestone.completed;
        milestone.completedAt = milestone.completed ? new Date() : undefined;
        await goal.save();
        res.json(goal);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// PATCH add milestone
router.patch('/:id/milestone', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        goal.milestones.push({ text: req.body.text, completed: false });
        await goal.save();
        res.json(goal);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE goal
router.delete('/:id', auth, async (req, res) => {
    try {
        await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ msg: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET search endpoint (used by global search)
// GET /api/goals/search?q=query
router.get('/search', auth, async (req, res) => {
    try {
        const q = req.query.q || '';
        const goals = await Goal.find({
            userId: req.user.id,
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        }).limit(10);
        res.json(goals);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
