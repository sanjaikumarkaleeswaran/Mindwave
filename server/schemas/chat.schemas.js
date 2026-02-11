const { z } = require('zod');

const sendChatSchema = z.object({
    body: z.object({
        message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
        conversationId: z.string().optional(), // Can be optional if new chat, but usually required
        model: z.string().optional(),
    }),
});

const conversationIdSchema = z.object({
    params: z.object({
        conversationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Conversation ID'),
    }),
});

const deleteConversationSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Conversation ID'),
    }),
});

module.exports = {
    sendChatSchema,
    conversationIdSchema,
    deleteConversationSchema,
};
