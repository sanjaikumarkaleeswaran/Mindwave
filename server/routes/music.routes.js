const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Music = require('../models/Music');
const Playlist = require('../models/Playlist');
const ytSearch = require('yt-search');

// @route   POST api/music/upload
// @desc    Add a song (Metadata + URL)
// @access  Private
const axios = require('axios');

// ... (imports)

router.post('/upload', auth, async (req, res) => {
    try {
        let { title, artist, album, duration, fileUrl, moodTags } = req.body;

        // Auto-find URL if missing
        if (!fileUrl) {
            const query = `${title} ${artist} official audio`;
            console.log(`Searching for: ${query}`);

            // 1. Try Official YouTube Data API (if key exists)
            if (process.env.YOUTUBE_API_KEY) {
                try {
                    console.log("Using YouTube Data API v3...");
                    const ytRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                        params: {
                            part: 'snippet',
                            q: query,
                            type: 'video',
                            videoCategoryId: '10', // Music Category
                            key: process.env.YOUTUBE_API_KEY,
                            maxResults: 1
                        }
                    });

                    if (ytRes.data.items && ytRes.data.items.length > 0) {
                        const item = ytRes.data.items[0];
                        fileUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                        title = title || item.snippet.title;
                        // Duration requires a second API call (videos endpoint), skipping for now or relying on client player
                        console.log(`Found via API: ${fileUrl}`);
                    }
                } catch (apiErr) {
                    console.error("YouTube API Error (falling back to scraper):", apiErr.message);
                }
            }

            // 2. Fallback to scraping (yt-search)
            if (!fileUrl) {
                console.log("Using yt-search scraper...");
                const r = await ytSearch(query);
                if (r && r.videos.length > 0) {
                    fileUrl = r.videos[0].url;
                    title = title || r.videos[0].title;
                    duration = r.videos[0].seconds || duration;
                    console.log(`Found via Scraper: ${fileUrl}`);
                }
            }

            if (!fileUrl) {
                return res.status(400).json({ msg: 'Could not find song on YouTube.' });
            }
        }

        // ... (rest of save logic)
        const newMusic = new Music({
            userId: req.user.id,
            title,
            artist,
            album,
            duration,
            fileUrl,
            moodTags
        });

        const music = await newMusic.save();
        res.json(music);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper to parse ISO 8601 duration (PT#H#M#S) to H:MM:SS or MM:SS
function formatDuration(isoTag) {
    if (!isoTag) return "0:00";
    const matches = isoTag.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return "0:00";

    const h = matches[1] ? parseInt(matches[1].replace('H', '')) : 0;
    const m = matches[2] ? parseInt(matches[2].replace('M', '')) : 0;
    const s = matches[3] ? parseInt(matches[3].replace('S', '')) : 0;

    const parts = [];
    if (h > 0) {
        parts.push(h);
        parts.push(m.toString().padStart(2, '0'));
    } else {
        parts.push(m);
    }
    parts.push(s.toString().padStart(2, '0'));

    return parts.join(':');
}

// @route   GET api/music/search
// @desc    Search YouTube for songs
// @access  Private
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ msg: 'Query is unique' });

        console.log(`Searching for: ${query}`);
        let results = [];

        // 1. Try Official YouTube Data API
        if (process.env.YOUTUBE_API_KEY) {
            try {
                const ytRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                    params: {
                        part: 'snippet', // Search endpoint only returns snippet
                        q: query,
                        type: 'video',
                        videoCategoryId: '10', // Music
                        key: process.env.YOUTUBE_API_KEY,
                        maxResults: 5
                    }
                });

                // Search API doesn't return duration. We need to fetch details for these video IDs.
                const videoIds = ytRes.data.items.map(item => item.id.videoId).join(',');

                if (videoIds) {
                    const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                        params: {
                            part: 'contentDetails,snippet',
                            id: videoIds,
                            key: process.env.YOUTUBE_API_KEY
                        }
                    });

                    results = detailsRes.data.items.map(item => ({
                        title: item.snippet.title,
                        videoId: item.id,
                        thumbnail: item.snippet.thumbnails.default.url,
                        channel: item.snippet.channelTitle,
                        duration: formatDuration(item.contentDetails.duration)
                    }));
                }

            } catch (e) {
                console.error("API Search failed, using fallback:", e.message);
            }
        }

        // 2. Fallback to Scraper if needed
        if (results.length === 0) {
            const r = await ytSearch(query + " official audio");
            if (r && r.videos.length > 0) {
                results = r.videos.slice(0, 5).map(v => ({
                    title: v.title,
                    videoId: v.videoId,
                    thumbnail: v.thumbnail,
                    duration: v.timestamp // yt-search returns "MM:SS" or "H:MM:SS"
                }));
            }
        }

        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/music/:id
// @desc    Update a song
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, artist, fileUrl, moodTags } = req.body;
        let music = await Music.findById(req.params.id);
        if (!music) return res.status(404).json({ msg: 'Not found' });
        if (music.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        music.title = title || music.title;
        music.artist = artist || music.artist;
        music.fileUrl = fileUrl || music.fileUrl;
        music.moodTags = moodTags || music.moodTags;

        await music.save();
        res.json(music);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/music
// @desc    Get all user's music
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const music = await Music.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(music);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/music/:id/like
// @desc    Toggle like status
// @access  Private
router.put('/:id/like', auth, async (req, res) => {
    try {
        let music = await Music.findById(req.params.id);

        if (!music) return res.status(404).json({ msg: 'Music not found' });
        if (music.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        music.liked = !music.liked;
        await music.save();
        res.json(music);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/music/playlists
// @desc    Create a playlist
// @access  Private
router.post('/playlists', auth, async (req, res) => {
    try {
        const { name, songs } = req.body;
        const newPlaylist = new Playlist({
            userId: req.user.id,
            name,
            songs // Array of Music IDs
        });
        const playlist = await newPlaylist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/music/playlists
// @desc    Get all playlists
// @access  Private
router.get('/playlists', auth, async (req, res) => {
    try {
        const playlists = await Playlist.find({ userId: req.user.id }).populate('songs');
        res.json(playlists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/music/playlists/:id
// @desc    Update a playlist (add/remove songs)
// @access  Private
router.put('/playlists/:id', auth, async (req, res) => {
    try {
        const { name, songs } = req.body;
        let playlist = await Playlist.findById(req.params.id);

        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });
        if (playlist.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        if (name) playlist.name = name;
        if (songs) playlist.songs = songs;

        await playlist.save();
        // Return populated for frontend
        const populated = await Playlist.findById(req.params.id).populate('songs');
        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/music/playlists/:id
// @desc    Delete a playlist
// @access  Private
router.delete('/playlists/:id', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });
        if (playlist.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await playlist.deleteOne();
        res.json({ msg: 'Playlist removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/music/:id
// @desc    Delete a song
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const music = await Music.findById(req.params.id);
        if (!music) return res.status(404).json({ msg: 'Music not found' });

        // Check user
        if (music.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await music.deleteOne();
        res.json({ msg: 'Song removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
