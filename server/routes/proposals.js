const express = require('express');
const Proposal = require('../models/Proposal');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { assertLegalTransition } = require('../utils/stateMachine');
const { recordAuditAndNotify } = require('../utils/auditAndNotify');

const router = express.Router();

// GET /api/proposals
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { challengeId, universityId, status, mine } = req.query;
    const filter = {};
    if (challengeId) filter.challengeId = challengeId;
    if (status && status !== 'ALL') filter.status = status;
    if (mine === 'true') filter.universityId = req.user.id;
    else if (universityId) filter.universityId = universityId;

    const proposals = await Proposal.find(filter)
      .populate('challengeId', 'title district category severity status')
      .populate('universityId', 'name email organizationName district specializations')
      .sort({ createdAt: -1 });

    return res.json({ proposals });
  } catch (err) {
    return next(err);
  }
});

// POST /api/proposals (university only)
router.post('/', verifyToken, allowRoles('university'), async (req, res, next) => {
  try {
    const {
      challengeId,
      teamName,
      facultyMentor,
      members = [],
      abstract,
      methodology,
      expectedImpact,
      estimatedBudget = 0,
      milestones = [],
      targetChallengeStatus = 'in_progress',
    } = req.body;

    if (!challengeId || !teamName || !facultyMentor || !abstract || !methodology || !expectedImpact) {
      return res.status(400).json({
        message:
          'challengeId, teamName, facultyMentor, abstract, methodology, and expectedImpact are required.',
      });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    if (
      challenge.assignedUniversity &&
      String(challenge.assignedUniversity) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: 'Challenge is routed to another university.' });
    }

    if (!['validated', 'routed', 'team_formed', 'in_progress'].includes(challenge.status)) {
      return res.status(400).json({
        message: `Cannot submit proposal when challenge status is '${challenge.status}'.`,
      });
    }

    const normalizedMilestones = (Array.isArray(milestones) ? milestones : [])
      .filter((m) => m && m.title)
      .map((m) => ({
        title: m.title.trim(),
        description: (m.description || '').trim(),
        dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
        status: m.status || 'pending',
        deliverableUrl: m.deliverableUrl || '',
      }));

    const proposal = await Proposal.create({
      challengeId: challenge._id,
      universityId: req.user.id,
      teamName: teamName.trim(),
      facultyMentor: facultyMentor.trim(),
      members: Array.isArray(members) ? members.filter((m) => m && m.name) : [],
      abstract: abstract.trim(),
      methodology: methodology.trim(),
      expectedImpact: expectedImpact.trim(),
      estimatedBudget: Number(estimatedBudget) || 0,
      status: 'approved',
      milestones: normalizedMilestones,
    });

    const fromStatus = challenge.status;
    const nextStatus = ['team_formed', 'in_progress'].includes(targetChallengeStatus)
      ? targetChallengeStatus
      : 'in_progress';
    assertLegalTransition(fromStatus, nextStatus);
    challenge.status = nextStatus;
    if (!challenge.assignedUniversity) {
      challenge.assignedUniversity = req.user.id;
    }
    await challenge.save();

    const admins = await User.find({ role: 'admin' }).select('_id');
    await recordAuditAndNotify({
      challengeId: challenge._id,
      actor: req.user,
      action: 'proposal_submitted',
      fromStatus,
      toStatus: nextStatus,
      remarks: `${req.user.organizationName || req.user.name} formed team "${teamName}" (Mentor: ${facultyMentor}) with ${normalizedMilestones.length} milestones.`,
      notifications: [
        ...admins.map((a) => ({
          recipientId: a._id,
          title: 'University R&D Proposal & Team Formed',
          message: `${req.user.organizationName || req.user.name} started "${teamName}" on "${challenge.title}".`,
        })),
        {
          recipientId: challenge.submittedBy,
          title: 'University Team Formed for Your Challenge',
          message: `${req.user.organizationName || req.user.name} (${teamName}) is working on "${challenge.title}".`,
        },
      ],
    });

    const populated = await Proposal.findById(proposal._id)
      .populate('challengeId', 'title district category severity status')
      .populate('universityId', 'name email organizationName district');

    return res.status(201).json({ proposal: populated });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/proposals/:id/milestones/:milestoneId
router.patch(
  '/:id/milestones/:milestoneId',
  verifyToken,
  allowRoles('university', 'admin'),
  async (req, res, next) => {
    try {
      const { status, deliverableUrl } = req.body;
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) return res.status(404).json({ message: 'Proposal not found.' });

      if (
        req.user.role === 'university' &&
        String(proposal.universityId) !== String(req.user.id)
      ) {
        return res.status(403).json({ message: 'Only the owning university can update milestones.' });
      }

      const milestone = proposal.milestones.id(req.params.milestoneId);
      if (!milestone) return res.status(404).json({ message: 'Milestone not found.' });

      if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
        milestone.status = status;
        milestone.completedAt = status === 'completed' ? new Date() : undefined;
      }
      if (deliverableUrl !== undefined) {
        milestone.deliverableUrl = String(deliverableUrl).trim();
      }
      await proposal.save();

      const challenge = await Challenge.findById(proposal.challengeId);
      const admins = await User.find({ role: 'admin' }).select('_id');
      await recordAuditAndNotify({
        challengeId: proposal.challengeId,
        actor: req.user,
        action: 'milestone_updated',
        fromStatus: challenge ? challenge.status : '',
        toStatus: challenge ? challenge.status : '',
        remarks: `Milestone "${milestone.title}" updated to ${milestone.status}${
          milestone.deliverableUrl ? ` (Deliverable: ${milestone.deliverableUrl})` : ''
        }.`,
        notifications: [
          ...(challenge
            ? [
                {
                  recipientId: challenge.submittedBy,
                  title: 'R&D Milestone Progress Update',
                  message: `"${milestone.title}" on "${challenge.title}" is now ${milestone.status.replace(/_/g, ' ')}.`,
                },
              ]
            : []),
          ...admins.map((a) => ({
            recipientId: a._id,
            title: 'University Milestone Updated',
            message: `"${milestone.title}" marked ${milestone.status}.`,
          })),
        ],
      });

      const populated = await Proposal.findById(proposal._id)
        .populate('challengeId', 'title district category severity status')
        .populate('universityId', 'name email organizationName district');

      return res.json({ proposal: populated, milestone });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
