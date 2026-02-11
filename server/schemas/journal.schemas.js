const { z } = require('zod');

const createJournalSchema = z.object({
    body: z.object({
        title: z.string().max(200).optional(),
        content: z.string().min(1, 'Content is required').max(20000, 'Content too long'),
        mood: z.string().max(50).optional(),
        tags: z.array(z.string().max(30)).max(10).optional(),
        date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(), // Allow ISO or date string
    }),
});

const updateJournalSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Journal ID'),
    }),
    body: z.object({
        title: z.string().max(200).optional(),
        content: z.string().min(1).max(20000).optional(),
        mood: z.string().max(50).optional(),
        tags: z.array(z.string().max(30)).max(10).optional(),
    }),
});

const getJournalSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Journal ID'),
    }),
});

const getJournalRangeSchema = z.object({
    params: z.object({
        startDate: z.string(), // Customize validation if needed
        endDate: z.string(),
    }),
});

const analyzeJournalSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Journal ID'),
    }),
});

const batchAnalyzeSchema = z.object({
    body: z.object({
        startDate: z.string(),
        endDate: z.string(),
    }),
});

module.exports = {
    createJournalSchema,
    updateJournalSchema,
    getJournalSchema,
    getJournalRangeSchema,
    analyzeJournalSchema,
    batchAnalyzeSchema,
};
