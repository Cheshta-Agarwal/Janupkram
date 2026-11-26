export const CHALLENGE_CATEGORIES = [
  'agriculture',
  'healthcare',
  'sanitation',
  'education',
  'environment',
  'infrastructure',
  'other',
];

export const CATEGORY_LABELS = {
  agriculture: 'Agriculture',
  healthcare: 'Healthcare',
  sanitation: 'Sanitation',
  education: 'Education',
  environment: 'Environment',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

export const REGION_HUBS = [
  { name: 'Phagwara', label: 'Phagwara / LPU Belt', lat: 31.2554, lng: 75.7058 },
  { name: 'New Delhi', label: 'New Delhi / NCR', lat: 28.6139, lng: 77.209 },
  { name: 'Bengaluru', label: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Pune', label: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', label: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Jaipur', label: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Mumbai', label: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Chandigarh', label: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Chennai', label: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', label: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Lucknow', label: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Bhubaneswar', label: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
];

export const LIFECYCLE_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'validated', label: 'Validated' },
  { key: 'routed', label: 'Routed' },
  { key: 'team_formed', label: 'Team Formed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'piloted', label: 'Piloted' },
  { key: 'deployed', label: 'Deployed' },
];

export const ROLE_DASHBOARD_PATH = {
  citizen: '/citizen',
  admin: '/admin',
  university: '/university',
  industry: '/industry',
};

export const ROLE_LABELS = {
  citizen: 'Citizen / Community',
  admin: 'Nodal Moderator',
  university: 'University / LPU R&D',
  industry: 'Industry / CSR',
};

export const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
