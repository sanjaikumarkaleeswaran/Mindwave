const axios = require('axios');
async function run() {
    try {
        const res = await axios.post('http://localhost:5000/api/chat/send', {
            message: "test",
            conversationId: "invalid",
            model: "llama-3.3-70b-versatile"
        });
        console.log("No auth error??", res.status);
    } catch(err) {
        if (err.response) {
            console.log("STATUS", err.response.status, JSON.stringify(err.response.data));
        } else {
            console.error(err);
        }
    }
}
run();
