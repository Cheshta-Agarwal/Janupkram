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

  const [citizenRamesh, adminNodal, univLpu, univBitMesra, industryTata] = await User.insertMany([
    {
      name: 'Ramesh Mahato',
      email: 'ramesh.citizen@jharkhand.in',
      passwordHash,
      role: 'citizen',
      organizationName: 'Ranchi Ward 14 Citizen Forum',
      district: 'Ranchi',
      specializations: [],
    },
    {
      name: 'Dr. Arvind Kumar',
      email: 'admin@jharkhand.gov.in',
      passwordHash,
      role: 'admin',
      organizationName: 'Nodal Officer - Govt. of Jharkhand',
      district: 'Ranchi',
      specializations: [],
    },
    {
      name: 'Prof. Anurag Sharma',
      email: 'innovation@lpu.co.in',
      passwordHash,
      role: 'university',
      organizationName: 'Lovely Professional University',
      district: 'Ranchi',
      specializations: ['agriculture', 'healthcare', 'environment', 'infrastructure'],
    },
    {
      name: 'Prof. S.K. Sinha',
      email: 'research@bitmesra.ac.in',
      passwordHash,
      role: 'university',
      organizationName: 'BIT Mesra, Ranchi',
      district: 'Ranchi',
      specializations: ['sanitation', 'education', 'infrastructure', 'agriculture'],
    },
    {
      name: 'Vikram Chatterjee',
      email: 'csr@tatasteel-collab.in',
      passwordHash,
      role: 'industry',
      organizationName: 'Tata Steel Foundation & Tech Labs',
      district: 'Jamshedpur',
      specializations: ['sanitation', 'healthcare', 'environment', 'infrastructure'],
    },
  ]);

  const challenges = await Challenge.insertMany([
    {
      title: 'Fluoride & Arsenic Contamination in Kanke Rural Handpumps',
      description:
        'Over 120 rural handpumps in Kanke block show elevated fluoride (>2.1 mg/L) and seasonal turbidity, impacting school children and families. Need a low-maintenance community filtration unit with IoT water quality monitoring.',
      category: 'sanitation',
      severity: 'high',
      district: 'Ranchi',
      location: { type: 'Point', coordinates: [85.3186, 23.4378] },
      media: [],
      submittedBy: citizenRamesh._id,
      assignedUniversity: univBitMesra._id,
      status: 'in_progress',
      upvotes: [citizenRamesh._id, univBitMesra._id, industryTata._id],
    },
    {
      title: 'Solar-Powered Cold Storage for Lac & Vegetable Farmers in Ranchi-Gumla Belt',
      description:
        'Smallholder farmers lose 30% of perishable tomatoes and peas during summer transit due to lack of decentralized pre-cooling near village haats.',
      category: 'agriculture',
      severity: 'high',
      district: 'Ranchi',
      location: { type: 'Point', coordinates: [85.2214, 23.2856] },
      media: [],
      submittedBy: citizenRamesh._id,
      assignedUniversity: univLpu._id,
      status: 'piloted',
      upvotes: [citizenRamesh._id, univLpu._id, industryTata._id],
    },
    {
      title: 'Jharia Coalfield PM2.5 & Methane Micro-Sensor Alert Grid',
      description:
        'Coal-belt neighbourhoods in Dhanbad experience unmonitored dust spikes and underground seam gas alerts. Community clinics require hyperlocal Hindi/Khortha SMS alerts.',
      category: 'environment',
      severity: 'high',
      district: 'Dhanbad',
      location: { type: 'Point', coordinates: [86.4167, 23.7438] },
      media: [],
      submittedBy: citizenRamesh._id,
      assignedUniversity: univLpu._id,
      status: 'routed',
      upvotes: [citizenRamesh._id, univLpu._id],
    },
    {
      title: 'Non-Invasive Maternal Anemia Screening Kit for Tribal Anganwadis',
      description:
        'ASHA workers in remote Hazaribagh panchayats need a reusable, lancet-free optical hemoglobin screening tool connected to a mobile nutrition ledger.',
      category: 'healthcare',
      severity: 'high',
      district: 'Hazaribagh',
      location: { type: 'Point', coordinates: [85.3637, 23.9925] },
      media: [],
      submittedBy: citizenRamesh._id,
      assignedUniversity: univLpu._id,
      status: 'deployed',
      upvotes: [citizenRamesh._id, univLpu._id, industryTata._id],
    },
    {
      title: 'Acoustic & Thermal Edge-AI Early Warning Poles on NH-33 Dalma Corridor',
      description:
        'Human-elephant movement across highway corridors near Jamshedpur damages crops and creates night-time traffic hazards. Need solar warning beacons for forest beat teams.',
      category: 'infrastructure',
      severity: 'medium',
      district: 'Jamshedpur',
      location: { type: 'Point', coordinates: [86.2151, 22.8856] },
      media: [],
      submittedBy: citizenRamesh._id,
      status: 'validated',
      upvotes: [citizenRamesh._id, industryTata._id],
    },
    {
      title: 'Offline Multilingual STEM & Vocational Lab Kits for Bokaro Govt Schools',
      description:
        'Rural secondary schools in Bokaro lack internet-independent interactive STEM simulation kits in Hindi and Santhali for Class 8-10 students.',
      category: 'education',
      severity: 'medium',
      district: 'Bokaro',
      location: { type: 'Point', coordinates: [86.1511, 23.6693] },
      media: [],
      submittedBy: citizenRamesh._id,
      status: 'validated',
      upvotes: [citizenRamesh._id],
    },
    {
      title: 'Harmu Nadi Storm-Drain Plastic Skimmer & Flood Sensor',
      description:
        'Plastic debris clogs the Harmu Nadi culvert near Argora-Harmu link road before monsoon peak flows, causing flash waterlogging in low-lying wards.',
      category: 'sanitation',
      severity: 'high',
      district: 'Ranchi',
      location: { type: 'Point', coordinates: [85.3112, 23.3569] },
      media: [],
      submittedBy: citizenRamesh._id,
      status: 'submitted',
      upvotes: [citizenRamesh._id],
    },
    {
      title: 'Blocked Municipal Drain & Greywater Overflow near Harmu Chowk Market',
      description:
        'Recurring storm-drain overflow near Harmu Chowk market lane caused by plastic waste along the Harmu Nadi channel (~0.85 km from Harmu Nadi culvert).',
      category: 'sanitation',
      severity: 'medium',
      district: 'Ranchi',
      location: { type: 'Point', coordinates: [85.3168, 23.3625] },
      media: [],
      submittedBy: citizenRamesh._id,
      status: 'submitted',
      upvotes: [citizenRamesh._id],
    },
  ]);

  const [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8] = challenges;

  const [prop1, prop2] = await Proposal.insertMany([
    {
      challengeId: ch1._id,
      universityId: univBitMesra._id,
      teamName: 'BIT Jal-Rakshak Squad',
      facultyMentor: 'Prof. S.K. Sinha',
      members: [
        { name: 'Riya Kumari', role: 'IoT Hardware Lead', department: 'ECE' },
        { name: 'Aman Tirkey', role: 'Filtration Chemist', department: 'Chemical Engg' },
      ],
      abstract:
        'Dual-stage activated alumina + sal-seed biochar handpump filtration pod with solar LoRaWAN TDS telemetry.',
      methodology:
        'Hydro-chemical baseline assay in Kanke -> FabLab cartridge fabrication -> 3-site community deployment and Jal Sahiya training.',
      expectedImpact: 'Safe potable water (<0.8 mg/L fluoride) for 4,200 Kanke residents.',
      estimatedBudget: 420000,
      status: 'approved',
      milestones: [
        {
          title: 'Baseline Hydro-Chemical Assay',
          description: 'Collect 20 borehole samples across Kanke panchayats.',
          dueDate: new Date('2026-10-15'),
          status: 'completed',
          deliverableUrl: 'https://github.com/bitmesra-sih/kanke-water-assay',
          completedAt: new Date('2026-10-14'),
        },
        {
          title: 'Bio-Char Cartridge & LoRa Prototype',
          description: 'Lab validation of 500 filtration cycles.',
          dueDate: new Date('2026-11-25'),
          status: 'in_progress',
          deliverableUrl: '',
        },
        {
          title: 'Community Handpump Deployment',
          description: 'Install 3 field units and train Jal Sahiyas.',
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
        { name: 'Karan Verma', role: 'Thermal Systems Lead', department: 'Mechanical Engg' },
        { name: 'Sneha Soren', role: 'Embedded Telemetry', department: 'CSE' },
      ],
      abstract:
        'Modular 3 MT solar phase-change cold room maintaining 8-10°C for smallholder vegetable and lac producers.',
      methodology:
        'Thermal load modeling, eutectic PCM plate fabrication, solar DC compressor assembly, and mandi pilot validation.',
      expectedImpact: 'Reduce post-harvest spoilage below 8% and raise farmer income by 24%.',
      estimatedBudget: 500000,
      status: 'approved',
      milestones: [
        {
          title: 'Eutectic PCM Thermal Bank Design',
          description: '18-hour cloudy backup thermal retention.',
          dueDate: new Date('2026-09-20'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-sih/agricool-pcm-specs',
          completedAt: new Date('2026-09-18'),
        },
        {
          title: 'Solar Cold Chamber Assembly',
          description: '3.5 kW solar PV + DC compressor integration.',
          dueDate: new Date('2026-10-25'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-sih/agricool-pilot-video',
          completedAt: new Date('2026-10-24'),
        },
        {
          title: 'Farmer Co-op Field Trial',
          description: '30-day spoilage tracking with 45 farmers.',
          dueDate: new Date('2026-11-20'),
          status: 'completed',
          deliverableUrl: 'https://github.com/lpu-sih/agricool-field-audit',
          completedAt: new Date('2026-11-19'),
        },
      ],
    },
  ]);

  await Partnership.insertMany([
    {
      challengeId: ch1._id,
      proposalId: prop1._id,
      industryId: industryTata._id,
      collaborationType: 'funding',
      title: 'Tata Steel CSR Safe Drinking Water Grant',
      commitmentDetails:
        'CSR grant covering bio-char cartridge fabrication and Jamshedpur water quality lab testing.',
      fundingAmount: 350000,
      status: 'accepted',
    },
    {
      challengeId: ch2._id,
      proposalId: prop2._id,
      industryId: industryTata._id,
      collaborationType: 'field_deployment',
      title: 'Cold-Chain Pilot Deployment & Agri Mentorship',
      commitmentDetails:
        'Co-funding solar compressor hardware plus 30 hours of cold-chain engineering mentorship.',
      fundingAmount: 450000,
      status: 'accepted',
    },
    {
      challengeId: ch4._id,
      industryId: industryTata._id,
      collaborationType: 'mentorship',
      title: 'Medical Device QA & Anganwadi Rollout Support',
      commitmentDetails: 'Completed clinical QA mentoring and CSR pilot funding across Hazaribagh.',
      fundingAmount: 280000,
      status: 'completed',
    },
  ]);

  await ActivityLog.insertMany([
    {
      challengeId: ch1._id,
      actorId: citizenRamesh._id,
      actorName: citizenRamesh.name,
      actorRole: 'citizen',
      action: 'submitted',
      fromStatus: '',
      toStatus: 'submitted',
      remarks: 'Submitted by Ramesh Mahato in Ranchi (sanitation).',
    },
    {
      challengeId: ch1._id,
      actorId: adminNodal._id,
      actorName: adminNodal.name,
      actorRole: 'admin',
      action: 'routed_to_university',
      fromStatus: 'validated',
      toStatus: 'routed',
      remarks: 'Routed to BIT Mesra, Ranchi.',
    },
    {
      challengeId: ch1._id,
      actorId: univBitMesra._id,
      actorName: univBitMesra.name,
      actorRole: 'university',
      action: 'proposal_submitted',
      fromStatus: 'routed',
      toStatus: 'in_progress',
      remarks: 'BIT Jal-Rakshak Squad formed with 3 milestones.',
    },
    {
      challengeId: ch7._id,
      actorId: citizenRamesh._id,
      actorName: citizenRamesh.name,
      actorRole: 'citizen',
      action: 'submitted',
      fromStatus: '',
      toStatus: 'submitted',
      remarks: 'Submitted at Harmu Nadi Culvert, Ranchi.',
    },
    {
      challengeId: ch8._id,
      actorId: citizenRamesh._id,
      actorName: citizenRamesh.name,
      actorRole: 'citizen',
      action: 'submitted',
      fromStatus: '',
      toStatus: 'submitted',
      remarks: 'Submitted near Harmu Chowk Market (~850m from Harmu Nadi Culvert).',
    },
  ]);

  await Notification.insertMany([
    {
      recipientId: adminNodal._id,
      title: '2 Pending Harmu Reports Within 2km',
      message:
        'Two sanitation challenges near Harmu, Ranchi are within 850m. Run 2km Duplicate Check.',
      relatedChallengeId: ch8._id,
    },
    {
      recipientId: univLpu._id,
      title: 'New Challenge Routed: Jharia Coalfield PM2.5',
      message: 'Jharia Coalfield PM2.5 & Methane Micro-Sensor Grid awaits your R&D team.',
      relatedChallengeId: ch3._id,
    },
    {
      recipientId: citizenRamesh._id,
      title: 'Milestone 1 Completed on Kanke Handpump Project',
      message: 'BIT Mesra completed Baseline Hydro-Chemical Assay.',
      relatedChallengeId: ch1._id,
    },
    {
      recipientId: industryTata._id,
      title: 'New Validated Challenges in Jamshedpur & Bokaro',
      message: 'Dalma Elephant Corridor & Bokaro STEM Kits are open for CSR collaboration.',
      relatedChallengeId: ch5._id,
    },
  ]);
};

const ensureSeeded = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('Empty database detected. Running idempotent SIH26043 seed...');
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
  console.log('Manual SIH26043 seed completed! Password for all demo accounts: Password@123');
  process.exit(0);
};

if (require.main === module) {
  seedData().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { seedData, ensureSeeded };
