const { z } = require('zod');

const createExpenseSchema = z.object({
    body: z.object({
        type: z.enum(['income', 'expense']),
        amount: z.number().positive(),
        category: z.string().min(1),
        note: z.string().max(500).optional(),
        date: z.string().optional(),
    }).strict()
});

const updateExpenseSchema = z.object({
    body: z.object({
        type: z.enum(['income', 'expense']).optional(),
        amount: z.number().positive().optional(),
        category: z.string().min(1).optional(),
        note: z.string().max(500).optional(),
        date: z.string().optional(),
    }).strict()
});

const setBudgetSchema = z.object({
    body: z.object({
        category: z.string().min(1),
        limit: z.number().nonnegative(),
        month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
    }).strict()
});

module.exports = {
    createExpenseSchema,
    updateExpenseSchema,
    setBudgetSchema
};
