const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:      { type: String, required: true },
    frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    category:  {
        type: String,
        enum: ['health', 'fitness', 'learning', 'mindfulness', 'productivity', 'social', 'finance', 'other'],
        default: 'other'
    },
    color:         { type: String, default: '#6366f1' },   // hex accent color
    icon:          { type: String, default: '✅' },         // emoji icon
    description:   { type: String, default: '' },
    reminderTime:  { type: String, default: '' },          // HH:MM format e.g. "08:00"
    targetDaysPerWeek: { type: Number, default: 7, min: 1, max: 7 }, // for weekly habits
    completedDates: [{ type: Date }],
    streak:      { type: Number, default: 0 },
    bestStreak:  { type: Number, default: 0 },
    order:       { type: Number, default: 0 },
    createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', HabitSchema);
