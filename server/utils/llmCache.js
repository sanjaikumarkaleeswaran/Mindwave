const crypto = require('crypto');
const Groq = require('groq-sdk');

let groqInstance = null;

const getGroqCompletion = async (options, useCache = false) => {
    // Initialize Groq (lazy loaded)
    if (!groqInstance) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing in environment variables.");
        }
        groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    console.log(`Calling Groq API (Cache Disabled)...`);
    
    // API Call (No caching logic)
    const completion = await groqInstance.chat.completions.create(options);
    return completion;
};

module.exports = { getGroqCompletion };
