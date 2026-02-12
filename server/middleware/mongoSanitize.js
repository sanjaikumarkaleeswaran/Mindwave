/**
 * Custom MongoDB Sanitization Middleware
 * Replaces express-mongo-sanitize to avoid Express 5 compatibility issues
 * and removes dependency on the external package for this critical path.
 */

function sanitize(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.forEach(item => sanitize(item));
    }

    // Handle objects
    for (const key in obj) {
        if (/^\$/.test(key)) {
            // Remove keys starting with $ (MongoDB operators)
            delete obj[key];
        } else if (key.includes('.')) {
            // Optional: remove keys with dots if you want to prevent dot notation injection
            // But usually $ is the critical one. 
            // We'll leave dots for now as they might be valid in some contexts, 
            // but standard sanitizer often removes them or replaces them.
            // Let's stick to $ for now.
            delete obj[key]; // Safer to delete if unsure
        } else {
            // Recurse
            sanitize(obj[key]);
        }
    }
    return obj;
}

const sanitizeMiddleware = () => (req, res, next) => {
    try {
        if (req.body) sanitize(req.body);
        if (req.params) sanitize(req.params);
        if (req.headers) sanitize(req.headers);

        // Handle query specifically for Express 5 (getter-only)
        if (req.query) {
            // We can mutate the object returned by the getter
            sanitize(req.query);
        }
    } catch (err) {
        console.error('Sanitization error:', err);
    }
    next();
};

module.exports = sanitizeMiddleware;
