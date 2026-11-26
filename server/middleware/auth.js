const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () =>
  process.env.JWT_SECRET || 'janupkram_lpu_local_dev_secret_2026';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token missing.' });
    }

    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    req.user = {
      id: String(user._id),
      _id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      organizationName: user.organizationName,
      district: user.district,
      specializations: user.specializations,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = {
          id: String(user._id),
          _id: user._id,
          role: user.role,
          name: user.name,
          email: user.email,
          organizationName: user.organizationName,
          district: user.district,
          specializations: user.specializations,
        };
      }
    }
  } catch (err) {
    // Ignore invalid optional tokens
  }
  return next();
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    return next();
  };
};

module.exports = {
  verifyToken,
  optionalAuth,
  allowRoles,
  getJwtSecret,
};
