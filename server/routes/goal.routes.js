const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Goal = require('../models/Goal');
const { getGroqCompletion } = require('../utils/llmCache');
const validate = require('../middleware/validate.middleware');
const {
    createGoalSchema,
    updateGoalSchema,
    aiMilestonesSchema,
    aiCreateSchema
} = require('../schemas/goal.schemas');

// Helper: safely map incoming milestones to schema objects
function parseMilestones(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
        .map(m => {
            if (!m) return null;
            if (typeof m === 'string') return m.trim() ? { text: m.trim(), completed: false } : null;
            if (typeof m === 'object' && m.text) return {
                text: String(m.text).trim(),
                completed: Boolean(m.completed),
                dueDate: m.dueDate || undefined,
                notes: m.notes || '',
            };
            return null;
        })
        .filter(Boolean);
}

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
router.post('/', auth, validate(createGoalSchema), async (req, res) => {
    try {
        const { title, description, category, targetDate, color, milestones } = req.body;
        if (!title) return res.status(400).json({ msg: 'Title is required' });

        const goal = new Goal({
            userId: req.user.id,
            title,
            description,
            category,
            targetDate: targetDate || undefined,
            color,
            milestones: parseMilestones(milestones),
        });
        await goal.save();
        res.json(goal);
    } catch (err) {
        console.error('POST /goals error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// POST /api/goals/ai-milestones — Generate step plan via AI
router.post('/ai-milestones', auth, validate(aiMilestonesSchema), async (req, res) => {
    try {
        const { title, description, category, targetDate } = req.body;
        if (!title) return res.status(400).json({ msg: 'Goal title is required' });
        if (!process.env.GROQ_API_KEY) return res.status(500).json({ msg: 'AI API key not configured' });

        const today = new Date().toISOString().split('T')[0];
        const dateCtx = targetDate
            ? `Target date: ${targetDate}. Today: ${today}. Space milestone due dates evenly.`
            : `Today: ${today}. Suggest a realistic 4-8 week timeline.`;

        const prompt = `You are a personal goal-planning coach. Create a step-by-step action plan.

GOAL:
- Title: ${title}
- Description: ${description || 'None'}
- Category: ${category || 'personal'}
- ${dateCtx}

Generate 5 to 7 specific, actionable milestones. Respond ONLY with raw JSON array:
[
  { "text": "Step description", "dueDate": "YYYY-MM-DD" },
  ...
]`;

        const completion = await getGroqCompletion({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.4,
            max_tokens: 600,
        }, true);

        let raw = (completion.choices[0]?.message?.content || '[]')
            .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        let milestones;
        try { milestones = JSON.parse(raw); }
        catch { const m = raw.match(/\[[\s\S]*\]/); milestones = m ? JSON.parse(m[0]) : []; }

        res.json({ milestones });
    } catch (err) {
        console.error('AI milestones error:', err.message);
        res.status(500).json({ msg: 'AI generation failed', error: err.message });
    }
});

// POST /api/goals/ai-create — Generate a FULL goal from a chat message (or modify an existing one)
router.post('/ai-create', auth, validate(aiCreateSchema), async (req, res) => {
    try {
        const { message, existingGoal } = req.body;
        if (!message) return res.status(400).json({ msg: 'Message is required' });
        if (!process.env.GROQ_API_KEY) return res.status(500).json({ msg: 'AI API key not configured' });

        const today = new Date().toISOString().split('T')[0];

        let prompt = `You are a personal goal-setting coach. A user described a goal in natural language. Extract and structure it.

User's idea: "${message}"

Today is ${today}.`;

        if (existingGoal) {
            prompt += `
            
The user currently has this existing goal plan. They want you to MODIFY IT based on their new idea/request above:
Existing Plan: ${JSON.stringify(existingGoal, null, 2)}

Please output a fully modified/updated goal JSON object. Maintain the good parts, but apply their requested changes (e.g. changing dates, adding/removing steps, changing the title).`;
        } else {
            prompt += `
            
Create a complete, specific goal.`;
        }

        prompt += `

Respond ONLY with raw JSON (no markdown):
{
  "title": "Clear, motivating goal title",
  "description": "2-3 sentences describing what success looks like",
  "category": "health|career|learning|finance|relationships|personal|other",
  "targetDate": "YYYY-MM-DD",
  "milestones": [
    { "text": "Specific action step", "dueDate": "YYYY-MM-DD" },
    { "text": "Next step...",         "dueDate": "YYYY-MM-DD" }
  ]
}

Rules:
- Generate an appropriate number of meaningful milestones (from 2 up to 15) based on the goal's complexity, timeframe, and user context.
- Analyze the user's request carefully to break down the schedule sensibly.
- targetDate should be realistic for the scope of the goal (e.g., 4-12 weeks from today unless user specified a timeframe).
- Pick the most fitting category`;

        const completion = await getGroqCompletion({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 800,
        }, true);

        let raw = (completion.choices[0]?.message?.content || '{}')
            .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        let goal;
        try { goal = JSON.parse(raw); }
        catch { const m = raw.match(/\{[\s\S]*\}/); goal = m ? JSON.parse(m[0]) : {}; }

        res.json({ goal });
    } catch (err) {
        console.error('AI create goal error:', err.message);
        res.status(500).json({ msg: 'AI generation failed', error: err.message });
    }
});

// PUT update goal
router.put('/:id', auth, validate(updateGoalSchema), async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        const allowed = ['title', 'description', 'category', 'targetDate', 'progress', 'status', 'color'];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) goal[field] = req.body[field];
        });

        if (req.body.milestones !== undefined) {
            goal.milestones = parseMilestones(req.body.milestones);
        }

        await goal.save();
        res.json(goal);
    } catch (err) {
        console.error('PUT /goals/:id error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// PATCH log activity on milestone (toggle or save notes)
router.patch('/:id/milestone/:milestoneId', auth, async (req, res) => {
    try {
        const { milestoneId } = req.params;

        // Guard: reject clearly invalid IDs
        if (!milestoneId || milestoneId === 'undefined' || milestoneId === 'null') {
            return res.status(400).json({ msg: 'Invalid milestone ID' });
        }

        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        const milestone = goal.milestones.id(milestoneId);
        if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

        if (req.body.notes !== undefined || req.body.forceComplete !== undefined) {
            if (req.body.notes !== undefined) milestone.notes = req.body.notes;
            if (req.body.forceComplete === true && !milestone.completed) { milestone.completed = true; milestone.completedAt = new Date(); }
            if (req.body.forceComplete === false) { milestone.completed = false; milestone.completedAt = undefined; }
        } else {
            milestone.completed = !milestone.completed;
            milestone.completedAt = milestone.completed ? new Date() : undefined;
        }

        await goal.save();
        res.json(goal);
    } catch (err) {
        console.error('PATCH milestone error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// PATCH add milestone
router.patch('/:id/milestone', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });
        if (!req.body.text) return res.status(400).json({ msg: 'text required' });
        goal.milestones.push({ text: req.body.text, completed: false, dueDate: req.body.dueDate || undefined });
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

// GET /api/goals/search
router.get('/search', auth, async (req, res) => {
    try {
        const q = req.query.q || '';
        const goals = await Goal.find({
            userId: req.user.id,
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
            ]
        }).limit(10);
        res.json(goals);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
