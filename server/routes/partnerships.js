const express = require('express');
const Partnership = require('../models/Partnership');
const Challenge = require('../models/Challenge');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { recordAuditAndNotify } = require('../utils/auditAndNotify');

const router = express.Router();

// GET /api/partnerships
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { challengeId, status, mine, forMyUniversity } = req.query;
    const filter = {};
    if (challengeId) filter.challengeId = challengeId;
    if (status && status !== 'ALL') filter.status = status;
    if (mine === 'true') filter.industryId = req.user.id;

    if (forMyUniversity === 'true') {
      const myChallenges = await Challenge.find({ assignedUniversity: req.user.id }).select('_id');
      filter.challengeId = { $in: myChallenges.map((c) => c._id) };
    }

    const partnerships = await Partnership.find(filter)
      .populate('challengeId', 'title district category severity status assignedUniversity')
      .populate('proposalId', 'teamName facultyMentor estimatedBudget')
      .populate('industryId', 'name email organizationName district')
      .sort({ createdAt: -1 });

    return res.json({ partnerships });
  } catch (err) {
    return next(err);
  }
});

// POST /api/partnerships (industry only)
router.post('/', verifyToken, allowRoles('industry'), async (req, res, next) => {
  try {
    const {
      challengeId,
      proposalId = null,
      collaborationType,
      title,
      commitmentDetails,
      fundingAmount = 0,
    } = req.body;

    if (!challengeId || !collaborationType || !title || !commitmentDetails) {
      return res.status(400).json({
        message: 'challengeId, collaborationType, title, and commitmentDetails are required.',
      });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    let resolvedProposalId = proposalId;
    if (!resolvedProposalId) {
      const firstProp = await Proposal.findOne({ challengeId: challenge._id }).select('_id');
      if (firstProp) resolvedProposalId = firstProp._id;
    }

    const partnership = await Partnership.create({
      challengeId: challenge._id,
      proposalId: resolvedProposalId,
      industryId: req.user.id,
      collaborationType,
      title: title.trim(),
      commitmentDetails: commitmentDetails.trim(),
      fundingAmount: Number(fundingAmount) || 0,
      status: 'proposed',
    });

    const admins = await User.find({ role: 'admin' }).select('_id');
    const orgLabel = req.user.organizationName || req.user.name;

    await recordAuditAndNotify({
      challengeId: challenge._id,
      actor: req.user,
      action: 'partnership_proposed',
      fromStatus: challenge.status,
      toStatus: challenge.status,
      remarks: `${orgLabel} offered ${collaborationType.replace(/_/g, ' ')}: "${title}" (₹${(
        Number(fundingAmount) || 0
      ).toLocaleString('en-IN')}).`,
      notifications: [
        ...(challenge.assignedUniversity
          ? [
              {
                recipientId: challenge.assignedUniversity,
                title: 'New Industry Partnership Offer',
                message: `${orgLabel} offered "${title}" (${collaborationType.replace(/_/g, ' ')}) on "${challenge.title}".`,
              },
            ]
          : []),
        ...admins.map((a) => ({
          recipientId: a._id,
          title: 'Industry Collaboration Proposed',
          message: `${orgLabel} pledged ₹${(Number(fundingAmount) || 0).toLocaleString('en-IN')} for "${challenge.title}".`,
        })),
        {
          recipientId: challenge.submittedBy,
          title: 'Industry Partner Interested in Your Challenge',
          message: `${orgLabel} offered ${collaborationType.replace(/_/g, ' ')} support.`,
        },
      ],
    });

    const populated = await Partnership.findById(partnership._id)
      .populate('challengeId', 'title district category severity status')
      .populate('industryId', 'name email organizationName district');

    return res.status(201).json({ partnership: populated });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/partnerships/:id/respond (university or admin)
router.patch('/:id/respond', verifyToken, allowRoles('university', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'accepted', 'declined', or 'completed'.",
      });
    }

    const partnership = await Partnership.findById(req.params.id);
    if (!partnership) return res.status(404).json({ message: 'Partnership not found.' });

    const challenge = await Challenge.findById(partnership.challengeId);
    if (
      req.user.role === 'university' &&
      challenge?.assignedUniversity &&
      String(challenge.assignedUniversity) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: 'You can only respond to partnership offers for challenges assigned to your university.',
      });
    }

    partnership.status = status;
    await partnership.save();

    await recordAuditAndNotify({
      challengeId: partnership.challengeId,
      actor: req.user,
      action: `partnership_${status}`,
      fromStatus: challenge ? challenge.status : '',
      toStatus: challenge ? challenge.status : '',
      remarks: `${req.user.organizationName || req.user.name} marked partnership "${partnership.title}" as ${status}.`,
      notifications: [
        {
          recipientId: partnership.industryId,
          title: `Partnership Offer ${status.toUpperCase()}`,
          message: `"${partnership.title}" was ${status} by ${req.user.organizationName || req.user.name}.`,
        },
      ],
    });

    const populated = await Partnership.findById(partnership._id)
      .populate('challengeId', 'title district category severity status')
      .populate('industryId', 'name email organizationName district');

    return res.json({ partnership: populated });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
