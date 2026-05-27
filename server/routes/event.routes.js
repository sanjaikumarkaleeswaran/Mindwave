const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Event = require('../models/Event');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');

// ── Validation Schemas ───────────────────────────────────────────────────────
const createEventSchema = z.object({
    body: z.object({
        title:       z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        startDate:   z.string(),   // ISO string
        endDate:     z.string().optional(),
        allDay:      z.boolean().optional(),
        color:       z.string().optional(),
        category:    z.enum(['personal','work','health','social','finance','learning','habit','goal','other']).optional(),
        linkedGoalId:  z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
        linkedHabitId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
        reminder:    z.boolean().optional(),
        reminderMinutesBefore: z.number().optional(),
        recurring:   z.enum(['none','daily','weekly','monthly']).optional(),
        completed:   z.boolean().optional(),
    })
});

const updateEventSchema = z.object({
    body: z.object({
        title:       z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        startDate:   z.string().optional(),
        endDate:     z.string().optional().nullable(),
        allDay:      z.boolean().optional(),
        color:       z.string().optional(),
        category:    z.enum(['personal','work','health','social','finance','learning','habit','goal','other']).optional(),
        linkedGoalId:  z.string().optional().nullable(),
        linkedHabitId: z.string().optional().nullable(),
        reminder:    z.boolean().optional(),
        reminderMinutesBefore: z.number().optional(),
        recurring:   z.enum(['none','daily','weekly','monthly']).optional(),
        completed:   z.boolean().optional(),
    })
});

// ── GET /api/events  — list events (with optional date range filter) ─────────
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;
        const query = { userId: req.user.id };

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate)   query.startDate.$lte = new Date(endDate);
        }
        if (category) query.category = category;

        const events = await Event.find(query).sort({ startDate: 1 });
        res.json(events);
    } catch (err) {
        console.error('Event GET Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, userId: req.user.id });
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ── POST /api/events — create event ──────────────────────────────────────────
router.post('/', auth, validate(createEventSchema), async (req, res) => {
    try {
        const event = new Event({ userId: req.user.id, ...req.body });
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        console.error('Event POST Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ── PUT /api/events/:id — update event ───────────────────────────────────────
router.put('/:id', auth, validate(updateEventSchema), async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        res.json(event);
    } catch (err) {
        console.error('Event PUT Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ── PATCH /api/events/:id/toggle — toggle completion ─────────────────────────
router.patch('/:id/toggle', auth, async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, userId: req.user.id });
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        event.completed = !event.completed;
        await event.save();
        res.json(event);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ── DELETE /api/events/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        res.json({ msg: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ── GET /api/events/upcoming — next 7 days events ────────────────────────────
router.get('/range/upcoming', auth, async (req, res) => {
    try {
        const now = new Date();
        const end = new Date(); end.setDate(end.getDate() + 7);

        const events = await Event.find({
            userId: req.user.id,
            startDate: { $gte: now, $lte: end },
            completed: false
        }).sort({ startDate: 1 }).limit(10);

        res.json(events);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
