const { z } = require('zod');

const createHabitSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Habit name is required').max(100, 'Habit name must be less than 100 characters'),
        frequency: z.enum(['daily', 'weekly']).optional(),
    }),
});

const updateHabitSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
    }),
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Habit ID'),
    }),
});

const toggleHabitSchema = z.object({
    body: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format').optional(),
    }),
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Habit ID'),
    }),
});

const reorderHabitsSchema = z.object({
    body: z.object({
        habits: z.array(
            z.object({
                _id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Habit ID'),
                order: z.number().int().min(0),
            })
        ),
    }),
});

const deleteHabitSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Habit ID'),
    }),
});

module.exports = {
    createHabitSchema,
    updateHabitSchema,
    toggleHabitSchema,
    reorderHabitsSchema,
    deleteHabitSchema,
};
