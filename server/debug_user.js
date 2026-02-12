const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const debugUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const email = 'sanjaikumarkaleeswarann@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found in DB');
            process.exit(0);
        }

        console.log('User found:', user._id);
        console.log('Password Hash:', user.password);
        console.log('Is Verified:', user.isVerified);

        // Test bcrypt
        try {
            console.log('Testing bcrypt.compare...');
            const isMatch = await bcrypt.compare('somepassword', user.password);
            console.log('bcrypt.compare result:', isMatch); // Should be false, but valid
        } catch (err) {
            console.error('Bcrypt Error:', err.message);
        }

        // Test JWT
        try {
            console.log('Testing jwt.sign...');
            const payload = { user: { id: user.id } };
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5d' }
            );
            console.log('JWT generated successfully');
        } catch (err) {
            console.error('JWT Error:', err.message);
        }

        console.log('Debug complete');
        process.exit(0);

    } catch (err) {
        console.error('Global Error:', err);
        process.exit(1);
    }
};

debugUser();
