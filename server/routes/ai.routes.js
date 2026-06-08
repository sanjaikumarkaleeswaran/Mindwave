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

// ── POST /api/ai/book-recommendations ─────────────────────────────────────────────
// Returns AI-suggested books based on user prompt (genre, idea, journal mood)
router.post('/book-recommendations', auth, async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const context = `User's idea/genre/mood: "${prompt}"`;

        const completion = await getGroq().chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a highly knowledgeable librarian. Based on the user\'s input, recommend 3 excellent books. Return ONLY a JSON array of objects with "title", "author", and a 1-sentence "reason" (why they should read it). Do not include any other text or markdown formatting.'
                },
                { role: 'user', content: context }
            ],
            max_tokens: 400,
            temperature: 0.7,
        });

        const raw = completion.choices[0]?.message?.content || '[]';
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        res.json({ suggestions });
    } catch (err) {
        console.error('Book Recommendations Error:', err.message);
        res.status(500).json({ msg: 'Failed to generate recommendations', suggestions: [] });
    }
});

// ── POST /api/ai/book-summary ────────────────────────────────────────────────
// Generates a summary for a specific book using AI
router.post('/book-summary', auth, async (req, res) => {
    try {
        const { title, author, notes } = req.body;
        
        let context = `Book: "${title}" by ${author}.`;
        if (notes) {
            context += `\nUser's notes/thoughts on the book: "${notes}"`;
        }

        const completion = await getGroq().chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert literary analyst and book summarizer. Provide a concise but comprehensive summary of the book provided. Highlight the main themes, key takeaways, and a brief conclusion. If the user provided their own notes, incorporate an analysis of their thoughts into your summary. Format your response beautifully using markdown with clear headings and bullet points.'
                },
                { role: 'user', content: context }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });

        const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';
        res.json({ summary });
    } catch (err) {
        console.error('Book Summary Error:', err.message);
        res.status(500).json({ msg: 'Failed to generate summary', error: err.message });
    }
});

// ── POST /api/ai/page-summary ────────────────────────────────────────────────
// Extracts text from a specific page in a GridFS PDF and summarizes it
router.post('/page-summary', auth, async (req, res) => {
    try {
        const { filename, pageNumber, bookTitle } = req.body;
        
        if (!filename || !pageNumber) {
            return res.status(400).json({ msg: 'Filename and pageNumber are required' });
        }

        const mongoose = require('mongoose');
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'pdfs' });
        
        // Download PDF to buffer
        const downloadStream = bucket.openDownloadStreamByName(filename);
        const chunks = [];
        for await (const chunk of downloadStream) {
            chunks.push(chunk);
        }
        const pdfBuffer = Buffer.concat(chunks);

        // Parse the specific page
        const pdfParse = require('pdf-parse');
        let extractedText = '';
        const options = {
            max: pageNumber,
            pagerender: function(pageData) {
                // pageIndex is 0-indexed
                if (pageData.pageIndex === parseInt(pageNumber) - 1) {
                    return pageData.getTextContent().then(textContent => {
                        let text = '';
                        for (let item of textContent.items) {
                            text += item.str + ' ';
                        }
                        extractedText = text;
                        return text;
                    });
                }
                return '';
            }
        };

        await pdfParse(pdfBuffer, options);

        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({ msg: 'Could not extract text from this page. It might be an image.' });
        }

        // Send to Groq for summarization
        const completion = await getGroq().chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert reading assistant. You are given the text of a single page from a book. Provide a concise, insightful summary of what is happening on this page. Highlight key points, character actions, or important concepts. Format your response beautifully using markdown.'
                },
                { 
                    role: 'user', 
                    content: `Book Title: ${bookTitle || 'Unknown'}\nPage ${pageNumber} Text:\n\n${extractedText.substring(0, 4000)}` 
                }
            ],
            max_tokens: 800,
            temperature: 0.7,
        });

        const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';
        res.json({ summary, extractedText: extractedText.substring(0, 200) + '...' });
    } catch (err) {
        console.error('Page Summary Error:', err.message);
        res.status(500).json({ msg: 'Failed to generate page summary', error: err.message });
    }
});

module.exports = router;
