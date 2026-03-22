const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/User'); // Assuming this exists

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        let user = await User.findOne();

        if(!user) {
           console.error("No user found");
           process.exit(1);
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        const convRes = await axios.post('http://localhost:5000/api/chat/conversations', {}, {
            headers: { 'x-auth-token': token }
        });
        const conversationId = convRes.data._id;

        const res = await axios.post('http://localhost:5000/api/chat/send', 
            { message: "test", conversationId, model: "llama-3.3-70b-versatile" }, 
            { headers: { 'x-auth-token': token } }
        );

        console.log("SUCCESS", res.data);

    } catch (err) {
        if(err.response) {
            console.error("API 500 Error:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error("FAIL", err.message, err.stack);
        }
    } finally {
        mongoose.disconnect();
    }
}
run();
