const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Habit = require('../models/Habit');

// @route   GET api/habits
// @desc    Get all habits
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user.id });
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
        const newHabit = new Habit({
            userId: req.user.id,
            name,
            frequency
        });
        const habit = await newHabit.save();
        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/habits/:id/complete
// @desc    Mark habit as completed for today
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
    try {
        let habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ msg: 'Habit not found' });
        if (habit.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already completed today
        const alreadyCompleted = habit.completedDates.some(date => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });

        if (!alreadyCompleted) {
            habit.completedDates.push(new Date());
            // rudimentary streak logic: if last completion was yesterday, increment streak
            // This is a simplified version.
            habit.streak += 1;
            await habit.save();
        }

        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
