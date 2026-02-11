const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const ChatHistory = require('../models/ChatHistory');
const Conversation = require('../models/Conversation');
const Habit = require('../models/Habit');
const Groq = require('groq-sdk');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const validate = require('../middleware/validate.middleware');
const {
    sendChatSchema,
    conversationIdSchema,
    deleteConversationSchema
} = require('../schemas/chat.schemas');

const upload = multer({ dest: 'uploads/' });

// @route   GET api/chat/conversations
// @desc    Get all conversations
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(conversations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chat/conversations
// @desc    Create new conversation
router.post('/conversations', auth, async (req, res) => {
    try {
        const newConv = new Conversation({
            userId: req.user.id,
            title: 'New Chat'
        });
        await newConv.save();
        res.json(newConv);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/chat/conversations/:id
// @desc    Delete conversation
// @desc    Delete conversation
router.delete('/conversations/:id', auth, validate(deleteConversationSchema), async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id);
        if (!conv) return res.status(404).json({ msg: 'Not found' });
        if (conv.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not auth' });

        await Conversation.findByIdAndDelete(req.params.id);
        await ChatHistory.deleteMany({ conversationId: req.params.id });
        res.json({ msg: 'Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chat/:conversationId
// @desc    Get messages for a specific conversation
// @desc    Get messages for a specific conversation
router.get('/:conversationId', auth, validate(conversationIdSchema), async (req, res) => {
    try {
        const messages = await ChatHistory.find({
            conversationId: req.params.conversationId,
            userId: req.user.id
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chat/send
// @desc    Send message to AI
// @route   POST api/chat/send
// @desc    Send message to AI with optional file
// @route   POST api/chat/send
// @desc    Send message to AI with optional file
// Note: Multer middleware must come before validation if validation depends on body fields that might be in multipart form
// However, since we validate body fields, let's keep it simple. Multer populates req.body.
router.post('/send', auth, upload.single('file'), validate(sendChatSchema), async (req, res) => {
    // Expect conversationId. If not provided, we could error or auto-create (but frontend should handle creation)
    const { message, conversationId, model } = req.body;
    const file = req.file;

    if (!conversationId) {
        if (file) fs.unlinkSync(file.path); // cleanup
        return res.status(400).json({ msg: 'Conversation ID required' });
    }

    if (!process.env.GROQ_API_KEY) {
        if (file) fs.unlinkSync(file.path);
        console.error("GROQ_API_KEY is missing in .env");
        return res.status(500).json({ msg: "Server Configuration Error: Missing AI API Key" });
    }

    try {
        let fileContent = "";

        // 1. Process File if exists
        if (file) {
            if (file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(file.path);
                const data = await pdf(dataBuffer);
                fileContent = `[USER UPLOADED FILE CONTENT]:\n${data.text.substring(0, 20000)}\n[END OF FILE]\n\n`; // Limit text size
            } else if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json' || file.mimetype === 'application/javascript') {
                fileContent = `[USER UPLOADED FILE CONTENT]:\n${fs.readFileSync(file.path, 'utf-8').substring(0, 20000)}\n[END OF FILE]\n\n`;
            }
            // Cleanup temp file
            fs.unlinkSync(file.path);
        }

        // 2. Save User Message
        // We include file content in the DB message so context persists
        // Ideally we'd store a reference, but for simple text RAG this works
        // We'll show just the "message" user typed in UI, but send "message + file" to AI
        const displayContent = message + (file ? `\n\n[Attached: ${file.originalname}]` : "");
        const llmContent = fileContent + message;

        const userMsg = new ChatHistory({
            userId: req.user.id,
            conversationId,
            role: 'user',
            content: displayContent // Save what user sees/typed
        });
        await userMsg.save();

        // 1b. Update Conversation Title if it's the first message? 
        const msgCount = await ChatHistory.countDocuments({ conversationId });
        if (msgCount <= 1) {
            const title = message.substring(0, 30) + (message.length > 30 ? '...' : '') || (file ? `File: ${file.originalname}` : 'New Chat');
            await Conversation.findByIdAndUpdate(conversationId, { title });
        }


        // 2. Fetch Context (RAG - Lite)
        const habits = await Habit.find({ userId: req.user.id });
        const recentHistory = await ChatHistory.find({ conversationId })
            .sort({ timestamp: -1 })
            .limit(10); // History *of this conversation only*

        // 3. Construct System Prompt
        const systemPrompt = `You are a personal AI Life OS assistant.
        
        USER CONTEXT:
        - Habits: ${habits.map(h => `${h.name} (ID: ${h._id}, Streak: ${h.streak})`).join(', ') || 'None'}

        CAPABILITIES:
        1. CREATE_HABIT: Track a new habit.
        2. DELETE_HABIT: Remove a habit.
        3. MARK_HABIT_COMPLETE: Mark a habit as done for today.

        INSTRUCTIONS:
        - If the user wants to ADD a habit, output ONLY this JSON: {"action": "CREATE_HABIT", "name": "...", "frequency": "daily"}
        - If the user wants to DELETE a habit, output ONLY this JSON: {"action": "DELETE_HABIT", "habitId": "..."}
        - If the user says they DID a habit (e.g., "I ran", "Drank water"), output ONLY this JSON: {"action": "MARK_HABIT_COMPLETE", "habitId": "..."} (Match closely to the context Name/ID).
        - If no action is needed, just reply casually.
        - Do not output Markdown formatting (like \`\`\`json) around the JSON. Just the raw JSON string if performing an action.
        `;

        // 4. Call Groq
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...recentHistory.reverse().map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: llmContent }
        ];

        // Use model from request or default
        const selectedModel = req.body.model || "llama-3.3-70b-versatile";

        const chatCompletion = await groq.chat.completions.create({
            messages: apiMessages,
            model: selectedModel,
            temperature: 0.1, // Lower temperature for precise JSON
            max_tokens: 1024,
        });

        let aiResponseContent = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that.";
        let toolExecuted = false;

        // 5. Tool Parsing & Execution (Backend Side)
        try {
            // Updated Regex to find ALL JSON objects in the string
            // This regex tries to match separate JSON objects
            const jsonMatches = aiResponseContent.match(/\{"action":\s*"[^"]+".*?\}/g);

            if (jsonMatches && jsonMatches.length > 0) {
                let successCount = 0;

                for (const jsonStr of jsonMatches) {
                    try {
                        const actionData = JSON.parse(jsonStr);

                        if (actionData.action === 'CREATE_HABIT') {
                            const newHabit = new Habit({
                                userId: req.user.id,
                                name: actionData.name,
                                frequency: actionData.frequency || 'daily',
                                streak: 0,
                                completedDates: []
                            });
                            await newHabit.save();
                            successCount++;
                        }
                        else if (actionData.action === 'DELETE_HABIT') {
                            if (actionData.habitId) {
                                await Habit.findOneAndDelete({ _id: actionData.habitId, userId: req.user.id });
                                successCount++;
                            }
                        }
                        else if (actionData.action === 'MARK_HABIT_COMPLETE') {
                            if (actionData.habitId) {
                                const habit = await Habit.findOne({ _id: actionData.habitId, userId: req.user.id });
                                if (habit) {
                                    const today = new Date().setHours(0, 0, 0, 0);
                                    const alreadyDone = habit.completedDates.some(d => new Date(d).setHours(0, 0, 0, 0) === today);

                                    if (!alreadyDone) {
                                        habit.completedDates.push(new Date());
                                        habit.streak += 1;
                                        await habit.save();
                                        successCount++;
                                    }
                                }
                            }
                        }
                    } catch (innerErr) {
                        // ignore formatting errors for individual partial matches
                    }
                }

                if (successCount > 0) {
                    aiResponseContent = `I've successfully processed ${successCount} action(s) for you!`;
                    toolExecuted = true;
                }
            }
        } catch (e) {
            console.error("Tool Execution Failed", e);
        }

        // 6. Save AI Response
        const aiMsg = new ChatHistory({
            userId: req.user.id,
            conversationId,
            role: 'assistant',
            content: aiResponseContent
        });
        await aiMsg.save();

        res.json({ response: aiResponseContent, history: [userMsg, aiMsg] });

    } catch (err) {
        console.error("CHAT ROUTE ERROR:", err);
        res.status(500).json({
            msg: 'Server Error',
            error: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack
        });
    }
});

// @route   POST api/chat/analyze-habits
// @desc    Analyze habit performance
router.post('/analyze-habits', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user.id });

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ msg: "Missing AI API Key" });
        }

        const stats = habits.map(h => {
            const today = new Date();
            const last7Days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                last7Days.push(d);
            }
            const weeklyCount = last7Days.filter(d =>
                h.completedDates.some(cd => new Date(cd).setHours(0, 0, 0, 0) === d.setHours(0, 0, 0, 0))
            ).length;
            return {
                name: h.name,
                streak: h.streak,
                bestStreak: h.bestStreak,
                weeklyConsistency: `${weeklyCount}/7`
            };
        });

        const prompt = `
        You are an expert Habit Coach. Analyze this user's habit data and provide a concise, 3-part report in Markdown.
        
        DATA:
        ${JSON.stringify(stats, null, 2)}

        FORMAT:
        ### 🌟 Insight
        [One sentence summary of their overall performance]

        ### 🔥 Strengths
        - [Bullet point praising specific high streaks or specific consistency]

        ### 💡 Recommendation
        - [Specific actionable advice for 1-2 habits that are struggling (low weekly count)]
        - [Proposed detailed challenge for next week]

        Keep the tone encouraging but accountability-focused. Use emojis.
        `;

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
        });

        res.json({ analysis: completion.choices[0]?.message?.content });

    } catch (err) {
        console.error("ANALYSIS ERROR:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
