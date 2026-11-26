const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, getJwtSecret } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'citizen',
      organizationName = '',
      district = 'Phagwara',
      specializations = [],
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const allowedPublicRoles = ['citizen', 'university', 'industry'];
    if (!allowedPublicRoles.includes(role)) {
      return res.status(403).json({
        message: 'Public registration is limited to Citizen, University, and Industry accounts.',
      });
    }

    if (['university', 'industry'].includes(role) && !String(organizationName).trim()) {
      return res.status(400).json({
        message: 'Organization / Institution name is required for University and Industry accounts.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parsedSpecs = Array.isArray(specializations)
      ? specializations
      : String(specializations || '')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      organizationName: String(organizationName).trim(),
      district: String(district || 'Phagwara').trim(),
      specializations: parsedSpecs,
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  return res.json({ user: user ? user.toPublicJSON() : req.user });
});

// GET /api/auth/users?role=university
router.get('/users', verifyToken, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter)
      .select('name email role organizationName district specializations')
      .sort({ organizationName: 1, name: 1 });
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
