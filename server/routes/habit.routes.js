const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Habit = require('../models/Habit');
const validate = require('../middleware/validate.middleware');
const {
    createHabitSchema,
    updateHabitSchema,
    toggleHabitSchema,
    reorderHabitsSchema,
    deleteHabitSchema
} = require('../schemas/habit.schemas');

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
// @access  Private
router.post('/', auth, validate(createHabitSchema), async (req, res) => {
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
// MOVED BEFORE /:id TO PREVENT CONFLICT
router.put('/reorder', auth, validate(reorderHabitsSchema), async (req, res) => {
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

// @route   PUT api/habits/:id/toggle
// @desc    Toggle habit completion for a specific date
// @access  Private
// @access  Private
router.put('/:id/toggle', auth, validate(toggleHabitSchema), async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
        if (!habit) return res.status(404).json({ msg: 'Not found' });

        // Input expected: { date: "YYYY-MM-DD" }
        // We use UTC Noon to avoid timezone boundary issues
        let targetDateStr = req.body.date;

        // Fallback for getting string if older frontend sends full ISO
        if (targetDateStr && targetDateStr.includes('T')) {
            targetDateStr = targetDateStr.split('T')[0];
        }
        if (!targetDateStr) {
            const now = new Date();
            targetDateStr = now.toISOString().split('T')[0];
        }

        const targetDate = new Date(`${targetDateStr}T12:00:00.000Z`);

        // Helper: Convert any date date object to "YYYY-MM-DD" key based on UTC
        const toKey = (d) => d.toISOString().split('T')[0];

        // 1. Normalize EXISTING dates in DB to handle messy legacy data
        // We map all existing dates to their YYYY-MM-DD keys (UTC) and recreate them as Noon UTC objects
        // This effectively "snaps" all previous checks to a safe midday timestamp
        let dateSet = new Set(habit.completedDates.map(d => toKey(new Date(d))));

        // 2. Toggle logic
        const toggleKey = toKey(targetDate);
        if (dateSet.has(toggleKey)) {
            dateSet.delete(toggleKey);
        } else {
            dateSet.add(toggleKey);
        }

        // 3. Rebuild completedDates array from the Set
        habit.completedDates = Array.from(dateSet).map(dateStr => new Date(`${dateStr}T12:00:00.000Z`));

        // 4. Streak Calculation
        // Sort
        const sortedDates = Array.from(dateSet).sort();

        let currentStreak = 0;
        // Calculate "Today" relative to UTC
        // Note: For a user in +5:30, "Today" might change at 18:30 UTC. 
        // We assume "Today" is based on the LAST SUBMITTED DATE or Server Time.
        // To be safe, we check backwards from the "Latest Completed Date" or "Today".

        // Robust Streak Logic:
        // We iterate backwards from "Today (UTC)". 
        // If Today is missing, we check Yesterday. If Yesterday present, Streak continues from there.
        // If Today present, Streak starts there.

        const pad = n => n < 10 ? '0' + n : n;
        const getUTCDateStr = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

        const todayUTC = getUTCDateStr(new Date());

        let cursorDate = new Date();
        let cursorKey = getUTCDateStr(cursorDate);
        let streakFound = true;

        // Initial check: Is "Today" done?
        if (!dateSet.has(cursorKey)) {
            // If not, maybe "Yesterday" was done?
            cursorDate.setUTCDate(cursorDate.getUTCDate() - 1);
            cursorKey = getUTCDateStr(cursorDate);

            if (!dateSet.has(cursorKey)) {
                // Neither Today nor Yesterday is done. Streak is 0.
                streakFound = false;
            }
        }

        if (streakFound) {
            currentStreak = 0;
            while (dateSet.has(cursorKey)) {
                currentStreak++;
                cursorDate.setUTCDate(cursorDate.getUTCDate() - 1);
                cursorKey = getUTCDateStr(cursorDate);
            }
        }

        habit.streak = currentStreak;
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

// @route   PUT api/habits/:id
// @desc    Update a habit
// @access  Private
// @access  Private
router.put('/:id', auth, validate(updateHabitSchema), async (req, res) => {
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

// @route   DELETE api/habits/:id
// @desc    Delete a habit
// @access  Private
// @access  Private
router.delete('/:id', auth, validate(deleteHabitSchema), async (req, res) => {
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
