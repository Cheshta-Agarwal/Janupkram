const express = require('express');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Proposal = require('../models/Proposal');
const Partnership = require('../models/Partnership');
const Notification = require('../models/Notification');
const { verifyToken, optionalAuth, allowRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadMediaFile } = require('../config/cloudinary');

const router = express.Router();

// GET /api/profile/verification/queue (Admin KYC Audit Queue)
router.get('/verification/queue', verifyToken, allowRoles('admin'), async (req, res, next) => {
  try {
    const status = req.query.status || 'pending_review';
    const filter = status === 'ALL' ? {} : { verificationStatus: status };
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ updatedAt: -1 });
    return res.json({ users: users.map((u) => u.toPublicJSON()) });
  } catch (err) {
    return next(err);
  }
});

// GET /api/profile/leaderboard/karma (Civic Karma & Top Contributors)
router.get('/leaderboard/karma', async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name role organizationName district verificationStatus civicKarma endorsements')
      .sort({ civicKarma: -1 })
      .limit(20)
      .lean();

    const leaders = users.map((u) => ({
      ...u,
      endorsementsCount: Array.isArray(u.endorsements) ? u.endorsements.length : 0,
    }));
    return res.json({ leaders });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/profile/me (Update own role-specific profile fields)
router.patch('/me', verifyToken, async (req, res, next) => {
  try {
    const allowed = [
      'name',
      'organizationName',
      'district',
      'specializations',
      'bio',
      'portfolioUrl',
      'githubUrl',
      'wardOrConstituency',
      'aisheOrNaacCode',
      'labCapabilities',
      'cinOrGstin',
      'csrFocusAreas',
      'mentorshipSlots',
      'designation',
      'jurisdiction',
    ];

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (['specializations', 'labCapabilities', 'csrFocusAreas'].includes(key)) {
          user[key] = Array.isArray(req.body[key])
            ? req.body[key]
            : String(req.body[key] || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else {
          user[key] = req.body[key];
        }
      }
    }

    await user.save();
    return res.json({ user: user.toPublicJSON() });
  } catch (err) {
    return next(err);
  }
});

// POST /api/profile/verification (Submit KYC document for review)
router.post(
  '/verification',
  verifyToken,
  upload.single('document'),
  async (req, res, next) => {
    try {
      const { docType = 'gov_id', docNumber = '' } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a verification document (image or PDF).' });
      }

      const uploaded = await uploadMediaFile(req.file, req, { restricted: true });
      user.verificationDocuments.push({
        docType,
        docNumber: String(docNumber).trim(),
        fileUrl: uploaded.url,
      });
      user.verificationStatus = 'pending_review';
      user.verificationFeedback = '';
      await user.save();

      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((a) => ({
            recipientId: a._id,
            title: `KYC Verification Submitted: ${user.name}`,
            message: `${user.name} (${user.role}) uploaded ${docType.replace(/_/g, ' ').toUpperCase()} for verification review.`,
          }))
        );
      }

      return res.json({ user: user.toPublicJSON() });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/profile/:id/verify (Admin approves or rejects KYC)
router.patch('/:id/verify', verifyToken, allowRoles('admin'), async (req, res, next) => {
  try {
    const { status, feedback = '' } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'verified' or 'rejected'." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const wasVerified = user.verificationStatus === 'verified';
    user.verificationStatus = status;
    user.verificationFeedback = String(feedback).trim();
    if (status === 'verified' && !wasVerified) {
      user.civicKarma = (user.civicKarma || 0) + 50;
    }
    await user.save();

    await Notification.create({
      recipientId: user._id,
      title:
        status === 'verified'
          ? 'Account KYC Verified!'
          : 'KYC Verification Needs Attention',
      message:
        status === 'verified'
          ? 'Your profile has earned the Verified Shield Badge (+50 Civic Karma). All privileged actions are now unlocked.'
          : `Verification rejected: ${user.verificationFeedback || 'Please upload a clearer document.'}`,
    });

    return res.json({ user: user.toPublicJSON() });
  } catch (err) {
    return next(err);
  }
});

// POST /api/profile/:id/endorse (Toggle community endorsement)
router.post('/:id/endorse', verifyToken, async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot endorse your own profile.' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const uid = String(req.user.id);
    const idx = target.endorsements.findIndex((id) => String(id) === uid);
    let endorsed = false;
    if (idx >= 0) {
      target.endorsements.splice(idx, 1);
      target.civicKarma = Math.max(0, (target.civicKarma || 0) - 5);
    } else {
      target.endorsements.push(req.user.id);
      target.civicKarma = (target.civicKarma || 0) + 5;
      endorsed = true;
    }
    await target.save();

    return res.json({
      endorsed,
      endorsementsCount: target.endorsements.length,
      civicKarma: target.civicKarma,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/profile/:id (Rich public stakeholder profile)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Profile not found.' });

    const [submittedChallenges, assignedChallenges, proposals, partnerships] = await Promise.all([
      Challenge.find({ submittedBy: user._id })
        .select('title category severity district status upvotes createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Challenge.find({ assignedUniversity: user._id })
        .select('title category severity district status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Proposal.find({ universityId: user._id })
        .populate('challengeId', 'title district status')
        .sort({ createdAt: -1 })
        .lean(),
      Partnership.find({ industryId: user._id })
        .populate('challengeId', 'title district status')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const resolvedCount = submittedChallenges.filter((c) => c.status === 'deployed').length;
    const grantsDisbursed = partnerships
      .filter((p) => ['accepted', 'completed'].includes(p.status))
      .reduce((s, p) => s + (Number(p.fundingAmount) || 0), 0);

    return res.json({
      profile: user.toPublicJSON(),
      stats: {
        issuesReported: submittedChallenges.length,
        issuesResolved: resolvedCount,
        assignedCount: assignedChallenges.length,
        proposalsCount: proposals.length,
        partnershipsCount: partnerships.length,
        grantsDisbursed,
      },
      submittedChallenges,
      assignedChallenges,
      proposals,
      partnerships,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
