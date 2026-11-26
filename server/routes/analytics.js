const express = require('express');
const Challenge = require('../models/Challenge');
const Proposal = require('../models/Proposal');
const Partnership = require('../models/Partnership');
const User = require('../models/User');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/overview (Public landing KPIs)
router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalChallenges,
      deployedChallenges,
      activePrototypes,
      universitiesCount,
      industryCount,
      csrAgg,
    ] = await Promise.all([
      Challenge.countDocuments(),
      Challenge.countDocuments({ status: 'deployed' }),
      Challenge.countDocuments({ status: { $in: ['team_formed', 'in_progress', 'piloted'] } }),
      User.countDocuments({ role: 'university' }),
      User.countDocuments({ role: 'industry' }),
      Partnership.aggregate([
        { $match: { status: { $in: ['proposed', 'accepted', 'completed'] } } },
        { $group: { _id: null, totalFunding: { $sum: '$fundingAmount' } } },
      ]),
    ]);

    return res.json({
      totalChallenges,
      deployedChallenges,
      activePrototypes,
      universitiesCount,
      industryCount,
      totalCsrFunding: csrAgg[0]?.totalFunding || 0,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/analytics/dashboard (Admin & Industry executive analytics)
router.get('/dashboard', verifyToken, allowRoles('admin', 'industry'), async (req, res, next) => {
  try {
    const [challenges, proposals, partnerships, universities] = await Promise.all([
      Challenge.find().lean(),
      Proposal.find().lean(),
      Partnership.find({ status: { $ne: 'declined' } }).lean(),
      User.find({ role: 'university' }).select('name organizationName district specializations').lean(),
    ]);

    const totalChallenges = challenges.length;
    const validatedCount = challenges.filter(
      (c) => !['submitted', 'under_review', 'rejected'].includes(c.status)
    ).length;
    const validatedRate = totalChallenges ? Math.round((validatedCount / totalChallenges) * 100) : 0;
    const activePrototypes = challenges.filter((c) =>
      ['team_formed', 'in_progress', 'piloted'].includes(c.status)
    ).length;
    const deployedSolutions = challenges.filter((c) => c.status === 'deployed').length;
    const totalCsrFunding = partnerships.reduce((s, p) => s + (Number(p.fundingAmount) || 0), 0);

    // Pipeline funnel across lifecycle stages
    const funnel = [
      { stage: 'Submitted', count: totalChallenges },
      { stage: 'Validated', count: validatedCount },
      {
        stage: 'Routed',
        count: challenges.filter((c) =>
          ['routed', 'team_formed', 'in_progress', 'piloted', 'deployed'].includes(c.status)
        ).length,
      },
      {
        stage: 'In Progress',
        count: challenges.filter((c) =>
          ['team_formed', 'in_progress', 'piloted', 'deployed'].includes(c.status)
        ).length,
      },
      {
        stage: 'Piloted',
        count: challenges.filter((c) => ['piloted', 'deployed'].includes(c.status)).length,
      },
      { stage: 'Deployed', count: deployedSolutions },
    ];

    // Domain distribution
    const categoryLabel = (cat) => cat.charAt(0).toUpperCase() + cat.slice(1);
    const domainMap = new Map();
    for (const c of challenges) {
      const label = categoryLabel(c.category);
      const curr = domainMap.get(label) || { category: label, count: 0 };
      curr.count += 1;
      domainMap.set(label, curr);
    }
    const byCategory = Array.from(domainMap.values()).sort((a, b) => b.count - a.count);

    // City / Region breakdown across Pan-India hubs
    const coreDistricts = ['Phagwara', 'New Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Jaipur'];
    const districtMap = new Map(
      coreDistricts.map((d) => [d, { district: d, total: 0, active: 0, deployed: 0 }])
    );
    for (const c of challenges) {
      const d = c.district || 'Phagwara';
      if (!districtMap.has(d)) {
        districtMap.set(d, { district: d, total: 0, active: 0, deployed: 0 });
      }
      const row = districtMap.get(d);
      row.total += 1;
      if (c.status === 'deployed') row.deployed += 1;
      else if (c.status !== 'rejected') row.active += 1;
    }
    const byDistrict = Array.from(districtMap.values());

    // University leaderboard
    const universityLeaderboard = universities
      .map((u) => {
        const uid = String(u._id);
        const assigned = challenges.filter(
          (c) => c.assignedUniversity && String(c.assignedUniversity) === uid
        );
        const uProps = proposals.filter((p) => String(p.universityId) === uid);
        let totalMilestones = 0;
        let completedMilestones = 0;
        for (const p of uProps) {
          for (const m of p.milestones || []) {
            totalMilestones += 1;
            if (m.status === 'completed') completedMilestones += 1;
          }
        }
        const deployedCount = assigned.filter((c) => c.status === 'deployed').length;
        const pilotedCount = assigned.filter((c) => c.status === 'piloted').length;
        return {
          universityId: u._id,
          organizationName: u.organizationName || u.name,
          name: u.name,
          district: u.district,
          assignedChallenges: assigned.length,
          activeProposals: uProps.length,
          totalMilestones,
          completedMilestones,
          pilotedCount,
          deployedCount,
          score:
            deployedCount * 30 +
            pilotedCount * 20 +
            uProps.length * 15 +
            completedMilestones * 5 +
            assigned.length * 3,
        };
      })
      .sort((a, b) => b.score - a.score);

    return res.json({
      kpis: {
        totalChallenges,
        validatedRate,
        activePrototypes,
        totalCsrFunding,
        deployedSolutions,
      },
      funnel,
      byCategory,
      byDistrict,
      universityLeaderboard,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
