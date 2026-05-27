const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    startDate:   { type: Date, required: true },
    endDate:     { type: Date },        // null = all-day or same as startDate
    allDay:      { type: Boolean, default: true },
    color:       { type: String, default: '#6366f1' },
    category:    {
        type: String,
        enum: ['personal', 'work', 'health', 'social', 'finance', 'learning', 'habit', 'goal', 'other'],
        default: 'personal'
    },
    linkedGoalId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },
    linkedHabitId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', default: null },
    reminder:    { type: Boolean, default: false },
    reminderMinutesBefore: { type: Number, default: 30 },
    recurring:   {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
    },
    completed:   { type: Boolean, default: false },
}, { timestamps: true });

EventSchema.index({ userId: 1, startDate: 1 });

module.exports = mongoose.model('Event', EventSchema);
