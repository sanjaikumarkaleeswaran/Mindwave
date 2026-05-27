const { z } = require('zod');

const createHabitSchema = z.object({
    body: z.object({
        name:      z.string().min(1, 'Habit name is required').max(100),
        frequency: z.enum(['daily', 'weekly']).optional(),
        category:  z.enum(['health','fitness','learning','mindfulness','productivity','social','finance','other']).optional(),
        color:     z.string().max(20).optional(),
        icon:      z.string().max(10).optional(),
        description:   z.string().max(300).optional(),
        reminderTime:  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal('')),
        targetDaysPerWeek: z.number().int().min(1).max(7).optional(),
    }),
});

const updateHabitSchema = z.object({
    body: z.object({
        name:      z.string().min(1).max(100).optional(),
        frequency: z.enum(['daily', 'weekly']).optional(),
        category:  z.enum(['health','fitness','learning','mindfulness','productivity','social','finance','other']).optional(),
        color:     z.string().max(20).optional(),
        icon:      z.string().max(10).optional(),
        description:   z.string().max(300).optional(),
        reminderTime:  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal('')),
        targetDaysPerWeek: z.number().int().min(1).max(7).optional(),
    }),
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Habit ID'),
    }),
});

const toggleHabitSchema = z.object({
    body: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format').optional(),
    }).strict(),
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
    }).strict(),
});

const deleteHabitSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Habit ID'),
    }).strict(),
});

module.exports = {
    createHabitSchema,
    updateHabitSchema,
    toggleHabitSchema,
    reorderHabitsSchema,
    deleteHabitSchema,
};
