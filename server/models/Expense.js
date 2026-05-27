const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:     { type: String, enum: ['income', 'expense'], required: true },
    amount:   { type: Number, required: true },
    category: { type: String, required: true },
    note:     { type: String, default: '' },
    date:     { type: Date, default: Date.now },

    // Enhanced fields
    currency:           { type: String, default: 'INR' },
    tags:               [{ type: String, trim: true }],
    attachmentUrl:      { type: String, default: '' },   // receipt photo URL
    recurringInterval:  {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
        default: 'none'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'netbanking', 'other'],
        default: 'other'
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
