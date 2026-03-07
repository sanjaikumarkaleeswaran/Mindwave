const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    notes: { type: String, default: '' },    // activity log / what you did
    dueDate: { type: Date },                 // AI-assigned or user-set milestone date
});

const GoalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['health', 'career', 'learning', 'finance', 'relationships', 'personal', 'other'],
        default: 'personal'
    },
    targetDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 }, // manual 0-100
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'archived'],
        default: 'active'
    },
    milestones: [MilestoneSchema],
    color: { type: String, default: '#6366f1' }, // accent color for card
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

GoalSchema.pre('save', async function () {
    this.updatedAt = Date.now();
    // Auto-calc progress from milestones if any exist
    if (this.milestones.length > 0) {
        const done = this.milestones.filter(m => m.completed).length;
        this.progress = Math.round((done / this.milestones.length) * 100);
    }
    if (this.progress >= 100) this.status = 'completed';
});

module.exports = mongoose.model('Goal', GoalSchema);
