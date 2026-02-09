const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal');
const Groq = require('groq-sdk');
const auth = require('../middleware/auth.middleware');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Get all journal entries for a user
router.get('/', auth, async (req, res) => {
    try {
        const journals = await Journal.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(50);

        res.json(journals);
    } catch (error) {
        console.error('Error fetching journals:', error);
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
});

// Get a specific journal entry
router.get('/:id', auth, async (req, res) => {
    try {
        const journal = await Journal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json(journal);
    } catch (error) {
        console.error('Error fetching journal:', error);
        res.status(500).json({ error: 'Failed to fetch journal entry' });
    }
});

// Get journal entries by date range
router.get('/range/:startDate/:endDate', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.params;

        const journals = await Journal.find({
            userId: req.user.id,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: -1 });

        res.json(journals);
    } catch (error) {
        console.error('Error fetching journals by range:', error);
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
});

// Create a new journal entry
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, mood, tags, date } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Journal content is required' });
        }

        const journal = new Journal({
            userId: req.user.id,
            title: title || '',
            content: content.trim(),
            mood: mood || '',
            tags: tags || [],
            date: date ? new Date(date) : new Date()
        });

        await journal.save();
        res.status(201).json(journal);
    } catch (error) {
        console.error('Error creating journal:', error);
        res.status(500).json({ error: 'Failed to create journal entry', details: error.message });
    }
});

// Update a journal entry
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, mood, tags } = req.body;

        const journal = await Journal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        if (title !== undefined) journal.title = title;
        if (content !== undefined) journal.content = content.trim();
        if (mood !== undefined) journal.mood = mood;
        if (tags !== undefined) journal.tags = tags;

        await journal.save();
        res.json(journal);
    } catch (error) {
        console.error('Error updating journal:', error);
        res.status(500).json({ error: 'Failed to update journal entry' });
    }
});

// Delete a journal entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const journal = await Journal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json({ message: 'Journal entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting journal:', error);
        res.status(500).json({ error: 'Failed to delete journal entry' });
    }
});

// AI Analysis of a journal entry
router.post('/:id/analyze', auth, async (req, res) => {
    try {
        const journal = await Journal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        // Create AI prompt for analysis
        const prompt = `You are an empathetic AI life coach analyzing a personal journal entry. Please provide:
1. A brief summary (2-3 sentences)
2. Key insights and patterns (3-5 bullet points)
3. Overall sentiment (positive, neutral, negative, or mixed)
4. Main topics or themes (3-5 keywords)

Journal Entry:
Title: ${journal.title || 'Untitled'}
Date: ${journal.date.toLocaleDateString()}
Mood: ${journal.mood || 'Not specified'}
Content:
${journal.content}

Provide your analysis in JSON format:
{
  "summary": "brief summary here",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "sentiment": "positive/neutral/negative/mixed",
  "keyTopics": ["topic1", "topic2", "topic3"]
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an empathetic AI life coach who provides thoughtful, constructive analysis of personal journal entries. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1000
        });

        const aiResponse = completion.choices[0]?.message?.content || '';

        // Parse AI response
        let analysis;
        try {
            // Try to extract JSON from the response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback analysis
            analysis = {
                summary: 'Analysis completed. Please review your entry for personal insights.',
                insights: ['Reflect on the events described', 'Consider patterns in your daily activities', 'Notice your emotional responses'],
                sentiment: 'neutral',
                keyTopics: ['daily life', 'personal reflection']
            };
        }

        // Update journal with AI analysis
        journal.aiAnalysis = {
            summary: analysis.summary,
            insights: analysis.insights,
            sentiment: analysis.sentiment,
            keyTopics: analysis.keyTopics,
            analyzedAt: new Date()
        };

        await journal.save();
        res.json(journal);
    } catch (error) {
        console.error('Error analyzing journal:', error);
        res.status(500).json({ error: 'Failed to analyze journal entry' });
    }
});

// Get AI insights for multiple entries (weekly/monthly summary)
router.post('/analyze/batch', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        const journals = await Journal.find({
            userId: req.user.id,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: 1 });

        if (journals.length === 0) {
            return res.status(404).json({ error: 'No journal entries found in this period' });
        }

        // Combine all entries for batch analysis
        const combinedContent = journals.map(j =>
            `Date: ${j.date.toLocaleDateString()}\nMood: ${j.mood || 'N/A'}\n${j.content}`
        ).join('\n\n---\n\n');

        const prompt = `You are an AI life coach analyzing multiple journal entries over a period. Provide:
1. Overall summary of the period
2. Key patterns and trends observed
3. Areas of growth or concern
4. Actionable recommendations

Journal Entries:
${combinedContent}

Provide analysis in JSON format:
{
  "summary": "overall summary",
  "patterns": ["pattern 1", "pattern 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an empathetic AI life coach providing thoughtful analysis. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1500
        });

        const aiResponse = completion.choices[0]?.message?.content || '';

        let analysis;
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Error parsing batch analysis:', parseError);
            analysis = {
                summary: 'Period analysis completed.',
                patterns: ['Regular journaling practice'],
                recommendations: ['Continue documenting your daily experiences']
            };
        }

        res.json({
            period: {
                start: startDate,
                end: endDate,
                entryCount: journals.length
            },
            analysis
        });
    } catch (error) {
        console.error('Error in batch analysis:', error);
        res.status(500).json({ error: 'Failed to analyze journal entries' });
    }
});

module.exports = router;
