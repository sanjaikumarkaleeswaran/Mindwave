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
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sanitize(obj[i]);
        }
        return obj;
    }

    // Handle objects
    for (const key in obj) {
        if (/^\$/.test(key)) {
            // Remove keys starting with $ (MongoDB operators)
            delete obj[key];
        } else if (key.includes('.')) {
            // Remove keys with dots
            delete obj[key];
        } else {
            // Recurse and assign back to handle primitive returns or mutated objects
            obj[key] = sanitize(obj[key]);
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
