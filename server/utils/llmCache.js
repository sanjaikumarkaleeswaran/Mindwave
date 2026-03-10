const crypto = require('crypto');
const Groq = require('groq-sdk');
const LLMCache = require('../models/LLMCache');

let groqInstance = null;

const getGroqCompletion = async (options, useCache = true) => {
    // 1. Generate SHA-256 hash of the request payload
    const hashStr = JSON.stringify(options);
    const promptHash = crypto.createHash('sha256').update(hashStr).digest('hex');

    // 2. Check Cache
    if (useCache) {
        try {
            const cached = await LLMCache.findOne({ promptHash }).lean();
            if (cached) {
                console.log(`[LLM Cache HIT] Serving cached response for hash: ${promptHash.substring(0, 8)}`);
                return cached.response;
            }
        } catch (err) {
            console.error('[LLM Cache Read Error]:', err.message);
        }
    }

    // 3. Initialize Groq (lazy loaded)
    if (!groqInstance) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing in environment variables.");
        }
        groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    console.log(`[LLM Cache MISS] Calling Groq API...`);
    
    // 4. API Call
    const completion = await groqInstance.chat.completions.create(options);

    // 5. Save to Cache asynchronously
    if (useCache && completion && completion.choices) {
        LLMCache.create({ promptHash, response: completion }).catch(err => {
            if (err.code !== 11000) console.error('[LLM Cache Write Error]:', err.message);
        });
    }

    return completion;
};

module.exports = { getGroqCompletion };
