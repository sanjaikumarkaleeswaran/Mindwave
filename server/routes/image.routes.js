const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

// @route   POST api/image/generate
// @desc    Generate an image
router.post('/generate', auth, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ msg: 'Prompt is required' });
        }

        console.log("Generating image for prompt:", prompt);
        // Using Pollinations.ai (Free, no key required)
        const encodedPrompt = encodeURIComponent(prompt);
        // Random seed to ensure new images for same prompt
        const seed = Math.floor(Math.random() * 1000000);
        // Using Turbo model for speed and reliability
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

        res.json({ imageUrl });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
