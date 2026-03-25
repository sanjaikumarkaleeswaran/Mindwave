const { z } = require('zod');

// Schema for a single milestone
const milestoneSchema = z.object({
    text: z.string().min(1, 'Milestone text is required').max(500),
    completed: z.boolean().optional(),
    dueDate: z.string().optional(),
    notes: z.string().max(1000).optional(),
}).strict();

// Schema for creating a goal
const createGoalSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(255),
        description: z.string().max(2000).optional(),
        category: z.enum(['health', 'career', 'learning', 'finance', 'relationships', 'personal', 'other']).optional(),
        targetDate: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
        milestones: z.array(z.union([z.string(), milestoneSchema])).optional(),
    }).strict()
});

// Schema for updating a goal
const updateGoalSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(2000).optional(),
        category: z.enum(['health', 'career', 'learning', 'finance', 'relationships', 'personal', 'other']).optional(),
        targetDate: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
        status: z.enum(['active', 'completed', 'archived']).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        milestones: z.array(z.union([z.string(), milestoneSchema])).optional(),
    }).strict()
});

// Input schemas for AI generation
const aiMilestonesSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        category: z.enum(['health', 'career', 'learning', 'finance', 'relationships', 'personal', 'other']).optional(),
        targetDate: z.string().optional(),
    }).strict()
});

const aiCreateSchema = z.object({
    body: z.object({
        message: z.string().min(1, 'Message is required').max(1000),
        existingGoal: z.record(z.any()).optional(),
    }).strict()
});

module.exports = {
    createGoalSchema,
    updateGoalSchema,
    aiMilestonesSchema,
    aiCreateSchema
};
