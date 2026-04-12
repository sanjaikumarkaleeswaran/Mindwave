const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Habit = require('../models/Habit');
const Journal = require('../models/Journal');
const Conversation = require('../models/Conversation');
const Goal = require('../models/Goal');
const Expense = require('../models/Expense');
const { searchSimilarChunks } = require('../utils/vectorStore');

// GET /api/search?q=query
router.get('/', auth, async (req, res) => {
    try {
        const q = req.query.q || '';
        if (!q || q.trim().length < 2) {
            return res.json({ habits: [], journals: [], conversations: [], goals: [], expenses: [] });
        }

        const regex = { $regex: q, $options: 'i' };
        const userId = req.user.id;

        const [habits, journals, conversations, goals, expenses, documents] = await Promise.all([
            Habit.find({ userId, name: regex }).limit(5).lean(),
            Journal.find({ userId, $or: [{ title: regex }, { content: regex }, { tags: regex }] })
                .limit(5)
                .select('title content mood date tags')
                .lean(),
            Conversation.find({ userId, title: regex }).limit(5).lean(),
            Goal.find({ userId, $or: [{ title: regex }, { description: regex }] }).limit(5).lean(),
            Expense.find({ userId, $or: [{ category: regex }, { note: regex }] }).limit(5).lean(),
            searchSimilarChunks(userId, q, null, 3) // Global search (no convo filter)
        ]);

        res.json({ habits, journals, conversations, goals, expenses, documents });
    } catch (err) {
        console.error('Search Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET /api/search/stats — dashboard analytics endpoint
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const [habits, journals, goals] = await Promise.all([
            Habit.find({ userId }).lean(),
            Journal.find({ userId }).sort({ date: -1 }).lean(),
            Goal.find({ userId }).lean()
        ]);

        // Mood distribution (last 30 days)
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        const recentJournals = journals.filter(j => new Date(j.date) >= last30);

        const moodCounts = { great: 0, good: 0, okay: 0, bad: 0, terrible: 0 };
        recentJournals.forEach(j => { if (j.mood && moodCounts[j.mood] !== undefined) moodCounts[j.mood]++; });

        // Productivity score (habit completion % this week avg + journal streak)
        const today = new Date();
        const getLocalDateStr = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };

        const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i); return d;
        });

        const weeklyHabitAvg = last7.reduce((sum, d) => {
            if (!habits.length) return sum;
            const dayStr = getLocalDateStr(d);
            const done = habits.filter(h => h.completedDates.some(cd => getLocalDateStr(new Date(cd)) === dayStr)).length;
            return sum + (done / habits.length) * 100;
        }, 0) / 7;

        // Journal streak (consecutive days with an entry)
        let journalStreak = 0;
        for (let i = 0; i < 30; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const hasEntry = journals.some(j => new Date(j.date).toISOString().split('T')[0] === dStr);
            if (hasEntry) journalStreak++;
            else break;
        }

        // Goal stats
        const activeGoals = goals.filter(g => g.status === 'active').length;
        const completedGoals = goals.filter(g => g.status === 'completed').length;
        const avgGoalProgress = goals.length > 0
            ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
            : 0;

        // Best streak across habits
        const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0)) : 0;
        const totalHabitCompletions = habits.reduce((s, h) => s + h.completedDates.length, 0);

        // Productivity score (weighted)
        const productivityScore = Math.round(
            (weeklyHabitAvg * 0.5) +
            (Math.min(journalStreak, 7) / 7 * 100 * 0.3) +
            (avgGoalProgress * 0.2)
        );

        res.json({
            habits: {
                total: habits.length,
                bestStreak,
                totalCompletions: totalHabitCompletions,
                weeklyAvg: Math.round(weeklyHabitAvg)
            },
            journal: {
                total: journals.length,
                streak: journalStreak,
                moodCounts,
                recentCount: recentJournals.length
            },
            goals: {
                total: goals.length,
                active: activeGoals,
                completed: completedGoals,
                avgProgress: avgGoalProgress
            },
            productivityScore
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
