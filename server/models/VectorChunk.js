const mongoose = require('mongoose');

const vectorChunkSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    conversationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Conversation' 
    }, // Optional if we want it global per user
    source: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    embedding: { 
        type: [Number], 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('VectorChunk', vectorChunkSchema);
