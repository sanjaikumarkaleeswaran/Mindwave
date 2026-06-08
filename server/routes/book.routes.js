const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Book = require('../models/Book');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { ingestDocument } = require('../utils/vectorStore');

const bookUploadDir = path.join(__dirname, '../uploads/books');
if (!fs.existsSync(bookUploadDir)) {
    fs.mkdirSync(bookUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/books/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 1024 * 1024 * 50 } }); // 50MB max pdf

// @route   GET /api/books
// @desc    Get all books for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const books = await Book.find({ user: req.user.id }).sort({ updatedAt: -1 });
        res.json(books);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/books
// @desc    Add a new book (with optional PDF upload)
// @access  Private
router.post('/', auth, upload.single('pdf'), async (req, res) => {
    try {
        const { title, author, coverUrl, status } = req.body;
        let totalPages = parseInt(req.body.totalPages) || 0;
        let pdfUrl = '';

        if (req.file) {
            pdfUrl = `/uploads/books/${req.file.filename}`;
            try {
                if (!totalPages) {
                    const dataBuffer = fs.readFileSync(req.file.path);
                    const data = await pdfParse(dataBuffer);
                    if (data && data.numpages) {
                        totalPages = data.numpages;
                    }
                    if (data && data.text) {
                        // Background ingestion for Vector RAG
                        ingestDocument(req.user.id, null, `Book: ${title}`, data.text)
                            .catch(err => console.error("Vector ingestion error:", err));
                    }
                }
            } catch (err) {
                console.error("PDF Parse error:", err);
            }
        }
        
        const newBook = new Book({
            user: req.user.id,
            title,
            author,
            coverUrl,
            pdfUrl,
            totalPages,
            status: status || 'want_to_read'
        });

        const book = await newBook.save();
        res.json(book);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/books/:id
// @desc    Update book progress or details
// @access  Private
router.put('/:id', auth, upload.single('pdf'), async (req, res) => {
    try {
        const { currentPage, status, notes, rating, title, author, coverUrl, totalPages } = req.body;
        
        let book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        
        // Ensure user owns the book
        if (book.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (req.file) {
            book.pdfUrl = `/uploads/books/${req.file.filename}`;
            try {
                if (!totalPages && !book.totalPages) {
                    const dataBuffer = fs.readFileSync(req.file.path);
                    const data = await pdfParse(dataBuffer);
                    if (data && data.numpages) {
                        book.totalPages = data.numpages;
                    }
                    if (data && data.text) {
                        // Background ingestion for Vector RAG
                        ingestDocument(req.user.id, null, `Book: ${book.title}`, data.text)
                            .catch(err => console.error("Vector ingestion error:", err));
                    }
                }
            } catch (err) {
                console.error("PDF Parse error:", err);
            }
        }

        if (currentPage !== undefined) book.currentPage = currentPage;
        if (status) book.status = status;
        if (notes !== undefined) book.notes = notes;
        if (rating !== undefined) book.rating = rating;
        if (title) book.title = title;
        if (author) book.author = author;
        if (coverUrl !== undefined) book.coverUrl = coverUrl;
        if (totalPages !== undefined && totalPages > 0) book.totalPages = totalPages;

        // Auto update status if finished
        if (book.currentPage >= book.totalPages && book.totalPages > 0) {
            book.status = 'finished';
            book.currentPage = book.totalPages; // ensure it doesn't exceed
        } else if (book.currentPage > 0 && book.status === 'want_to_read') {
            book.status = 'reading';
        }

        await book.save();
        res.json(book);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/books/:id
// @desc    Delete a book
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        
        // Ensure user owns the book
        if (book.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await book.deleteOne();
        res.json({ msg: 'Book removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
