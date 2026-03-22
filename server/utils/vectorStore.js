const { pipeline } = require('@xenova/transformers');
const VectorChunk = require('../models/VectorChunk');

// Singleton to hold the model
class FeatureExtractionPipeline {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Generate embeddings for a text string
async function generateEmbedding(text) {
    const extractor = await FeatureExtractionPipeline.getInstance();
    // Using mean pooling to get a single vector representing the text
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    // Convert Float32Array to standard JS Array
    return Array.from(output.data);
}

// Simple text chunker by paragraphs
function chunkText(text, maxChunkSize = 1000) {
    // Split by newlines first
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const p of paragraphs) {
        const paragraph = p.trim();
        if (!paragraph) continue;

        if ((currentChunk.length + paragraph.length) > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }

        currentChunk += paragraph + '\n\n';
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// Math Utility for Cosine Similarity
// Both a and b are arrays of numbers
function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Store a document
async function ingestDocument(userId, conversationId, source, fullText) {
    console.log(`Ingesting document: ${source}...`);
    const chunks = chunkText(fullText);
    
    // Process chunks and save to DB
    for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        try {
            const embedding = await generateEmbedding(chunkContent);
            
            const vectorChunk = new VectorChunk({
                userId,
                conversationId,
                source,
                content: chunkContent,
                embedding
            });
            await vectorChunk.save();
        } catch (err) {
            console.error(`Error embedding chunk ${i}: `, err);
        }
    }
    console.log(`Finished ingesting ${chunks.length} chunks for ${source}`);
    return chunks.length;
}

// Search similar chunks across user's documents
// If conversationId is provided, restrict to those. Otherwise, global user search.
async function searchSimilarChunks(userId, queryText, conversationId = null, topK = 3) {
    const queryEmbedding = await generateEmbedding(queryText);
    
    // Find all chunks for user (or specific conversation)
    const filter = { userId };
    if (conversationId) filter.conversationId = conversationId;

    const allChunks = await VectorChunk.find(filter);

    // Calculate similarity
    const results = allChunks.map(chunk => {
        const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
        return { chunk, similarity: sim };
    });

    // Sort by desc similarity and format output
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK).map(res => ({
        content: res.chunk.content,
        source: res.chunk.source,
        similarity: res.similarity
    }));
}

module.exports = {
    generateEmbedding,
    chunkText,
    ingestDocument,
    searchSimilarChunks
};
