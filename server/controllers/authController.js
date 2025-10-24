// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, role });
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password: candidate } = req.body;
    if (!email || !candidate) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await user.comparePassword(candidate);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);
    // Optional cookie
    if (process.env.AUTH_COOKIE === 'true') {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user is set by verifyJWT middleware
    const me = await User.findById(req.user?.id || req.user?._id)
      .select('-password -__v')
      .lean();
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: me });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (_req, res) => {
  try {
    if (process.env.AUTH_COOKIE === 'true') {
      res.clearCookie('token');
    }
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
