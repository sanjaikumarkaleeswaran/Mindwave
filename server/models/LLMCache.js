const mongoose = require('mongoose');

const LLMCacheSchema = new mongoose.Schema({
    promptHash: { type: String, required: true, unique: true },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 604800 } // 7-day TTL (604,800 seconds)
});

module.exports = mongoose.model('LLMCache', LLMCacheSchema);
