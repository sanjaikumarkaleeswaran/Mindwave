const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/image', require('./routes/image.routes'));
console.log('All routes loaded.');

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
