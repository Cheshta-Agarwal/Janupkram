const express = require('express');
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const Proposal = require('../models/Proposal');
const Partnership = require('../models/Partnership');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { verifyToken, optionalAuth, allowRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadMediaFile } = require('../config/cloudinary');
const { assertLegalTransition } = require('../utils/stateMachine');
const { recordAuditAndNotify } = require('../utils/auditAndNotify');

const router = express.Router();

const haversineMeters = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// GET /api/challenges
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      status,
      category,
      district,
      severity,
      search,
      mine,
      assignedToMe,
      openForIndustry,
      limit = 50,
      page = 1,
    } = req.query;

    const filter = {};
    if (status && status !== 'ALL') {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        filter.status = status;
      }
    }
    if (category && category !== 'ALL') filter.category = category;
    if (district && district !== 'ALL') filter.district = district;
    if (severity && severity !== 'ALL') filter.severity = severity;

    if (mine === 'true' && req.user) {
      filter.submittedBy = req.user.id;
    }
    if (assignedToMe === 'true' && req.user) {
      filter.assignedUniversity = req.user.id;
    }
    if (openForIndustry === 'true') {
      filter.status = {
        $in: ['validated', 'routed', 'team_formed', 'in_progress', 'piloted'],
      };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { district: regex },
        { category: regex },
      ];
    }

    const numericLimit = Math.min(Number(limit) || 50, 100);
    const numericPage = Math.max(Number(page) || 1, 1);

    const [challenges, total] = await Promise.all([
      Challenge.find(filter)
        .populate('submittedBy', 'name email organizationName district role')
        .populate('assignedUniversity', 'name email organizationName district specializations')
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Challenge.countDocuments(filter),
    ]);

    const challengeIds = challenges.map((c) => c._id);
    const [proposals, partnerships] = await Promise.all([
      Proposal.find({ challengeId: { $in: challengeIds } })
        .populate('universityId', 'name organizationName district')
        .lean(),
      Partnership.find({ challengeId: { $in: challengeIds }, status: { $ne: 'declined' } })
        .populate('industryId', 'name organizationName')
        .lean(),
    ]);

    const propByChallenge = new Map();
    for (const p of proposals) {
      const key = String(p.challengeId);
      if (!propByChallenge.has(key)) propByChallenge.set(key, []);
      propByChallenge.get(key).push(p);
    }

    const partByChallenge = new Map();
    for (const part of partnerships) {
      const key = String(part.challengeId);
      if (!partByChallenge.has(key)) partByChallenge.set(key, []);
      partByChallenge.get(key).push(part);
    }

    const enriched = challenges.map((c) => {
      const cProps = propByChallenge.get(String(c._id)) || [];
      const cParts = partByChallenge.get(String(c._id)) || [];
      return {
        ...c,
        proposals: cProps,
        partnerships: cParts,
        proposalsCount: cProps.length,
        partnershipsCount: cParts.length,
        upvotesCount: Array.isArray(c.upvotes) ? c.upvotes.length : 0,
      };
    });

    return res.json({
      challenges: enriched,
      pagination: {
        total,
        page: numericPage,
        limit: numericLimit,
        pages: Math.ceil(total / numericLimit),
      },
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/challenges/spatial/nearby?lat=23.3569&lng=85.3112&radiusMeters=2000
router.get('/spatial/nearby', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusMeters = Math.min(Number(req.query.radiusMeters) || 2000, 50000);
    const { excludeId } = req.query;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'Valid lat and lng query parameters are required.' });
    }

    const query = {
      status: { $ne: 'rejected' },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      },
    };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: excludeId };
    }

    const docs = await Challenge.find(query)
      .populate('submittedBy', 'name organizationName')
      .limit(20)
      .lean();

    const nearby = docs.map((d) => ({
      ...d,
      distanceMeters: haversineMeters([lng, lat], d.location.coordinates),
    }));

    return res.json({ count: nearby.length, radiusMeters, nearby });
  } catch (err) {
    return next(err);
  }
});

