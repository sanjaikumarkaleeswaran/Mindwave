const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    title: {
        type: String,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    mood: {
        type: String,
        enum: ['great', 'good', 'okay', 'bad', 'terrible', ''],
        default: ''
    },
    tags: [{
        type: String,
        trim: true
    }],
    aiAnalysis: {
        summary: String,
        insights: [String],
        sentiment: String,
        keyTopics: [String],
        actionableChallenge: String, // One specific challenge or action item
        analyzedAt: Date
    }
}, {
    timestamps: true
});

// Index for efficient querying
journalSchema.index({ userId: 1, date: -1 });

// Virtual for formatted date
journalSchema.virtual('formattedDate').get(function () {
    return this.date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

module.exports = mongoose.model('Journal', journalSchema);
