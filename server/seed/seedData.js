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
      title: 'IoT Groundwater Salinity & Nitrate Monitoring Grid for Rural Wells',
      description:
        'Community tube wells across peri-urban agrarian belts report rising TDS and nitrate levels post-monsoon. Need an affordable solar LoRaWAN sensor attachment with multilingual public water-safety alerts.',
      category: 'sanitation',
      severity: 'high',
      district: 'Phagwara',
      location: { type: 'Point', coordinates: [75.7058, 31.2554] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'in_progress',
      upvotes: [citizenAarav._id, univLpu._id, industryPartner._id],
    },
    {
      title: 'Modular Solar Cold-Storage Chamber for Smallholder Perishable Produce',
      description:
        'Small farmers lose up to 30% of fresh vegetables and fruits in summer transit due to lack of decentralized pre-cooling chambers near local mandis and highway collection hubs.',
      category: 'agriculture',
      severity: 'high',
      district: 'Phagwara',
      location: { type: 'Point', coordinates: [75.7685, 31.2218] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'piloted',
      upvotes: [citizenAarav._id, univLpu._id, industryPartner._id],
    },
    {
      title: 'Hyperlocal PM2.5 & Heat-Island Micro-Sensor Mesh for Urban Transit Corridors',
      description:
        'High-density commuter junctions face unmonitored particulate spikes and heat stress. Community clinics need real-time micro-climate alerts to protect outdoor workers and commuters.',
      category: 'environment',
      severity: 'high',
      district: 'New Delhi',
      location: { type: 'Point', coordinates: [77.209, 28.6139] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'routed',
      upvotes: [citizenAarav._id, univLpu._id],
    },
    {
      title: 'Non-Invasive Optical Hemoglobin Screening Device for Community Health Camps',
      description:
        'Grassroots health workers need a reusable, zero-consumable optical screening tool integrated with a mobile nutrition registry for maternal and adolescent anemia drives.',
      category: 'healthcare',
      severity: 'high',
      district: 'Jaipur',
      location: { type: 'Point', coordinates: [75.7873, 26.9124] },
      media: [],
      submittedBy: citizenAarav._id,
      assignedUniversity: univLpu._id,
      status: 'deployed',
      upvotes: [citizenAarav._id, univLpu._id, industryPartner._id],
    },
    {
      title: 'Edge-AI Smart Pedestrian & Blind-Curve Warning Beacons on Arterial Roads',
      description:
        'Unlit arterial crossings near schools and industrial zones experience frequent night-time collision risks. Need solar thermal/radar warning beacons for local traffic teams.',
      category: 'infrastructure',
      severity: 'medium',
      district: 'Pune',
      location: { type: 'Point', coordinates: [73.8567, 18.5204] },
      media: [],
      submittedBy: citizenAarav._id,
      status: 'validated',
      upvotes: [citizenAarav._id, industryPartner._id],
    },
    {
      title: 'Offline Multilingual Interactive STEM & Coding Lab Kits for Public Schools',
      description:
        'Under-resourced secondary schools across semi-urban and rural regions lack internet-independent hands-on STEM simulation kits in regional languages.',
      category: 'education',
      severity: 'medium',
      district: 'Bengaluru',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      media: [],
      submittedBy: citizenAarav._id,
      status: 'validated',
      upvotes: [citizenAarav._id],
    },
    {
      title: 'Smart Storm-Drain Plastic Trap & Waterlogging Alert Sensor near GT Road',
      description:
        'Plastic debris chokes arterial storm-water culverts near Law Gate & GT Road before peak rainstorms, causing flash waterlogging for students and local commuters.',
      category: 'sanitation',
      severity: 'high',
      district: 'Phagwara',
      location: { type: 'Point', coordinates: [75.7118, 31.2612] },
      media: [],
      submittedBy: citizenAarav._id,
      status: 'submitted',
      upvotes: [citizenAarav._id],
    },
    {
      title: 'Overflowing Roadside Culvert & Greywater Stagnation near Chaheru Market',
      description:
        'Repeated drainage blockage and stagnant greywater along Chaheru market stretch (~850m from the GT Road storm-drain culvert), raising vector-borne health risks.',
      category: 'sanitation',
      severity: 'medium',
      district: 'Phagwara',
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
      teamName: 'LPU AquaSense Student Collective',
      facultyMentor: 'Prof. Anurag Sharma',
      members: [
        { name: 'Rohan Malhotra', role: 'IoT Hardware Lead', department: 'ECE (LPU)' },
        { name: 'Ananya Verma', role: 'Cloud & Telemetry Lead', department: 'CSE (LPU)' },
        { name: 'Harpreet Singh', role: 'Field Testing Lead', department: 'Civil Engg (LPU)' },
      ],
      abstract:
        'Low-cost solar LoRaWAN TDS/nitrate sensing node paired with an automated multi-stage bio-sand & activated carbon filtration cartridge.',
      methodology:
        'Baseline water assay -> LPU FabLab PCB & enclosure fabrication -> 3-site community deployment and operator training.',
      expectedImpact: 'Real-time water safety alerts and clean drinking water for 5,000+ residents.',
      estimatedBudget: 380000,
      status: 'approved',
      milestones: [
        {
          title: 'Baseline Hydro-Chemical Assay',
          description: 'Collect 25 borehole samples and calibrate nitrate sensors.',
          dueDate: new Date('2026-10-15'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-janupkram/aquasense-assay',
          completedAt: new Date('2026-10-14'),
        },
        {
          title: 'Solar LoRa Node & Cartridge Prototype',
          description: 'Lab validation across 500 filtration cycles.',
          dueDate: new Date('2026-11-25'),
          status: 'in_progress',
          deliverableUrl: '',
        },
        {
          title: 'Community Deployment & Handover',
          description: 'Install 3 field stations with local civic volunteers.',
          dueDate: new Date('2026-12-20'),
          status: 'pending',
          deliverableUrl: '',
        },
      ],
    },
    {
      challengeId: ch2._id,
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
      title: 'CSR Safe Water Telemetry Grant',
      commitmentDetails:
        'CSR grant covering sensor PCB fabrication and certified water-quality lab testing.',
      fundingAmount: 320000,
      status: 'accepted',
    },
    {
      challengeId: ch2._id,
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
      title: 'Medical Device QA & Field Rollout Support',
      commitmentDetails: 'Completed clinical QA mentoring and pilot funding for community camps.',
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
      remarks: 'Submitted by Aarav Sharma in Phagwara (sanitation).',
    },
    {
      challengeId: ch1._id,
      actorId: adminNodal._id,
      actorName: adminNodal.name,
      actorRole: 'admin',
      action: 'routed_to_university',
      fromStatus: 'validated',
      toStatus: 'routed',
      remarks: 'Routed to Lovely Professional University (LPU) Innovation Studio.',
    },
    {
      challengeId: ch1._id,
      actorId: univLpu._id,
      actorName: univLpu.name,
      actorRole: 'university',
      action: 'proposal_submitted',
      fromStatus: 'routed',
      toStatus: 'in_progress',
      remarks: 'LPU AquaSense Student Collective formed with 3 milestones.',
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
      remarks: 'Submitted near Chaheru Market (~850m from GT Road Culvert).',
    },
  ]);

  await Notification.insertMany([
    {
      recipientId: adminNodal._id,
      title: '2 Pending Drainage Reports Within 2km',
      message:
        'Two sanitation challenges near Phagwara GT Road are within 850m. Run 2km Duplicate Check.',
      relatedChallengeId: ch8._id,
    },
    {
      recipientId: univLpu._id,
      title: 'New Challenge Routed: Urban PM2.5 Sensor Mesh',
      message: 'Hyperlocal PM2.5 & Heat-Island Micro-Sensor Mesh awaits your LPU student R&D team.',
      relatedChallengeId: ch3._id,
    },
    {
      recipientId: citizenAarav._id,
      title: 'Milestone 1 Completed by LPU AquaSense Team',
      message: 'LPU student squad completed Baseline Hydro-Chemical Assay.',
      relatedChallengeId: ch1._id,
    },
    {
      recipientId: industryPartner._id,
      title: 'New Validated Challenges in Pune & Bengaluru',
      message: 'Road Safety Beacons & Offline STEM Kits are open for CSR collaboration.',
      relatedChallengeId: ch5._id,
    },
  ]);
};

const ensureSeeded = async () => {
  const count = await User.countDocuments();
  const hasLegacySeed = await User.exists({ email: 'ramesh.citizen@jharkhand.in' });
  const hasCurrentSeed = await User.exists({ email: 'citizen@janupkram.org' });

  if (count === 0 || (hasLegacySeed && !hasCurrentSeed)) {
    console.log(
      count === 0
        ? 'Empty database detected. Running idempotent Janupkram seed...'
        : 'Legacy seed detected. Upgrading to Janupkram Pan-India seed...'
    );
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
