/**
 * Password Reset Utility
 * Usage: node reset_password.js <email> <newPassword>
 * Example: node reset_password.js sanjaikumarkaleeswarann@gmail.com Admin@123
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const [,, email, newPassword] = process.argv;

if (!email || !newPassword) {
    console.error('Usage: node reset_password.js <email> <newPassword>');
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        const user = await User.findOne({ email });
        if (!user) {
            console.error(`❌ No user found with email: ${email}`);
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        console.log(`✅ Password updated for ${email}`);
        console.log(`   New password: ${newPassword}`);
        console.log(`   You can now log in at /auth`);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();
