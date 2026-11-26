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

export const JHARKHAND_DISTRICTS = [
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096 },
  { name: 'Dhanbad', lat: 23.7957, lng: 86.4304 },
  { name: 'Jamshedpur', lat: 22.8046, lng: 86.2029 },
  { name: 'Bokaro', lat: 23.6693, lng: 86.1511 },
  { name: 'Hazaribagh', lat: 23.9925, lng: 85.3637 },
  { name: 'Dumka', lat: 24.2685, lng: 87.2496 },
  { name: 'Giridih', lat: 24.1913, lng: 86.3005 },
  { name: 'Deoghar', lat: 24.4852, lng: 86.6948 },
  { name: 'Gumla', lat: 23.0442, lng: 84.5382 },
  { name: 'Khunti', lat: 23.0715, lng: 85.2788 },
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
  admin: 'Govt. Nodal Officer',
  university: 'University / R&D',
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
