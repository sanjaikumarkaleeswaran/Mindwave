const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal');
const Journal = require('../models/Journal');
const Expense = require('../models/Expense');
const Event = require('../models/Event');
const Groq = require('groq-sdk');

// Lazy-initialize so GROQ_API_KEY is read after dotenv loads
let _groq = null;
const getGroq = () => {
    if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return _groq;
};

// ── GET /api/ai/daily-brief ───────────────────────────────────────────────────
// Returns AI-generated daily brief based on user's live data
router.get('/daily-brief', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // Helpers
        const pad = n => n < 10 ? '0' + n : n;
        const todayStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
        const monthStr = now.toISOString().slice(0, 7);

        // Fetch all relevant data in parallel
        const [habits, activeGoals, recentJournal, expenseSummary, upcomingEvents] = await Promise.all([
            Habit.find({ userId }).sort({ order: 1 }),
            Goal.find({ userId, status: 'active' }).sort({ updatedAt: -1 }).limit(5),
            Journal.findOne({ userId }).sort({ date: -1 }),
            Expense.aggregate([
                { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: new Date(`${monthStr}-01`) } } },
                { $group: { _id: '$type', total: { $sum: '$amount' } } }
            ]),
            Event.find({ userId, startDate: { $gte: now }, completed: false }).sort({ startDate: 1 }).limit(3)
        ]);

        // Compute habit completion for today
        const completedToday = habits.filter(h =>
            h.completedDates.some(d => d.toISOString().startsWith(todayStr))
        ).length;
        const habitsDueToday = habits.filter(h => h.frequency === 'daily').length;
        const topStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

        // Expense totals
        const income  = expenseSummary.find(e => e._id === 'income')?.total || 0;
        const expense = expenseSummary.find(e => e._id === 'expense')?.total || 0;

        // Build context for AI
        const context = `
User Data Summary for ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}:

HABITS (${completedToday}/${habitsDueToday} done today):
${habits.slice(0, 5).map(h => `- ${h.name}: streak ${h.streak} days, today: ${h.completedDates.some(d => d.toISOString().startsWith(todayStr)) ? '✅' : '⬜'}`).join('\n')}
Best streak across all habits: ${topStreak} days

ACTIVE GOALS (${activeGoals.length}):
${activeGoals.map(g => `- ${g.title} (${g.category}): ${g.progress}% complete, ${g.milestones.length} milestones`).join('\n')}

THIS MONTH'S FINANCE:
- Income: ₹${income.toLocaleString('en-IN')}
- Expenses: ₹${expense.toLocaleString('en-IN')}
- Balance: ₹${(income - expense).toLocaleString('en-IN')}

LAST JOURNAL ENTRY: ${recentJournal ? `"${recentJournal.title || 'Untitled'}" — mood: ${recentJournal.mood || 'not set'}` : 'No recent entry'}

UPCOMING EVENTS: ${upcomingEvents.length > 0 ? upcomingEvents.map(e => `${e.title} (${new Date(e.startDate).toLocaleDateString()})`).join(', ') : 'None scheduled'}
`.trim();

        const completion = await getGroq().chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are MindWave, a personal life OS AI assistant. 
Generate a warm, motivating, concise daily brief for the user. 
Structure it as:
1. A personalized greeting based on the data (1 sentence)
2. Today's focus (what to prioritize based on habits/goals)  
3. One insight or encouragement based on streaks/progress
4. One quick tip or action for the day

Keep it under 120 words. Be specific, use the actual numbers from the data. Sound like a supportive friend, not a robot.`
                },
                { role: 'user', content: context }
            ],
            max_tokens: 200,
            temperature: 0.8,
        });

        const brief = completion.choices[0]?.message?.content || 'Have a productive day!';

        res.json({
            brief,
            data: {
                habitsCompleted: completedToday,
                habitsDue: habitsDueToday,
                topStreak,
                activeGoals: activeGoals.length,
                monthlyBalance: income - expense,
                upcomingEvents: upcomingEvents.length,
            }
        });

    } catch (err) {
        console.error('AI Daily Brief Error:', err.message);
        // Return a graceful fallback — never crash the dashboard
        res.json({
            brief: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}! Your day is full of possibilities. Check your habits and keep pushing toward your goals.`,
            data: null,
            error: 'AI brief generation failed'
        });
    }
});

// ── GET /api/ai/habit-suggestions ─────────────────────────────────────────────
// Returns 3 AI-suggested habit names based on user's existing habits + goals
router.get('/habit-suggestions', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const [habits, goals] = await Promise.all([
            Habit.find({ userId }).select('name category').limit(10),
            Goal.find({ userId, status: 'active' }).select('title category').limit(5)
        ]);

        const context = `
User's current habits: ${habits.map(h => h.name).join(', ') || 'none yet'}
User's active goals: ${goals.map(g => g.title).join(', ') || 'none yet'}
`;

        const completion = await getGroq().chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a habit coach. Suggest 3 specific, actionable daily habits that complement the user\'s existing habits and goals. Return ONLY a JSON array of objects with "name", "category", "icon", "description" fields. No explanation.'
                },
                { role: 'user', content: context }
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        const raw = completion.choices[0]?.message?.content || '[]';
        // Extract JSON from response
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        res.json({ suggestions });
    } catch (err) {
        console.error('Habit Suggestions Error:', err.message);
        res.json({ suggestions: [] });
    }
});

module.exports = router;
