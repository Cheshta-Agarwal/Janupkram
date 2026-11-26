const express = require('express');
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const Proposal = require('../models/Proposal');
const Partnership = require('../models/Partnership');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { verifyToken, optionalAuth, allowRoles, requireVerified } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadMediaFile } = require('../config/cloudinary');
const { assertLegalTransition } = require('../utils/stateMachine');
const { recordAuditAndNotify } = require('../utils/auditAndNotify');
const { analyzeCivicSubmission } = require('../utils/aiTriage');

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

// GET /api/challenges/open-feed/public (Open Civic JSON API for external embeds & RWAs)
router.get('/open-feed/public', async (req, res, next) => {
  try {
    const filter = { status: { $ne: 'rejected' } };
    if (req.query.district && req.query.district !== 'ALL') {
      filter.district = req.query.district;
    }
    const items = await Challenge.find(filter)
      .select('title category severity district status location sourcePlatform escalations createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({
      portal: 'Janupkram Open Civic Feed',
      count: items.length,
      challenges: items,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/challenges/sla/overdue (SLA Escalation Watchlist & High-Priority Unresolved)
router.get('/sla/overdue', async (req, res, next) => {
  try {
    const thresholdDays = Number(req.query.days || 7);
    const escalated = await Challenge.find({
      status: { $nin: ['deployed', 'rejected'] },
      'escalations.0': { $exists: true },
    })
      .select('title district category severity status escalations createdAt location')
      .sort({ createdAt: 1 })
      .limit(30)
      .lean();

    const now = Date.now();
    const watchlist = escalated
      .map((c) => {
        const pendingEsc = (c.escalations || []).find(
          (e) => e.status === 'dispatched'
        );
        const targetEsc = pendingEsc || c.escalations[0];
        const ageHours = Math.max(
          0,
          Math.floor((now - new Date(targetEsc.createdAt || c.createdAt).getTime()) / 3600000)
        );
        const ageDays = Math.floor(ageHours / 24);
        return {
          _id: c._id,
          title: c.title,
          district: c.district,
          category: c.category,
          severity: c.severity,
          status: c.status,
          authorityName: targetEsc.authorityName,
          authorityHandle: targetEsc.authorityHandle,
          escalationStatus: targetEsc.status,
          ageHours,
          ageDays,
          isOverdue: targetEsc.status === 'dispatched' && ageDays >= thresholdDays,
          isCritical14d: targetEsc.status === 'dispatched' && ageDays >= 14,
        };
      })
      .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || b.ageHours - a.ageHours);

    return res.json({ thresholdDays, count: watchlist.length, watchlist });
  } catch (err) {
    return next(err);
  }
});

// POST /api/challenges/ai-triage (Gemini / Rule-based Civic Moderation & Translation Preview)
router.post('/ai-triage', verifyToken, upload.single('image'), async (req, res, next) => {
  try {
    const { title = '', description = '', category = 'other' } = req.body;
    const triage = await analyzeCivicSubmission({
      title,
      description,
      category,
      imageBuffer: req.file?.buffer || null,
      mimeType: req.file?.mimetype || '',
    });
    return res.json({ triage });
  } catch (err) {
    return next(err);
  }
});

// POST /api/challenges/webhooks/civic-bot (WhatsApp / Telegram Zero-Login Bot Webhook)
router.post('/webhooks/civic-bot', async (req, res, next) => {
  try {
    const configuredSecret = process.env.BOT_WEBHOOK_SECRET;
    if (configuredSecret && req.headers['x-bot-secret'] !== configuredSecret) {
      return res.status(401).json({ message: 'Invalid bot webhook secret.' });
    }

    const {
      platform = 'WhatsApp',
      senderPhone = '+91-98XXXXXX10',
      senderName = 'Bot Citizen Reporter',
      text = '',
      title = '',
      category = 'sanitation',
      district = 'Phagwara',
      lat = 31.2554,
      lng = 75.7058,
      mediaUrl = '',
    } = req.body;

    if (!text && !title) {
      return res.status(400).json({ message: 'Report text or title is required.' });
    }

    const citizenUser =
      (await User.findOne({ role: 'citizen' }).sort({ createdAt: 1 })) ||
      (await User.findOne().sort({ createdAt: 1 }));
    if (!citizenUser) {
      return res.status(400).json({ message: 'No reporter account found in database.' });
    }

    const resolvedTitle = (title || text.slice(0, 75)).trim();
    const resolvedDesc = `${text.trim() || resolvedTitle}\n\n[Ingested via ${platform} Civic Bot • Reporter: ${senderName} (${senderPhone})]`;
    const triage = await analyzeCivicSubmission({
      title: resolvedTitle,
      description: resolvedDesc,
      category,
    });

    const challenge = await Challenge.create({
      title: resolvedTitle,
      description: resolvedDesc,
      category: triage.suggestedCategory || category,
      severity: 'high',
      district,
      sourcePlatform: `${platform} Civic Bot`,
      externalTicketId: `${platform.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      location: { type: 'Point', coordinates: [Number(lng) || 75.7058, Number(lat) || 31.2554] },
      media: mediaUrl ? [String(mediaUrl).trim()] : [],
      aiTriage: triage,
      submittedBy: citizenUser._id,
      status: 'submitted',
    });

    const admins = await User.find({ role: 'admin' }).select('_id');
    await recordAuditAndNotify({
      challengeId: challenge._id,
      actor: citizenUser,
      action: 'bot_webhook_submitted',
      fromStatus: '',
      toStatus: 'submitted',
      remarks: `Auto-created from ${platform} Bot (${senderName}).`,
      notifications: admins.map((a) => ({
        recipientId: a._id,
        title: `New ${platform} Bot Report`,
        message: `"${resolvedTitle}" (${district}) arrived via ${platform} Bot.`,
      })),
    });

    return res.status(201).json({
      challenge,
      trackingPath: `/challenges/${challenge._id}`,
      botReply: `Namaste ${senderName}! Your issue is logged on Janupkram (Ref: ${challenge.externalTicketId}). Track live at /challenges/${challenge._id}`,
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
      .populate('submittedBy', 'name email organizationName district role verificationStatus civicKarma')
      .populate(
        'assignedUniversity',
        'name email organizationName district specializations verificationStatus aisheOrNaacCode'
      )
      .populate('duplicateOf', 'title status')
      .lean();

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found.' });
    }

    const [proposals, partnerships, activityLogs] = await Promise.all([
      Proposal.find({ challengeId: challenge._id })
        .populate('universityId', 'name email organizationName district specializations verificationStatus')
        .sort({ createdAt: -1 })
        .lean(),
      Partnership.find({ challengeId: challenge._id })
        .populate('industryId', 'name email organizationName district verificationStatus')
        .sort({ createdAt: -1 })
        .lean(),
      ActivityLog.find({ challengeId: challenge._id }).sort({ createdAt: -1 }).lean(),
    ]);

    // Determine if current user can see private war-room messages
    const uid = req.user ? String(req.user.id) : null;
    const isWarRoomMember =
      req.user &&
      (req.user.role === 'admin' ||
        (challenge.assignedUniversity && String(challenge.assignedUniversity._id) === uid) ||
        partnerships.some(
          (p) =>
            ['accepted', 'completed'].includes(p.status) &&
            String(p.industryId?._id || p.industryId) === uid
        ));

    const visibleComments = (challenge.comments || []).filter(
      (c) => !c.isPrivateWarRoom || isWarRoomMember
    );

    return res.json({
      challenge: {
        ...challenge,
        comments: visibleComments,
        canAccessWarRoom: Boolean(isWarRoomMember),
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
        sourcePlatform = 'Direct Report',
        sourceUrl = '',
        externalTicketId = '',
        capturedViaLiveCamera = 'false',
        capturedAt = '',
        gpsVerified = 'false',
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

      const firstImage = Array.isArray(req.files)
        ? req.files.find((f) => f.mimetype?.startsWith('image/'))
        : null;
      const aiTriage = await analyzeCivicSubmission({
        title,
        description,
        category,
        imageBuffer: firstImage?.buffer || null,
        mimeType: firstImage?.mimetype || '',
      });

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
        sourcePlatform: String(sourcePlatform || 'Direct Report').trim(),
        sourceUrl: String(sourceUrl || '').trim(),
        externalTicketId: String(externalTicketId || '').trim(),
        captureMetadata: {
          capturedViaLiveCamera: capturedViaLiveCamera === true || capturedViaLiveCamera === 'true',
          capturedAt: capturedAt ? new Date(capturedAt) : undefined,
          gpsVerified: gpsVerified === true || gpsVerified === 'true',
        },
        aiTriage,
        isOfflineSynced: req.body.isOfflineSynced === true || req.body.isOfflineSynced === 'true',
        location: { type: 'Point', coordinates: coords },
        media: mediaUrls,
        submittedBy: req.user.id,
        status: 'submitted',
      });

      await User.findByIdAndUpdate(req.user.id, { $inc: { civicKarma: 10 } });

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

// POST /api/challenges/:id/escalate (Verified users only — Log direct escalation)
router.post(
  '/:id/escalate',
  verifyToken,
  allowRoles('admin', 'citizen', 'university'),
  requireVerified,
  async (req, res, next) => {
    try {
      const {
        authorityName,
        authorityHandle = '',
        department = '',
        channel = 'cpgrams',
        message,
        portalUrl = '',
      } = req.body;

      if (!authorityName || !message) {
        return res
          .status(400)
          .json({ message: 'authorityName and escalation message are required.' });
      }

      const challenge = await Challenge.findById(req.params.id);
      if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

      const escalation = {
        authorityName: String(authorityName).trim(),
        authorityHandle: String(authorityHandle).trim(),
        department: String(department).trim(),
        channel,
        message: String(message).trim(),
        portalUrl: String(portalUrl).trim(),
        escalatedBy: req.user.id,
        escalatedByName: req.user.name,
        status: 'dispatched',
      };

      challenge.escalations.unshift(escalation);
      await challenge.save();

      const admins = await User.find({ role: 'admin' }).select('_id');
      await recordAuditAndNotify({
        challengeId: challenge._id,
        actor: req.user,
        action: 'escalated_to_authority',
        fromStatus: challenge.status,
        toStatus: challenge.status,
        remarks: `Dispatched to ${escalation.authorityName} (${channel.toUpperCase()})${
          escalation.authorityHandle ? ` ${escalation.authorityHandle}` : ''
        }.`,
        notifications: [
          {
            recipientId: challenge.submittedBy,
            title: 'Issue Escalated to Concerned Authority',
            message: `"${challenge.title}" was escalated to ${escalation.authorityName} via ${channel.toUpperCase()}.`,
          },
          ...admins.map((a) => ({
            recipientId: a._id,
            title: 'Authority Escalation Logged',
            message: `${req.user.name} escalated "${challenge.title}" to ${escalation.authorityName}.`,
          })),
        ],
      });

      return res.status(201).json({
        escalation: challenge.escalations[0],
        escalations: challenge.escalations,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/challenges/:id/escalations/:escId (Admin marks authority acknowledgement/resolution)
router.patch(
  '/:id/escalations/:escId',
  verifyToken,
  allowRoles('admin'),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!['dispatched', 'acknowledged', 'resolved_by_authority'].includes(status)) {
        return res.status(400).json({ message: 'Invalid escalation status.' });
      }

      const challenge = await Challenge.findById(req.params.id);
      if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

      const esc = challenge.escalations.id(req.params.escId);
      if (!esc) return res.status(404).json({ message: 'Escalation entry not found.' });

      esc.status = status;
      await challenge.save();

      await recordAuditAndNotify({
        challengeId: challenge._id,
        actor: req.user,
        action: 'authority_escalation_updated',
        fromStatus: challenge.status,
        toStatus: challenge.status,
        remarks: `Authority escalation (${esc.authorityName}) marked as ${status.replace(/_/g, ' ')}.`,
        notifications: [
          {
            recipientId: challenge.submittedBy,
            title: 'Authority Response Updated',
            message: `${esc.authorityName} status for "${challenge.title}": ${status.replace(/_/g, ' ')}.`,
          },
        ],
      });

      return res.json({ escalation: esc, escalations: challenge.escalations });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/challenges/:id/comments (Public Q&A or Private Team War-Room)
router.post('/:id/comments', verifyToken, async (req, res, next) => {
  try {
    const { text, attachmentUrl = '', isPrivateWarRoom = false } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    if (isPrivateWarRoom) {
      const uid = String(req.user.id);
      const hasAcceptedPart = await Partnership.exists({
        challengeId: challenge._id,
        industryId: req.user.id,
        status: { $in: ['accepted', 'completed'] },
      });
      const allowed =
        req.user.role === 'admin' ||
        (challenge.assignedUniversity && String(challenge.assignedUniversity) === uid) ||
        Boolean(hasAcceptedPart);
      if (!allowed) {
        return res.status(403).json({
          message: 'Private War-Room is restricted to the assigned University, Nodal Admin, and accepted CSR Partner.',
        });
      }
    }

    const comment = {
      authorId: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      text: String(text).trim(),
      attachmentUrl: String(attachmentUrl).trim(),
      isPrivateWarRoom: Boolean(isPrivateWarRoom),
    };

    challenge.comments.push(comment);
    await challenge.save();

    const recipients = [
      {
        recipientId: challenge.submittedBy,
        title: isPrivateWarRoom ? 'Team War-Room Update' : `New Discussion on "${challenge.title.slice(0, 35)}"`,
        message: `${req.user.name}: ${comment.text.slice(0, 90)}`,
      },
    ];
    if (challenge.assignedUniversity) {
      recipients.push({
        recipientId: challenge.assignedUniversity,
        title: isPrivateWarRoom ? 'New War-Room Note' : 'Citizen/Partner Comment on Challenge',
        message: `${req.user.name}: ${comment.text.slice(0, 90)}`,
      });
    }

    await recordAuditAndNotify({
      challengeId: challenge._id,
      actor: req.user,
      action: isPrivateWarRoom ? 'warroom_note_added' : 'comment_posted',
      fromStatus: challenge.status,
      toStatus: challenge.status,
      remarks: `${req.user.name} posted in ${isPrivateWarRoom ? 'Private War-Room' : 'Public Q&A'}.`,
      notifications: isPrivateWarRoom
        ? recipients.filter((r) => String(r.recipientId) !== String(challenge.submittedBy))
        : recipients,
    });

    return res.status(201).json({
      comment: challenge.comments[challenge.comments.length - 1],
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/challenges/:id/resolution-proof (Before & After Proof of Resolution)
router.post(
  '/:id/resolution-proof',
  verifyToken,
  allowRoles('university', 'admin', 'citizen'),
  upload.array('afterMedia', 4),
  async (req, res, next) => {
    try {
      const { notes = '', capturedLat, capturedLng } = req.body;
      const challenge = await Challenge.findById(req.params.id);
      if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

      const afterUrls = [];
      if (Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
          const uploaded = await uploadMediaFile(file, req);
          if (uploaded?.url) afterUrls.push(uploaded.url);
        }
      }

      if (afterUrls.length === 0 && !String(notes).trim()) {
        return res.status(400).json({
          message: 'Please attach at least one "After" photo or resolution summary notes.',
        });
      }

      let distanceFromSiteMeters = null;
      const latNum = Number(capturedLat);
      const lngNum = Number(capturedLng);
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum) && capturedLat !== undefined && capturedLng !== undefined) {
        distanceFromSiteMeters = haversineMeters(
          challenge.location.coordinates,
          [lngNum, latNum]
        );
      }

      challenge.resolutionProof = {
        afterMedia: afterUrls,
        notes: String(notes).trim(),
        capturedLat: !Number.isNaN(latNum) ? latNum : undefined,
        capturedLng: !Number.isNaN(lngNum) ? lngNum : undefined,
        distanceFromSiteMeters: distanceFromSiteMeters ?? undefined,
        within50Meters: distanceFromSiteMeters !== null ? distanceFromSiteMeters <= 50 : undefined,
        submittedBy: req.user.id,
        submittedByName: req.user.name,
        submittedAt: new Date(),
      };
      await challenge.save();

      // Notify original reporter + upvoters to cast Community Verification Vote
      const voterTargets = new Set([String(challenge.submittedBy), ...(challenge.upvotes || []).map(String)]);
      const notifications = Array.from(voterTargets).map((recipientId) => ({
        recipientId,
        title: 'Resolution Proof Uploaded — Vote Now!',
        message: `${req.user.name} uploaded "After" resolution proof for "${challenge.title}". Confirm whether it is resolved!`,
      }));

      await recordAuditAndNotify({
        challengeId: challenge._id,
        actor: req.user,
        action: 'resolution_proof_uploaded',
        fromStatus: challenge.status,
        toStatus: challenge.status,
        remarks: `Uploaded ${afterUrls.length} "After" proof photo(s)${
          distanceFromSiteMeters !== null ? ` (${distanceFromSiteMeters}m from site)` : ''
        }.`,
        notifications,
      });

      return res.json({ resolutionProof: challenge.resolutionProof });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/challenges/:id/resolution-vote (Community Verification Poll)
router.post('/:id/resolution-vote', verifyToken, async (req, res, next) => {
  try {
    const { vote } = req.body;
    if (!['resolved', 'unresolved'].includes(vote)) {
      return res.status(400).json({ message: "Vote must be 'resolved' or 'unresolved'." });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    const uid = String(req.user.id);
    const existingIdx = (challenge.resolutionVotes || []).findIndex(
      (v) => String(v.userId) === uid
    );
    if (existingIdx >= 0) {
      challenge.resolutionVotes[existingIdx].vote = vote;
      challenge.resolutionVotes[existingIdx].votedAt = new Date();
    } else {
      challenge.resolutionVotes.push({ userId: req.user.id, vote });
      await User.findByIdAndUpdate(req.user.id, { $inc: { civicKarma: 5 } });
    }
    await challenge.save();

    return res.json({ resolutionVotes: challenge.resolutionVotes });
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
