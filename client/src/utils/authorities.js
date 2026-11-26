export const CONNECTED_REPORTING_PORTALS = [
  {
    name: 'CPGRAMS (Govt. of India)',
    badge: 'Central Grievance Portal',
    desc: '24/7 official Centralized Public Grievance Redress and Monitoring System across Central & State departments.',
    url: 'https://pgportal.gov.in/',
    handle: '@DARPG_GoI',
  },
  {
    name: 'Swachhata-MoHUA',
    badge: 'Urban Sanitation • Helpline 1969',
    desc: 'Official Ministry of Housing & Urban Affairs portal routing garbage, drainage & sewage complaints to municipal ward inspectors.',
    url: 'https://sbmurban.org/',
    handle: '@MoHUA_India',
  },
  {
    name: 'MyGov India',
    badge: 'Citizen Participation',
    desc: 'National citizen engagement platform for crowdsourced civic policy inputs and public service feedback.',
    url: 'https://www.mygov.in/',
    handle: '@mygovindia',
  },
  {
    name: 'Reddit Civic Communities',
    badge: 'Crowdsourced Discovery',
    desc: 'Real-time citizen reports across r/bangalore, r/delhi, r/pune, r/jaipur, and r/india imported with source links.',
    url: 'https://www.reddit.com/r/india/',
    handle: 'Reddit Feeds',
  },
  {
    name: 'X Public Grievance Grid',
    badge: 'Live Social Escalation',
    desc: 'Direct public escalation tagging official municipal commissioners, CPCB, and ministry handles.',
    url: 'https://x.com/MoHUA_India',
    handle: '@SwachhBharatGov',
  },
];

export const AUTHORITY_DIRECTORY = [
  {
    id: 'bbmp',
    authorityName: 'BBMP Chief Commissioner & BWSSB (Bengaluru)',
    authorityHandle: '@BBMPComm',
    department: 'Stormwater Drains, Waste & Civic Engineering',
    email: 'comm@bbmp.gov.in',
    portalUrl: 'https://pgportal.gov.in/',
    matchDistricts: ['Bengaluru'],
    matchCategories: ['sanitation', 'infrastructure'],
  },
  {
    id: 'mcd',
    authorityName: 'Municipal Corporation of Delhi (MCD)',
    authorityHandle: '@MCD_Delhi',
    department: 'Urban Sanitation, Dust & Civic Works',
    email: 'commissioner@mcd.nic.in',
    portalUrl: 'https://pgportal.gov.in/',
    matchDistricts: ['New Delhi'],
    matchCategories: ['sanitation', 'infrastructure', 'environment'],
  },
  {
    id: 'pmc',
    authorityName: 'Pune Municipal Corporation (PMC)',
    authorityHandle: '@PMCPune',
    department: 'Roads, Drainage & Smart City Works',
    email: 'pmcinfo@punecorporation.org',
    portalUrl: 'https://pgportal.gov.in/',
    matchDistricts: ['Pune'],
    matchCategories: ['infrastructure', 'sanitation'],
  },
  {
    id: 'cpcb',
    authorityName: 'Central Pollution Control Board (CPCB)',
    authorityHandle: '@CPCB_OFFICIAL',
    department: 'Air Quality (PM2.5/PM10) & Environmental Monitoring',
    email: 'ccb.cpcb@nic.in',
    portalUrl: 'https://cpcb.nic.in/',
    matchDistricts: [],
    matchCategories: ['environment'],
  },
  {
    id: 'mohua',
    authorityName: 'Ministry of Housing & Urban Affairs (Swachhata)',
    authorityHandle: '@MoHUA_India',
    department: 'Swachh Bharat Urban & Municipal Sanitation (Helpline 1969)',
    email: 'secyurban@nic.in',
    portalUrl: 'https://sbmurban.org/',
    matchDistricts: [],
    matchCategories: ['sanitation'],
  },
  {
    id: 'morth',
    authorityName: 'Ministry of Road Transport & Highways (MoRTH)',
    authorityHandle: '@MORTHIndia',
    department: 'National Highways, Arterial Roads & Road Safety',
    email: 'complaints-morth@gov.in',
    portalUrl: 'https://pgportal.gov.in/',
    matchDistricts: [],
    matchCategories: ['infrastructure'],
  },
  {
    id: 'cpgrams_general',
    authorityName: 'CPGRAMS Public Grievance Cell (DARPG)',
    authorityHandle: '@SwachhBharatGov',
    department: 'Centralized Public Grievance Redress & Monitoring System',
    email: 'cpgrams-darpg@nic.in',
    portalUrl: 'https://pgportal.gov.in/',
    matchDistricts: [],
    matchCategories: ['agriculture', 'healthcare', 'education', 'other'],
  },
];

export const getMatchedAuthority = (category, district) => {
  const exactCityAndCat = AUTHORITY_DIRECTORY.find(
    (a) =>
      a.matchDistricts.includes(district) &&
      (a.matchCategories.length === 0 || a.matchCategories.includes(category))
  );
  if (exactCityAndCat) return exactCityAndCat;

  const byCat = AUTHORITY_DIRECTORY.find((a) => a.matchCategories.includes(category));
  return byCat || AUTHORITY_DIRECTORY[AUTHORITY_DIRECTORY.length - 1];
};
