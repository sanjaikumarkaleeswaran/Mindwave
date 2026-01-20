const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const ChatHistory = require('../models/ChatHistory');
const Music = require('../models/Music');
const Habit = require('../models/Habit');

// @route   GET api/chat/history
// @desc    Get chat history
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const history = await ChatHistory.find({ userId: req.user.id }).sort({ timestamp: 1 }).limit(50);
        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chat/send
// @desc    Send message to AI
// @access  Private
router.post('/send', auth, async (req, res) => {
    const { message } = req.body;

    try {
        // 1. Save User Message
        const userMsg = new ChatHistory({
            userId: req.user.id,
            role: 'user',
            content: message
        });
        await userMsg.save();

        // 2. Fetch Context (RAG - Lite)
        const habits = await Habit.find({ userId: req.user.id });
        const music = await Music.find({ userId: req.user.id }).limit(20); // Top 20 recent
        const recentHistory = await ChatHistory.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(10);

        // 3. Construct System Prompt with Context
        const systemPrompt = `You are a personal AI Life OS assistant. You are helpful, chill, and smart.
    
    USER CONTEXT:
    - Name: User
    - Habits: ${habits.map(h => `${h.name} (Streak: ${h.streak})`).join(', ') || 'None tracked yet'}
    - Recent Music: ${music.map(m => `${m.title} by ${m.artist}`).join(', ') || 'None added yet'}

    INSTRUCTIONS:
    - Answer questions naturally.
    - If the user asks to play music, output a JSON block: {"action": "PLAY_MUSIC", "query": "detected song/mood"} inside your response.
    - Use the context provided to give personalized answers.
    `;

        // 4. Call Groq API
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Format history for Groq (reverse generic history to chronological)
        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...recentHistory.reverse().map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: message }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: apiMessages,
            model: "llama3-8b-8192", // Fast and efficient
            temperature: 0.7,
            max_tokens: 1024,
        });

        const aiResponseContent = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that.";

        // 5. Save AI Response
        // 4. Save AI Response
        const aiMsg = new ChatHistory({
            userId: req.user.id,
            role: 'assistant',
            content: aiResponseContent
        });
        await aiMsg.save();

        res.json({ response: aiResponseContent, history: [userMsg, aiMsg] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
