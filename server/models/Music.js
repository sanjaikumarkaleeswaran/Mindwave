const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    artist: { type: String, default: 'Unknown Artist' },
    album: { type: String },
    duration: { type: Number },
    moodTags: [{ type: String }],
    fileUrl: { type: String, required: true },
    liked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Music', MusicSchema);
