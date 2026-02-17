const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per 15 minutes (approx 1 every 3 seconds)
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use User ID if authenticated, otherwise fallback to IP
        return req.user ? req.user.id : req.ip;
    },
    message: {
        msg: 'Too many requests, please try again after 15 minutes',
    },
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/register attempts per hour
    keyGenerator: (req) => {
        return req.user ? req.user.id : req.ip;
    },
    message: {
        msg: 'Too many login/register attempts, please try again after an hour',
    },
});

module.exports = {
    limiter,
    authLimiter,
};
