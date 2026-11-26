require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Proposal = require('../models/Proposal');
const Partnership = require('../models/Partnership');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const populateSeed = async () => {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const [citizenAarav, adminNodal, univLpu, univAlliance, industryPartner] = await User.insertMany([
    {
      name: 'Aarav Sharma',
      email: 'citizen@janupkram.org',
      passwordHash,
      role: 'citizen',
      organizationName: 'Community Civic Forum, Phagwara',
      district: 'Phagwara',
      specializations: [],
    },
    {
      name: 'Dr. Meenakshi Nair',
      email: 'admin@janupkram.org',
      passwordHash,
      role: 'admin',
      organizationName: 'Janupkram Central Moderation Cell',
      district: 'New Delhi',
      specializations: [],
    },
    {
      name: 'Prof. Anurag Sharma',
      email: 'innovation@lpu.co.in',
      passwordHash,
      role: 'university',
      organizationName: 'Lovely Professional University (LPU) Innovation Studio',
      district: 'Phagwara',
      specializations: ['agriculture', 'healthcare', 'sanitation', 'environment', 'infrastructure'],
    },
    {
      name: 'Prof. S.K. Iyer',
      email: 'research@campus-hub.edu.in',
      passwordHash,
      role: 'university',
      organizationName: 'National University R&D Alliance',
      district: 'Bengaluru',
      specializations: ['education', 'infrastructure', 'sanitation', 'environment'],
    },
    {
      name: 'Vikram Chatterjee',
      email: 'csr@industry-collab.org',
      passwordHash,
      role: 'industry',
      organizationName: 'Bharat Tech & CSR Foundation',
      district: 'Pune',
      specializations: ['sanitation', 'healthcare', 'environment', 'infrastructure'],
    },
  ]);

  const challenges = await Challenge.insertMany([
    {
      title: 'Raw Sewage Overflow & Monsoon Waterlogging on ORR Bellandur–Ecospace Road',
      description:
        'Discovered via r/bangalore citizen threads: recurring raw sewage leaks and blocked stormwater drains (rajakaluves) turn the Outer Ring Road service lanes near Bellandur and Ecospace into flooded, foul-smelling bottlenecks even after moderate rain. Needs automated drain-choke telemetry and decentralized bio-filtration.',
      category: 'sanitation',
      severity: 'high',
      district: 'Bengaluru',
      sourcePlatform: 'Reddit • r/bangalore',
      sourceUrl: 'https://www.reddit.com/r/bangalore/',
      externalTicketId: 'BBMP-ORR-2026-412',
      location: { type: 'Point', coordinates: [77.6762, 12.9279] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'in_progress',
      upvotes: [citizenAarav._id, univLpu._id, industryPartner._id],
      escalations: [
        {
          authorityName: 'BBMP Chief Commissioner & BWSSB',
          authorityHandle: '@BBMPComm',
          department: 'Stormwater & Underground Drainage Cell',
          channel: 'x_post',
          message:
            'Urgent civic escalation: Chronic sewage backflow & clogged stormwater inlets on Bellandur ORR service road affecting daily commuters. Request desilting & UGD inspection.',
          portalUrl: 'https://pgportal.gov.in/',
          escalatedBy: adminNodal._id,
          escalatedByName: adminNodal.name,
          status: 'acknowledged',
        },
      ],
    },
    {
      title: 'Severe PM2.5 Spikes, Unpaved Road Dust & GRAP Bottlenecks in East Delhi',
      description:
        'Reported across r/delhi community discussions: persistent hazardous PM2.5 levels combined with road dust (PM10) from uncarpeted edges and construction corridors cause severe respiratory distress. Needs low-cost hyperlocal air-quality micro-sensors with multilingual health alerts and targeted anti-smog misting.',
      category: 'environment',
      severity: 'high',
      district: 'New Delhi',
      sourcePlatform: 'Reddit • r/delhi',
      sourceUrl: 'https://www.reddit.com/r/delhi/',
      externalTicketId: 'CPGRAMS-DL-9081',
      location: { type: 'Point', coordinates: [77.3152, 28.6469] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'routed',
      upvotes: [citizenAarav._id, univLpu._id],
    },
    {
      title: 'Washed-Out Patchwork Potholes & Unfinished Utility Digging in Pune',
      description:
        'Flagged repeatedly on r/pune: roads dug up for underground utility pipelines remain un-resurfaced for months, while pre-monsoon patchwork washes away after the first rain, causing commuter accidents and massive traffic gridlock.',
      category: 'infrastructure',
      severity: 'high',
      district: 'Pune',
      sourcePlatform: 'Reddit • r/pune',
      sourceUrl: 'https://www.reddit.com/r/pune/',
      externalTicketId: 'PMC-RD-2026-118',
      location: { type: 'Point', coordinates: [73.7389, 18.5913] },
      media: [],
      submittedBy: citizenAarav._id,
      status: 'validated',
      upvotes: [citizenAarav._id, industryPartner._id],
    },
    {
      title: 'Blocked Drainage, Open Manholes & Sewage Stagnation in Jaipur Residential Lanes',
      description:
        'Highlighted in r/jaipur civic grievance threads: damaged drainage slabs and clogged residential sewer lines cause wastewater overflow onto neighborhood streets, creating vector-borne health risks.',
      category: 'sanitation',
      severity: 'high',
      district: 'Jaipur',
      sourcePlatform: 'Reddit • r/jaipur',
      sourceUrl: 'https://www.reddit.com/r/jaipur/',
      location: { type: 'Point', coordinates: [75.7873, 26.9124] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'deployed',
      upvotes: [citizenAarav._id, univLpu._id, industryPartner._id],
    },
    {
      title: 'Illegal Nighttime Roadside Garbage Dumping & Overflowing Ward Bins (Madiwala)',
      description:
        'Reported via X (Twitter) & r/bangalore civic feeds: irregular garbage pickup and nighttime dumping along empty street corners in Madiwala / Maruthi Nagar create chronic sanitation blackspots.',
      category: 'sanitation',
      severity: 'medium',
      district: 'Bengaluru',
      sourcePlatform: 'X (Twitter) • Civic Thread',
      sourceUrl: 'https://x.com/search?q=BBMP%20garbage%20Madiwala',
      location: { type: 'Point', coordinates: [77.6174, 12.9226] },
      media: [],
      submittedBy: citizenAarav._id,
      status: 'validated',
      upvotes: [citizenAarav._id],
    },
    {
      title: 'Modular Solar Cold-Storage Chamber for Smallholder Perishable Produce',
      description:
        'Small farmers around the Phagwara–Jalandhar agrarian belt lose up to 30% of fresh vegetables in summer transit due to lack of decentralized pre-cooling chambers near local mandis.',
      category: 'agriculture',
      severity: 'high',
      district: 'Phagwara',
      sourcePlatform: 'Direct Report',
      location: { type: 'Point', coordinates: [75.7685, 31.2218] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'piloted',
      upvotes: [citizenAarav._id, univLpu._id, industryPartner._id],
    },
    {
      title: 'Smart Storm-Drain Plastic Trap & Waterlogging Alert Sensor near GT Road',
      description:
        'Plastic debris chokes arterial storm-water culverts near Law Gate & GT Road (LPU corridor) before peak rainstorms, causing flash waterlogging for students and commuters.',
      category: 'sanitation',
      severity: 'high',
      district: 'Phagwara',
      sourcePlatform: 'Direct Report',
      location: { type: 'Point', coordinates: [75.7118, 31.2612] },
      media: [],
      submittedBy: citizenAarav._id,
      status: 'submitted',
      upvotes: [citizenAarav._id],
    },
    {
      title: 'Overflowing Roadside Culvert & Greywater Stagnation near Chaheru Market',
      description:
        'Reported on Swachhata-MoHUA: repeated drainage blockage and stagnant greywater along Chaheru market stretch (~850m from the GT Road storm-drain culvert), raising vector-borne health risks.',
      category: 'sanitation',
      severity: 'medium',
      district: 'Phagwara',
      sourcePlatform: 'Swachhata-MoHUA',
      sourceUrl: 'https://sbmurban.org/',
      externalTicketId: 'SBM-1969-7741',
      location: { type: 'Point', coordinates: [75.7165, 31.2661] },
      media: [],
      submittedBy: citizenAarav._id,
      status: 'submitted',
      upvotes: [citizenAarav._id],
    },
  ]);

  const [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8] = challenges;

  const [prop1, prop2] = await Proposal.insertMany([
    {
      challengeId: ch1._id,
      universityId: univLpu._id,
      teamName: 'LPU UrbanDrain Sensor Collective',
      facultyMentor: 'Prof. Anurag Sharma',
      members: [
        { name: 'Rohan Malhotra', role: 'IoT Hardware Lead', department: 'ECE (LPU)' },
        { name: 'Ananya Verma', role: 'Cloud & GIS Lead', department: 'CSE (LPU)' },
        { name: 'Harpreet Singh', role: 'Hydrology Design', department: 'Civil Engg (LPU)' },
      ],
      abstract:
        'Solar ultrasonic silt-level & sewage-overflow LoRaWAN nodes mounted inside arterial storm-drain inlets to trigger pre-emptive municipal desilting alerts.',
      methodology:
        'Baseline drain flow mapping -> LPU FabLab IP68 ultrasonic sensor housing -> live GIS alert webhook integration with civic teams.',
      expectedImpact: 'Prevent chronic ORR waterlogging and provide 6-hour early choke warnings.',
      estimatedBudget: 420000,
      status: 'approved',
      milestones: [
        {
          title: 'Drain Hotspot GIS & Silt Assay',
          description: 'Map 15 critical Bellandur–ORR storm-drain inlets.',
          dueDate: new Date('2026-10-15'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-janupkram/urbandrain-gis',
          completedAt: new Date('2026-10-14'),
        },
        {
          title: 'IP68 Ultrasonic LoRaWAN Sensor Pod',
          description: 'Bench & wet-well endurance calibration.',
          dueDate: new Date('2026-11-25'),
          status: 'in_progress',
          deliverableUrl: '',
        },
        {
          title: 'Municipal Ward Pilot Handover',
          description: 'Deploy 5 live nodes with automated alert dashboard.',
          dueDate: new Date('2026-12-20'),
          status: 'pending',
          deliverableUrl: '',
        },
      ],
    },
    {
      challengeId: ch6._id,
      universityId: univLpu._id,
      teamName: 'LPU AgriCool Innovators',
      facultyMentor: 'Prof. Anurag Sharma',
      members: [
        { name: 'Karan Verma', role: 'Thermal Systems Lead', department: 'Mechanical Engg (LPU)' },
        { name: 'Sneha Patel', role: 'Embedded Telemetry', department: 'CSE (LPU)' },
      ],
      abstract:
        'Modular 3 MT solar phase-change cold room maintaining 8-10°C for smallholder fresh produce.',
      methodology:
        'Thermal load modeling, eutectic PCM plate fabrication, solar DC compressor assembly, and mandi pilot validation.',
      expectedImpact: 'Reduce post-harvest spoilage below 8% and raise farmer income by 24%.',
      estimatedBudget: 480000,
      status: 'approved',
      milestones: [
        {
          title: 'Eutectic PCM Thermal Bank Design',
          description: '18-hour cloudy backup thermal retention.',
          dueDate: new Date('2026-09-20'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-janupkram/agricool-pcm',
          completedAt: new Date('2026-09-18'),
        },
        {
          title: 'Solar Cold Chamber Assembly',
          description: '3.5 kW solar PV + DC compressor integration.',
          dueDate: new Date('2026-10-25'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-janupkram/agricool-pilot',
          completedAt: new Date('2026-10-24'),
        },
        {
          title: 'Farmer Co-op Field Trial',
          description: '30-day spoilage tracking with 45 farmers.',
          dueDate: new Date('2026-11-20'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-janupkram/agricool-audit',
          completedAt: new Date('2026-11-19'),
        },
      ],
    },
  ]);

  await Partnership.insertMany([
    {
      challengeId: ch1._id,
      proposalId: prop1._id,
      industryId: industryPartner._id,
      collaborationType: 'funding',
      title: 'CSR Urban Stormwater Sensor Grant',
      commitmentDetails:
        'CSR grant covering IP68 LoRa sensor nodes and field calibration.',
      fundingAmount: 350000,
      status: 'accepted',
    },
    {
      challengeId: ch6._id,
      proposalId: prop2._id,
      industryId: industryPartner._id,
      collaborationType: 'field_deployment',
      title: 'Cold-Chain Pilot Deployment & Mentorship',
      commitmentDetails:
        'Co-funding solar compressor hardware plus 30 hours of cold-chain engineering mentorship.',
      fundingAmount: 450000,
      status: 'accepted',
    },
    {
      challengeId: ch4._id,
      industryId: industryPartner._id,
      collaborationType: 'mentorship',
      title: 'Sanitation Sensor Pilot Support (Jaipur)',
      commitmentDetails: 'Completed engineering mentoring and ward pilot support.',
      fundingAmount: 280000,
      status: 'completed',
    },
  ]);

  await ActivityLog.insertMany([
    {
      challengeId: ch1._id,
      actorId: citizenAarav._id,
      actorName: citizenAarav.name,
      actorRole: 'citizen',
      action: 'submitted',
      fromStatus: '',
      toStatus: 'submitted',
      remarks: 'Imported from Reddit • r/bangalore (Bengaluru ORR Bellandur).',
    },
    {
      challengeId: ch1._id,
      actorId: adminNodal._id,
      actorName: adminNodal.name,
      actorRole: 'admin',
      action: 'escalated_to_authority',
      fromStatus: 'validated',
      toStatus: 'validated',
      remarks: 'Dispatched to BBMP Chief Commissioner & BWSSB (@BBMPComm) via X_POST.',
    },
    {
      challengeId: ch1._id,
      actorId: univLpu._id,
      actorName: univLpu.name,
      actorRole: 'university',
      action: 'proposal_submitted',
      fromStatus: 'routed',
      toStatus: 'in_progress',
      remarks: 'LPU UrbanDrain Sensor Collective formed with 3 milestones.',
    },
    {
      challengeId: ch7._id,
      actorId: citizenAarav._id,
      actorName: citizenAarav.name,
      actorRole: 'citizen',
      action: 'submitted',
      fromStatus: '',
      toStatus: 'submitted',
      remarks: 'Submitted near GT Road Culvert, Phagwara.',
    },
    {
      challengeId: ch8._id,
      actorId: citizenAarav._id,
      actorName: citizenAarav.name,
      actorRole: 'citizen',
      action: 'submitted',
      fromStatus: '',
      toStatus: 'submitted',
      remarks: 'Linked from Swachhata-MoHUA (SBM-1969-7741), ~850m from GT Road Culvert.',
    },
  ]);

  await Notification.insertMany([
    {
      recipientId: adminNodal._id,
      title: '2 Pending Phagwara Drainage Reports Within 2km',
      message:
        'Two sanitation challenges near Phagwara GT Road are within 850m. Run 2km Duplicate Check.',
      relatedChallengeId: ch8._id,
    },
    {
      recipientId: univLpu._id,
      title: 'New Issue Routed from r/delhi: East Delhi PM2.5 Spikes',
      message: 'Severe PM2.5 & road dust challenge awaits your LPU student R&D team.',
      relatedChallengeId: ch2._id,
    },
    {
      recipientId: citizenAarav._id,
      title: 'BBMP Escalation Acknowledged on ORR Waterlogging',
      message: 'Authority escalation (@BBMPComm) was acknowledged and LPU team is active.',
      relatedChallengeId: ch1._id,
    },
    {
      recipientId: industryPartner._id,
      title: 'New Validated Issues from r/pune & X (Bengaluru)',
      message: 'Pune road potholes & Madiwala waste blackspots are open for CSR collaboration.',
      relatedChallengeId: ch3._id,
    },
  ]);
};

const ensureSeeded = async () => {
  const count = await User.countDocuments();
  const hasLegacySeed = await User.exists({ email: 'ramesh.citizen@jharkhand.in' });
  const hasCurrentSeed = await User.exists({ email: 'citizen@janupkram.org' });
  const hasPreDiscoverySeed = await Challenge.exists({
    title: 'IoT Groundwater Salinity & Nitrate Monitoring Grid for Rural Wells',
  });

  if (count === 0 || (hasLegacySeed && !hasCurrentSeed) || hasPreDiscoverySeed) {
    console.log('Refreshing database with discovered India Reddit/X + LPU Janupkram seed...');
    await Promise.all([
      User.deleteMany({}),
      Challenge.deleteMany({}),
      Proposal.deleteMany({}),
      Partnership.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);
    await populateSeed();
    console.log('Auto-seed complete.');
  }
};

const seedData = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Challenge.deleteMany({}),
    Proposal.deleteMany({}),
    Partnership.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);
  await populateSeed();
  console.log('Manual Janupkram seed completed! Password for all demo accounts: Password@123');
  process.exit(0);
};

if (require.main === module) {
  seedData().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { seedData, ensureSeeded };
