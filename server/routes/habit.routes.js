const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Habit = require('../models/Habit');

// @route   GET api/habits
// @desc    Get all habits
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user.id }).sort({ order: 1 });
        res.json(habits);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/habits
// @desc    Create a habit
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, frequency } = req.body;
        // Get max order to append vertically
        const lastHabit = await Habit.findOne({ userId: req.user.id }).sort({ order: -1 });
        const order = lastHabit ? lastHabit.order + 1 : 0;

        const newHabit = new Habit({
            userId: req.user.id,
            name,
            frequency,
            order
        });
        const habit = await newHabit.save();
        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/habits/reorder
// @desc    Update habit order
// @access  Private
// MOVED BEFORE /:id TO PREVENT CONFLICT
router.put('/reorder', auth, async (req, res) => {
    try {
        const { habits } = req.body; // Array of { _id, order }

        // Bulk update
        const updates = habits.map(h => {
            return {
                updateOne: {
                    filter: { _id: h._id, userId: req.user.id },
                    update: { order: h.order }
                }
            };
        });

        await Habit.bulkWrite(updates);
        res.json({ msg: 'Habits reordered' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/habits/:id
// @desc    Update a habit
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { name } = req.body;
        let habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ msg: 'Not found' });
        if (habit.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        habit.name = name || habit.name;
        await habit.save();
        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/habits/:id/toggle
// @desc    Toggle habit completion for a specific date
// @access  Private
router.put('/:id/toggle', auth, async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
        if (!habit) return res.status(404).json({ msg: 'Not found' });

        const targetDate = req.body.date ? new Date(req.body.date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Check if exists
        const index = habit.completedDates.findIndex(d => new Date(d).setHours(0, 0, 0, 0) === targetDate.getTime());

        if (index !== -1) {
            // Remove (Toggle Off)
            habit.completedDates.splice(index, 1);
        } else {
            // Add (Toggle On)
            habit.completedDates.push(targetDate);
        }

        // Recalculate Streak (Expensive but accurate)
        // Sort dates
        habit.completedDates.sort((a, b) => new Date(a) - new Date(b));

        let currentStreak = 0;
        let maxStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // We iterate backwards from today to find current streak
        let d = new Date(today);
        let found = true;

        // Loop to check consecutive days backwards
        while (found) {
            const dateCheck = d.getTime();
            const hasDate = habit.completedDates.some(cd => new Date(cd).setHours(0, 0, 0, 0) === dateCheck);

            if (hasDate) {
                currentStreak++;
                d.setDate(d.getDate() - 1);
            } else {
                // Allow missing TODAY if we are checking streak (streak is valid if yesterday was done)
                if (dateCheck === today.getTime()) {
                    d.setDate(d.getDate() - 1);
                    // Don't increment streak, but continue to check yesterday
                } else {
                    found = false;
                }
            }
        }

        habit.streak = currentStreak;

        // Calculate Streak again but properly this time if the above simple loop is insufficient for "Best Streak"
        // For simplicity in this iteration, we keep the previous best logic or just update max if current > best
        if (habit.streak > habit.bestStreak) {
            habit.bestStreak = habit.streak;
        }

        await habit.save();
        res.json(habit);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ msg: 'Habit not found' });

        // Check user
        if (habit.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await habit.deleteOne();
        res.json({ msg: 'Habit removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
