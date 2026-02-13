/**
 * Custom XSS Sanitizer Middleware
 * Replaces xss-clean to be compatible with Express 5 (req.query is getter-only)
 * and provides a simple recursive HTML escaping mechanism.
 */

const htmlRegex = /[&<>"']/;
const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
};

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    if (!htmlRegex.test(text)) return text;
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function sanitize(data) {
    if (!data) return data;

    if (typeof data === 'string') {
        return escapeHtml(data);
    }

    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            data[i] = sanitize(data[i]);
        }
        return data;
    }

    if (typeof data === 'object') {
        // We don't want to mutate the original object if possible, 
        // but for middleware it's often expected to sanitize in place or return cleaned.
        // For deep objects, we iterate.
        Object.keys(data).forEach(key => {
            data[key] = sanitize(data[key]);
        });
    }

    return data;
}

const xssSanitize = () => (req, res, next) => {
    try {
        if (req.body) sanitize(req.body);
        if (req.params) sanitize(req.params);

        // Handle query for Express 5
        if (req.query) {
            // Since req.query is read-only reference to an object we can mutate content of,
            // but we cannot reassign req.query itself.
            // Iterate over keys.
            for (const key in req.query) {
                req.query[key] = sanitize(req.query[key]);
            }
        }
    } catch (err) {
        console.error('XSS Sanitization error:', err);
    }
    next();
};

module.exports = xssSanitize;
