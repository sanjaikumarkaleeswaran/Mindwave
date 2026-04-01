const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const ChatHistory = require('../models/ChatHistory');
const Conversation = require('../models/Conversation');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal');
const { getGroqCompletion } = require('../utils/llmCache');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const validate = require('../middleware/validate.middleware');
const { ingestDocument, searchSimilarChunks } = require('../utils/vectorStore');
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
        let rawContent = "";

        let imageBase64 = null;
        let imageMimeType = null;

        // 1. Process File if exists
        let savedFilePath = null;
        if (file) {
            const ext = path.extname(file.originalname);
            savedFilePath = file.filename + ext;
            fs.renameSync(file.path, path.join('uploads', savedFilePath));

            if (file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(path.join('uploads', savedFilePath));
                const data = await pdf(dataBuffer);
                rawContent = data.text;
            } else if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json' || file.mimetype === 'application/javascript') {
                rawContent = fs.readFileSync(path.join('uploads', savedFilePath), 'utf-8');
            } else if (file.mimetype.startsWith('image/')) {
                // Convert image to base64
                const bitmap = fs.readFileSync(path.join('uploads', savedFilePath));
                imageBase64 = Buffer.from(bitmap).toString('base64');
                imageMimeType = file.mimetype;
            }
        }

        if (rawContent) {
           // Ingest the entire text into the Vector Store in chunks! (True RAG)
           await ingestDocument(req.user.id, conversationId, file.originalname, rawContent);
        }

        // 2. Save User Message
        // Only save displayContent in DB. The Vector chunks handle the file content now!
        let displayContent = message;
        if (file) {
            if (savedFilePath) {
                const serverUrl = req.protocol + "://" + req.get("host");
                const fileUrl = `${serverUrl}/uploads/${savedFilePath}`;
                if (file.mimetype.startsWith('image/')) {
                    displayContent += `\n\n![${file.originalname}](${fileUrl})`;
                } else {
                    displayContent += `\n\n[${file.originalname}](attachment://${fileUrl})`;
                }
            } else {
                displayContent += `\n\n[Attached: ${file.originalname}]`;
            }
        }
        const llmContent = message;

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


        // 2. Fetch Context (RAG - Vector Search)
        const habits = await Habit.find({ userId: req.user.id });
        const recentHistory = await ChatHistory.find({ conversationId })
            .sort({ timestamp: -1 })
            .limit(10); // History *of this conversation only*

        // Perform Semantic Similarity Search across stored chunks for this conversation
        const relevantChunks = await searchSimilarChunks(req.user.id, message, conversationId, 4);
        let ragContext = "";
        if (relevantChunks.length > 0) {
            ragContext = "RELEVANT DOCUMENT EXCERPTS (Use these to answer questions if applicable):\n";
            let foundGoodChunk = false;
            for (const chunk of relevantChunks) {
                // Only include chunks with a minor baseline of similarity
                if (chunk.similarity > 0.05) { 
                    ragContext += `[From document: ${chunk.source}]:\n"${chunk.content}"\n\n`;
                    foundGoodChunk = true;
                }
            }
            if (!foundGoodChunk) ragContext = ""; // Ignore if all similarities are really bad
        }

        // 3. Construct System Prompt
        const systemPrompt = `You are a personal AI Life OS assistant.
        
        USER CONTEXT:
        - Habits: ${habits.map(h => `${h.name} (ID: ${h._id}, Streak: ${h.streak})`).join(', ') || 'None'}
        
        ${ragContext}

        CAPABILITIES:
        1. CREATE_HABIT: Track a new habit.
        2. DELETE_HABIT: Remove a habit.
        3. MARK_HABIT_COMPLETE: Mark a habit as done for today.
        4. CREATE_GOAL: Create a structured goal plan with title, description, category (health, career, learning, finance, relationships, personal, other), targetDate (YYYY-MM-DD), and milestones (array of strings).

        INSTRUCTIONS:
        - If the user relies on a document, look at the RELEVANT DOCUMENT EXCERPTS.
        - To CREATE a habit, output ONLY this JSON: {"action": "CREATE_HABIT", "name": "...", "frequency": "daily"}
        - To DELETE a habit, output ONLY this JSON: {"action": "DELETE_HABIT", "habitId": "..."}
        - If they DID a habit, output ONLY this JSON: {"action": "MARK_HABIT_COMPLETE", "habitId": "..."}
        - To CREATE a goal, output ONLY this JSON: {"action": "CREATE_GOAL", "title": "...", "description": "...", "category": "...", "targetDate": "...", "milestones": ["step 1", "step 2", ...]}
        - If no action is needed, just reply casually.
        - Do not output Markdown formatting (like \`\`\`json) around the JSON. Just the raw JSON string if performing an action.
        `;

        // 4. Call Groq
        let finalUserMessage = llmContent;

        if (imageBase64) {
            finalUserMessage = [
                { type: "text", text: llmContent },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:${imageMimeType};base64,${imageBase64}`,
                    },
                },
            ];
        }

        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...recentHistory.reverse().map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: finalUserMessage }
        ];

        // Ensure we use a vision model if an image is present
        let selectedModel = req.body.model || "llama-3.3-70b-versatile";
        if (imageBase64) {
            selectedModel = "meta-llama/llama-4-scout-17b-16e-instruct"; // Groq's current vision model (Llama 4 Scout)
            console.log("DEBUG: Using Vision Model: " + selectedModel);
        }

        const chatCompletion = await getGroqCompletion({
            messages: apiMessages,
            model: selectedModel,
            temperature: 0.1, // Lower temperature for precise JSON
            max_tokens: 1024,
        }, true);

        let aiResponseContent = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that.";
        let toolExecuted = false;

        // 5. Tool Parsing & Execution (Backend Side)
        try {
            let actionList = [];

            // Attempt 1: Parse entire response as JSON
            try {
                // simple cleanup in case of wrapping 'json ... '
                const cleanContent = aiResponseContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
                const parsed = JSON.parse(cleanContent);
                if (Array.isArray(parsed)) actionList = parsed;
                else if (typeof parsed === 'object' && parsed !== null) actionList = [parsed];
            } catch (e) {
                // Attempt 2: Extract JSON block from markdown code blocks if present
                const jsonBlockMatch = aiResponseContent.match(/```json([\s\S]*?)```/) || aiResponseContent.match(/```([\s\S]*?)```/);
                if (jsonBlockMatch && jsonBlockMatch[1]) {
                    try {
                        const parsed = JSON.parse(jsonBlockMatch[1]);
                        if (Array.isArray(parsed)) actionList = parsed;
                        else if (typeof parsed === 'object') actionList = [parsed];
                    } catch (e2) { }
                }

                // Attempt 3: Regex for individual actions (fallback)
                if (actionList.length === 0) {
                    const jsonMatches = aiResponseContent.match(/\{"action":\s*"[^"]+".*?\}/g);
                    if (jsonMatches) {
                        jsonMatches.forEach(str => {
                            try { actionList.push(JSON.parse(str)); } catch (e) { }
                        });
                    }
                }
            }

            if (actionList.length > 0) {
                let successCount = 0;

                for (const actionData of actionList) {
                    try {
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
                        else if (actionData.action === 'CREATE_GOAL') {
                            const milestones = Array.isArray(actionData.milestones) 
                                ? actionData.milestones.map(m => ({ text: m, completed: false }))
                                : [];
                            const newGoal = new Goal({
                                userId: req.user.id,
                                title: actionData.title,
                                description: actionData.description || '',
                                category: actionData.category || 'personal',
                                targetDate: actionData.targetDate || undefined,
                                milestones
                            });
                            await newGoal.save();
                            successCount++;
                        }
                    } catch (innerErr) {
                        console.error("Error executing action:", innerErr);
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
        require('fs').writeFileSync('chat_crash.json', JSON.stringify({message: err.message, stack: err.stack}, null, 2));
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

        const completion = await getGroqCompletion({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
        }, true);

        res.json({ analysis: completion.choices[0]?.message?.content });

    } catch (err) {
        console.error("ANALYSIS ERROR:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
