const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        console.log("URI:", uri ? "Found" : "Not Found");
        await mongoose.connect(uri);
        console.log('MongoDB Connected Successfully');
        process.exit(0);
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

connectDB();
