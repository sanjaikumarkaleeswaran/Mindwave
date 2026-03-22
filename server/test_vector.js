const { generateEmbedding } = require('./utils/vectorStore');

async function run() {
    try {
        const res = await generateEmbedding('hello world');
        console.log("Success", res.length);
    } catch(err) {
        console.error("FAIL", err);
    }
}
run();
