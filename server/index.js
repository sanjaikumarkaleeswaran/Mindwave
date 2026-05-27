const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.set('trust proxy', 1); // Trust the reverse proxy (Render) to get real client IPs for rate-limiting

// Middleware
app.use(express.json({ limit: '10kb' })); // Body limit
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://mindwave-snowy.vercel.app',
    'https://mindwave-a62e.onrender.com', // Render frontend
    process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        // Allow dynamic localhost ports (e.g. 5174, 5175 from Vite)
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true
})); // Enable CORS
app.use(require('helmet')({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading resources (images) from different origins/ports
}));
app.use(require('./middleware/mongoSanitize')()); // Sanitize data (Express 5 compatible)
app.use(require('./middleware/xssSanitize')()); // Prevent XSS attacks (Express 5 compatible)
app.use(require('hpp')()); // Prevent HTTP Parameter Pollution

const { limiter } = require('./config/rateLimit');
app.use('/api', limiter); // Rate limiting

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        console.log("Attempting to connect to MongoDB with URI found:", !!uri);

        if (!uri) {
            console.error("CRITICAL ERROR: MongoDB URI is undefined. Check .env file.");
            console.log("Current Environment Variables Keys:", Object.keys(process.env));
            // process.exit(1); // Exit process with failure
            return;
        }

        await mongoose.connect(uri);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // process.exit(1); // Exit process with failure
    }
};
connectDB();

// Routes
console.log('Loading routes...');
app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api/habits', require('./routes/habit.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/journal', require('./routes/journal.routes'));
app.use('/api/goals', require('./routes/goal.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

console.log('All routes loaded.');

app.get('/', (req, res) => res.send('API Running'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    require('fs').writeFileSync('global_crash.json', JSON.stringify({message: err.message, stack: err.stack}, null, 2));
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'production' ? null : err.message
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


module.exports = app;
