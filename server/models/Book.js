const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    coverUrl: {
        type: String,
        default: ''
    },
    pdfUrl: {
        type: String,
        default: ''
    },
    totalPages: {
        type: Number,
        default: 0
    },
    currentPage: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['want_to_read', 'reading', 'finished'],
        default: 'want_to_read'
    },
    notes: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);
