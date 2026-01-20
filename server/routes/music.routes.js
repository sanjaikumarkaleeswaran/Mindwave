const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Music = require('../models/Music');
const Playlist = require('../models/Playlist');

// @route   POST api/music/upload
// @desc    Add a song (Metadata + URL)
// @access  Private
router.post('/upload', auth, async (req, res) => {
    try {
        const { title, artist, album, duration, fileUrl, moodTags } = req.body;

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

module.exports = router;