// GET /api/challenges/:id/duplicates (Admin 2km Spatial Duplicate Detector using $near $maxDistance: 2000)
router.get('/:id/duplicates', verifyToken, allowRoles('admin'), async (req, res, next) => {
  try {
    const target = await Challenge.findById(req.params.id).lean();
    if (!target) {
      return res.status(404).json({ message: 'Challenge not found.' });
    }

    const radiusMeters = Math.min(Number(req.query.radiusMeters) || 2000, 20000);
    const [lng, lat] = target.location.coordinates;

    const matches = await Challenge.find({
      _id: { $ne: target._id },
      status: { $ne: 'rejected' },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      },
    })
      .populate('submittedBy', 'name organizationName district')
      .limit(20)
      .lean();

    const duplicates = matches.map((m) => ({
      ...m,
      distanceMeters: haversineMeters([lng, lat], m.location.coordinates),
    }));

    return res.json({
      targetId: target._id,
      radiusMeters,
      count: duplicates.length,
      duplicates,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/challenges/:id (360-degree view)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('submittedBy', 'name email organizationName district role')
      .populate('assignedUniversity', 'name email organizationName district specializations')
      .populate('duplicateOf', 'title status')
      .lean();

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found.' });
    }

    const [proposals, partnerships, activityLogs] = await Promise.all([
      Proposal.find({ challengeId: challenge._id })
        .populate('universityId', 'name email organizationName district specializations')
        .sort({ createdAt: -1 })
        .lean(),
      Partnership.find({ challengeId: challenge._id })
        .populate('industryId', 'name email organizationName district')
        .sort({ createdAt: -1 })
        .lean(),
      ActivityLog.find({ challengeId: challenge._id }).sort({ createdAt: -1 }).lean(),
    ]);

    return res.json({
      challenge: {
        ...challenge,
        upvotesCount: Array.isArray(challenge.upvotes) ? challenge.upvotes.length : 0,
      },
      proposals,
      partnerships,
      activityLogs,
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/challenges (citizen only)
router.post(
  '/',
  verifyToken,
  allowRoles('citizen'),
  upload.array('media', 5),
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        category,
        severity = 'medium',
        district = 'Phagwara',
        latitude,
        longitude,
      } = req.body;

      let coords = null;
      if (latitude !== undefined && longitude !== undefined) {
        coords = [Number(longitude), Number(latitude)];
      } else if (req.body.location && Array.isArray(req.body.location.coordinates)) {
        coords = req.body.location.coordinates.map(Number);
      } else if (typeof req.body.location === 'string') {
        try {
          const parsed = JSON.parse(req.body.location);
          if (Array.isArray(parsed.coordinates)) {
            coords = parsed.coordinates.map(Number);
          }
        } catch {
          // ignore
        }
      }

      if (!coords || coords.length !== 2 || Number.isNaN(coords[0]) || Number.isNaN(coords[1])) {
        return res.status(400).json({
          message: 'Valid GeoJSON [lng, lat] or latitude/longitude coordinates are required.',
        });
      }

      const mediaUrls = [];
      if (Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
          const uploaded = await uploadMediaFile(file, req);
          if (uploaded?.url) mediaUrls.push(uploaded.url);
        }
      }

      const challenge = await Challenge.create({
        title,
        description,
        category,
        severity,
        district,
        location: { type: 'Point', coordinates: coords },
        media: mediaUrls,
        submittedBy: req.user.id,
        status: 'submitted',
      });

      const admins = await User.find({ role: 'admin' }).select('_id');
      await recordAuditAndNotify({
        challengeId: challenge._id,
        actor: req.user,
        action: 'submitted',
        fromStatus: '',
        toStatus: 'submitted',
        remarks: `Submitted by ${req.user.name} in ${district} (${category}).`,
        notifications: admins.map((a) => ({
          recipientId: a._id,
          title: 'New Civic Challenge Submitted',
          message: `${title} (${district} • ${category}) awaits 2km duplicate screening.`,
        })),
      });

      const populated = await Challenge.findById(challenge._id).populate(
        'submittedBy',
        'name email organizationName district role'
      );

      return res.status(201).json({ challenge: populated });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/challenges/:id/review (admin only)
router.patch('/:id/review', verifyToken, allowRoles('admin'), async (req, res, next) => {
  try {
    const { status, rejectionReason = '', duplicateOf = null } = req.body;
    if (!['under_review', 'validated', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Review status must be 'under_review', 'validated', or 'rejected'.",
      });
    }

    if (status === 'rejected' && !String(rejectionReason).trim()) {
      return res.status(400).json({
        message: 'A rejectionReason is mandatory when rejecting a challenge.',
      });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found.' });
    }

    const fromStatus = challenge.status;
    assertLegalTransition(fromStatus, status);

    challenge.status = status;
    if (status === 'rejected') {
      challenge.rejectionReason = String(rejectionReason).trim();
      if (duplicateOf && mongoose.Types.ObjectId.isValid(duplicateOf)) {
        challenge.duplicateOf = duplicateOf;
      }
    }
    await challenge.save();

    await recordAuditAndNotify({
      challengeId: challenge._id,
      actor: req.user,
      action: status === 'validated' ? 'challenge_validated' : status === 'rejected' ? 'challenge_rejected' : 'under_review',
      fromStatus,
      toStatus: status,
      remarks:
        status === 'rejected'
          ? `Rejected: ${challenge.rejectionReason}`
          : `Moderation status set to ${status}.`,
      notifications: [
        {
          recipientId: challenge.submittedBy,
          title: `Challenge ${status === 'validated' ? 'Validated' : status === 'rejected' ? 'Rejected' : 'Under Review'}`,
          message:
            status === 'rejected'
              ? `"${challenge.title}" was rejected: ${challenge.rejectionReason}`
              : `"${challenge.title}" has been ${status.replace(/_/g, ' ')}.`,
        },
      ],
    });

    const updated = await Challenge.findById(challenge._id)
      .populate('submittedBy', 'name email organizationName district role')
      .populate('assignedUniversity', 'name email organizationName district specializations');

    return res.json({ challenge: updated });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/challenges/:id/route (admin only)
router.patch('/:id/route', verifyToken, allowRoles('admin'), async (req, res, next) => {
  try {
    const { universityId, remarks = '' } = req.body;
    if (!universityId) {
      return res.status(400).json({ message: 'universityId is required.' });
    }

    const [challenge, university] = await Promise.all([
      Challenge.findById(req.params.id),
      User.findOne({ _id: universityId, role: 'university' }),
    ]);

    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });
    if (!university) return res.status(404).json({ message: 'University not found.' });

    const fromStatus = challenge.status;
    if (fromStatus !== 'routed') {
      assertLegalTransition(fromStatus, 'routed');
    }

    challenge.assignedUniversity = university._id;
    challenge.status = 'routed';
    await challenge.save();

    await recordAuditAndNotify({
      challengeId: challenge._id,
      actor: req.user,
      action: 'routed_to_university',
      fromStatus,
      toStatus: 'routed',
      remarks:
        remarks ||
        `Routed to ${university.organizationName || university.name} for R&D execution.`,
      notifications: [
        {
          recipientId: university._id,
          title: 'New Challenge Routed to Your University',
          message: `"${challenge.title}" (${challenge.district} • ${challenge.category}) has been assigned to ${
            university.organizationName || university.name
          }.`,
        },
        {
          recipientId: challenge.submittedBy,
          title: 'Challenge Routed to University R&D',
          message: `Your challenge "${challenge.title}" was routed to ${
            university.organizationName || university.name
          }.`,
        },
      ],
    });

    const updated = await Challenge.findById(challenge._id)
      .populate('submittedBy', 'name email organizationName district role')
      .populate('assignedUniversity', 'name email organizationName district specializations');

    return res.json({ challenge: updated });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/challenges/:id/status (university or admin)
router.patch('/:id/status', verifyToken, allowRoles('admin', 'university'), async (req, res, next) => {
  try {
    const { status, remarks = '' } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    if (
      req.user.role === 'university' &&
      challenge.assignedUniversity &&
      String(challenge.assignedUniversity) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: 'This challenge is assigned to another university.' });
    }

    const fromStatus = challenge.status;
    assertLegalTransition(fromStatus, status);
    challenge.status = status;
    await challenge.save();

    const admins = await User.find({ role: 'admin' }).select('_id');
    await recordAuditAndNotify({
      challengeId: challenge._id,
      actor: req.user,
      action: `status_${status}`,
      fromStatus,
      toStatus: status,
      remarks: remarks || `Challenge transitioned from ${fromStatus} to ${status}.`,
      notifications: [
        {
          recipientId: challenge.submittedBy,
          title: `Challenge Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
          message: `"${challenge.title}" moved to ${status.replace(/_/g, ' ')}.`,
        },
        ...admins.map((a) => ({
          recipientId: a._id,
          title: `Challenge Advanced to ${status}`,
          message: `"${challenge.title}" updated by ${req.user.organizationName || req.user.name}.`,
        })),
      ],
    });

    const updated = await Challenge.findById(challenge._id)
      .populate('submittedBy', 'name email organizationName district role')
      .populate('assignedUniversity', 'name email organizationName district specializations');

    return res.json({ challenge: updated });
  } catch (err) {
    return next(err);
  }
});

// POST /api/challenges/:id/upvote
router.post('/:id/upvote', verifyToken, async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    const uid = String(req.user.id);
    const idx = challenge.upvotes.findIndex((id) => String(id) === uid);
    let upvoted = false;
    if (idx >= 0) {
      challenge.upvotes.splice(idx, 1);
    } else {
      challenge.upvotes.push(req.user.id);
      upvoted = true;
    }
    await challenge.save();

    return res.json({
      upvoted,
      upvotesCount: challenge.upvotes.length,
      upvotes: challenge.upvotes,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
