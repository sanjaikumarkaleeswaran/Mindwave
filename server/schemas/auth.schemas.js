const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        avatar: z.string().url().optional().or(z.literal('')),
    }),
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
    }),
});

const resetPasswordSchema = z.object({
    body: z.object({
        password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    }),
    params: z.object({
        resetToken: z.string().length(40, 'Invalid token format'),
    }),
});

const verifyEmailSchema = z.object({
    params: z.object({
        token: z.string().length(40, 'Invalid token format'),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema,
};
