const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { createExpenseSchema, updateExpenseSchema, setBudgetSchema } = require('../schemas/expense.schemas');

// GET all expenses (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { category, type, startDate, endDate } = req.query;
        let query = { userId: req.user.id };

        if (category) query.category = category;
        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// POST add expense
router.post('/', auth, validate(createExpenseSchema), async (req, res) => {
    try {
        const { type, amount, category, note, date } = req.body;
        const expense = new Expense({
            userId: req.user.id,
            type,
            amount,
            category,
            note,
            date: date || Date.now()
        });
        await expense.save();

        // Budget check
        const start = new Date(expense.date.getFullYear(), expense.date.getMonth(), 1);
        const end = new Date(expense.date.getFullYear(), expense.date.getMonth() + 1, 0);
        const monthStr = expense.date.toISOString().slice(0, 7);

        const budget = await Budget.findOne({ userId: req.user.id, category, month: monthStr });
        if (budget) {
            const totalSpent = await Expense.aggregate([
                { $match: { userId: expense.userId, category, date: { $gte: start, $lte: end }, type: 'expense' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const currentTotal = totalSpent.length > 0 ? totalSpent[0].total : 0;
            if (currentTotal > budget.limit) {
                return res.json({ 
                    expense, 
                    warning: `Budget exceeded for ${category}! Limit: ₹${budget.limit.toLocaleString('en-IN')}, Spent: ₹${currentTotal.toLocaleString('en-IN')}` 
                });
            }
        }

        res.json(expense);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// PUT update expense
router.put('/:id', auth, validate(updateExpenseSchema), async (req, res) => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });
        res.json(expense);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// DELETE expense
router.delete('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });
        res.json({ msg: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// GET summary
router.get('/summary', auth, async (req, res) => {
    try {
        const { month } = req.query; // YYYY-MM
        let start, end;
        if (month) {
            start = new Date(`${month}-01`);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
        } else {
            const today = new Date();
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        }

        const expenses = await Expense.find({
            userId: req.user.id,
            date: { $gte: start, $lte: end }
        });

        const summary = expenses.reduce((acc, curr) => {
            if (curr.type === 'income') {
                acc.totalIncome += curr.amount;
            } else {
                acc.totalExpense += curr.amount;
                acc.categoryBreakdown[curr.category] = (acc.categoryBreakdown[curr.category] || 0) + curr.amount;
            }
            return acc;
        }, {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            categoryBreakdown: {}
        });

        summary.balance = summary.totalIncome - summary.totalExpense;

        res.json(summary);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// GET budgets
router.get('/budgets', auth, async (req, res) => {
    try {
        const { month } = req.query;
        let query = { userId: req.user.id };
        if (month) query.month = month;
        const budgets = await Budget.find(query);
        res.json(budgets);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// POST set budget
router.post('/budgets', auth, validate(setBudgetSchema), async (req, res) => {
    try {
        const { category, limit, month } = req.body;
        const budget = await Budget.findOneAndUpdate(
            { userId: req.user.id, category, month },
            { limit },
            { upsert: true, new: true }
        );
        res.json(budget);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
