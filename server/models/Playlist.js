const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
