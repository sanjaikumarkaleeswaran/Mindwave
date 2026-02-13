const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Middleware
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(cors()); // Enable CORS
app.use(require('helmet')({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading resources (images) from different origins/ports
}));
app.use(require('./middleware/mongoSanitize')()); // Sanitize data (Express 5 compatible)
app.use(require('./middleware/xssSanitize')()); // Prevent XSS attacks (Express 5 compatible)
app.use(require('hpp')()); // Prevent HTTP Parameter Pollution

const { limiter } = require('./config/rateLimit');
app.use('/api', limiter); // Rate limiting

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection // // 
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        console.log("Attempting to connect to MongoDB with URI found:", !!uri);
        if (!uri) {
            console.error("CRITICAL ERROR: MongoDB URI is undefined. Check .env file.");
            console.log("Current Environment Variables Keys:", Object.keys(process.env));
        }
        await mongoose.connect(uri); // removed deprecated options
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // process.exit(1); // Keep running to show "Connection Error" on console if config is wrong
    }
};
connectDB();

// Routes
console.log('Loading routes...');
app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api/habits', require('./routes/habit.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/journal', require('./routes/journal.routes'));

console.log('All routes loaded.');

app.get('/', (req, res) => res.send('API Running'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'production' ? null : err.message
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
