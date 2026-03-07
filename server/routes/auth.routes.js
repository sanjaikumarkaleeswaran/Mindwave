const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth.middleware');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Journal = require('../models/Journal');
const Habit = require('../models/Habit');
const Conversation = require('../models/Conversation');
const ChatHistory = require('../models/ChatHistory');
const validate = require('../middleware/validate.middleware');
const {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema
} = require('../schemas/auth.schemas');
const { authLimiter } = require('../config/rateLimit');

const { sendEmail, buildHtmlEmail } = require('../utils/sendEmail');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // 🚀 BYPASS EMAIL VERIFICATION FOR RENDER FREE TIER
        user.isVerified = true;
        // const verificationToken = crypto.randomBytes(20).toString('hex');
        // user.verificationToken = crypto
        //     .createHash('sha256')
        //     .update(verificationToken)
        //     .digest('hex');
        // user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const verifyUrl = `${clientUrl}/verify-email/bypass`;

        // 🚀 SKIP SENDING ACTUAL EMAIL ON RENDER FREE TIER
        /*
        const plainMessage = `Please verify your MindWave account by visiting: ${verifyUrl}`;
        const htmlMessage = buildHtmlEmail(
            // ...
        );
        */

        try {
            // await sendEmail({...});
            // Automatically log in the user after fast registration bypass
            const payload = { user: { id: user.id } };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' });

            res.json({ success: true, token, msg: 'Registration successful! (Email bypassed)' });
        } catch (err) {
            console.error(err);
            // user.verificationToken = undefined;
            // user.verificationTokenExpire = undefined;
            // await user.save();
            return res.status(500).json({ msg: 'Registration failed during token generation.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public


router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    try {
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found: ${email}`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`Invalid password for: ${email}`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check if email is verified
        // 🚀 BYPASS CHECK FOR RENDER FREE TIER (All new users auto-verified)
        // if (!user.isVerified) {
        //     console.log(`Unverified login attempt for: ${email}`);
        //     return res.status(403).json({ msg: 'Please verify your email before logging in. Check your inbox for the verification link.' });
        // }

        const payload = {
            user: {
                id: user.id
            }
        };

        try {
            // Use synchronous signing to ensure errors are caught
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5d' }
            );
            console.log(`Login successful for: ${email}`);
            res.json({ token });
        } catch (jwtError) {
            console.error('JWT Signing Error:', jwtError);
            res.status(500).send('Server error during token generation');
        }

    } catch (err) {
        console.error('Login Route Error:', err.message);
        console.error(err.stack); // Log full stack trace
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private

router.put('/profile', auth, validate(updateProfileSchema), async (req, res) => {
    const { name, avatar } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name;
        if (avatar) user.avatar = avatar;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/auth/profile
// @desc    Delete user and all associated data
// @access  Private
router.delete('/profile', auth, async (req, res) => {
    try {
        // 1. Delete all journals
        await Journal.deleteMany({ userId: req.user.id });

        // 2. Delete all habits
        await Habit.deleteMany({ userId: req.user.id });

        // 3. Delete all chat history & conversations
        await ChatHistory.deleteMany({ userId: req.user.id });
        await Conversation.deleteMany({ userId: req.user.id });

        // 4. Delete the user
        await User.findOneAndDelete({ _id: req.user.id });

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/export
// @desc    Export all user data
// @access  Private
router.get('/export', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Optional date range filter
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // include the whole end day
            dateFilter.$lte = toDate;
        }

        const journalQuery = { userId, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) };
        const habitQuery = { userId, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) };
        const chatQuery = { userId, ...(Object.keys(dateFilter).length ? { timestamp: dateFilter } : {}) };

        // Fetch all data in parallel
        const [user, journals, habits, conversationDocs, chatHistoryDocs] = await Promise.all([
            User.findById(userId).select('-password -verificationToken -resetPasswordToken').lean(),
            Journal.find(journalQuery).sort({ date: -1 }).lean(),
            Habit.find(habitQuery).lean(),
            Conversation.find({ userId }).lean(),
            ChatHistory.find(chatQuery).sort({ timestamp: 1 }).lean()
        ]);

        const exportData = {
            user,
            journals,
            habits,
            chat: {
                conversations: conversationDocs,
                history: chatHistoryDocs
            },
            exportDate: new Date().toISOString(),
            ...(from || to ? { dateFilter: { from: from || 'all', to: to || 'all' } } : {})
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=mindwave_export_${userId}.json`);
        res.json(exportData);

    } catch (err) {
        console.error("EXPORT ERROR:", err.message);
        res.status(500).send('Server Error during export');
    }
});

// @route   POST api/auth/upload-avatar
// @desc    Upload user avatar
// @access  Private
const upload = require('../middleware/upload.middleware');
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Construct URL
        const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
        const avatarUrl = `${baseUrl}/${req.file.path.replace(/\\/g, "/")}`;

        const user = await User.findById(req.user.id);
        user.avatar = avatarUrl;
        await user.save();

        res.json({ avatar: avatarUrl });
    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }
});

// @route   PUT api/auth/verify-email/:token
// @desc    Verify Email
// @access  Public

router.put('/verify-email/:token', validate(verifyEmailSchema), async (req, res) => {
    try {
        const verificationToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            verificationToken,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save();

        res.json({ success: true, msg: 'Email verified' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/forgot-password
// @desc    Forgot Password
// @access  Public

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User with that email does not exist' });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire (10 minutes)
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Create reset url
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        const plainMessage = `You requested a password reset. Visit this link to reset your password: ${resetUrl}\n\nThis link expires in 10 minutes.`;
        const htmlMessage = buildHtmlEmail(
            'Reset Your Password',
            `<p>Hi <strong>${user.name}</strong>,</p>
             <p>We received a request to reset the password for your MindWave account.</p>
             <p>Click the button below to choose a new password. This link will expire in <strong>10 minutes</strong>.</p>
             <p style="margin-top:24px;font-size:13px;color:#71717a;">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>`,
            'Reset My Password',
            resetUrl
        );

        try {
            await sendEmail({
                email: user.email,
                subject: 'Reset Your MindWave Password',
                message: plainMessage,
                html: htmlMessage
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            return res.status(500).json({ msg: 'Email could not be sent' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/reset-password/:resetToken
// @desc    Reset Password
// @access  Public

router.put('/reset-password/:resetToken', validate(resetPasswordSchema), async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid token' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, data: 'Password updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/resend-verification
// @desc    Resend email verification link
// @access  Public

router.post('/resend-verification', authLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if email exists
            return res.json({ success: true, msg: 'If this email exists and is unverified, a link has been sent.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ msg: 'This account is already verified. Please log in.' });
        }

        // Generate a fresh token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;

        const plainMessage = `Verify your MindWave account here: ${verifyUrl}`;
        const htmlMessage = buildHtmlEmail(
            'Verify Your Account',
            `<p>Hi <strong>${user.name}</strong>,</p>
             <p>Here's a fresh verification link for your <strong>MindWave</strong> account.</p>
             <p>This link expires in <strong>24 hours</strong>.</p>`,
            'Verify My Account',
            verifyUrl
        );

        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify Your MindWave Account',
                message: plainMessage,
                html: htmlMessage
            });
            res.json({ success: true, msg: 'Verification email resent successfully.' });
        } catch (err) {
            console.error('Error sending email:', err);
            return res.status(500).json({ msg: 'Email could not be sent. Please check server logs.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
