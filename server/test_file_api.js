const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/User'); // Assuming this exists

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        let user = await User.findOne();
        if(!user) { process.exit(1); }

        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        const convRes = await axios.post('http://localhost:5000/api/chat/conversations', {}, {
            headers: { 'x-auth-token': token }
        });

        // Create a dummy file
        fs.writeFileSync('dummy.txt', 'This is a test file to be embedded');
        
        const formData = new FormData();
        formData.append('message', 'What is this file?');
        formData.append('conversationId', convRes.data._id);
        formData.append('model', 'llama-3.3-70b-versatile');
        formData.append('file', fs.createReadStream('dummy.txt'));

        const res = await axios.post('http://localhost:5000/api/chat/send', formData, { 
            headers: { 
                'x-auth-token': token,
                ...formData.getHeaders()
            } 
        });

        console.log("SUCCESS");
        fs.writeFileSync('api_crash_file.json', JSON.stringify(res.data));

    } catch (err) {
        if(err.response) {
            fs.writeFileSync('api_crash_file.json', JSON.stringify({status: err.response.status, data: err.response.data}, null, 2));
        } else {
            console.error(err);
        }
    } finally {
        mongoose.disconnect();
    }
}
run();
