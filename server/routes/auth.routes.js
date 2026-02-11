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

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can change this to your preferred provider
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(message);
};

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
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

        // Generate verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;

        const message = `
            Please click the following link to verify your account: \n\n ${verifyUrl}
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Account Verification',
                message
            });

            res.json({ success: true, msg: 'Verification email sent' });
        } catch (err) {
            console.error(err);
            user.verificationToken = undefined;
            user.verificationTokenExpire = undefined;
            await user.save();
            return res.status(500).json({ msg: 'Email could not be sent' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
// @access  Public
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // if (!user.isVerified) {
        //     return res.status(400).json({ msg: 'Please verify your email address' });
        // }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
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

// @route   POST api/auth/upload-avatar
// @desc    Upload user avatar
// @access  Private
const upload = require('../middleware/upload.middleware');
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Construct URL (assuming server is on same domain/port for now or relative path)
        // In production, you might want a full URL or handle this on the client
        const avatarUrl = `http://localhost:${process.env.PORT || 5000}/${req.file.path.replace(/\\/g, "/")}`;

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
        // Assuming client is on port 5173
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `
            You are receiving this email because you (or someone else) has requested the reset of a password.
            Please make a PUT request to: \n\n ${resetUrl}
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message
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

module.exports = router;
