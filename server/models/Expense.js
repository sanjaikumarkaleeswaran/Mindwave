const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
