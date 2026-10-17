// Service taxonomy: groups, children, nav labels and which 3D model
// illustrates each page. Slugs match the original firestonefs.com URLs.

export const MENU = [
  { slug: 'fire-and-safety', label: 'Fire protection services', blurb: 'Advanced fire safety systems for complete protection.', model: 'tower' },
  { slug: 'gas-system', label: 'Gas system', blurb: 'Safe, reliable gas from design to installation and maintenance.', model: 'lpg' },
  { slug: 'fire-sealant-and-fire-stopping', label: 'Fire sealant & fire stopping', blurb: 'Certified sealing that stops fire and smoke spreading.', model: 'sealant' },
  { slug: 'smoke-management-systems', label: 'Smoke management', blurb: 'Smoke control systems for safe, compliant buildings.', model: 'fan' },
  { slug: 'emergency-evacuation-plan', label: 'Evacuation plan', blurb: 'Engineered for emergencies.', model: 'plan' },
  { slug: 'security-and-elv-systems', label: 'Security & ELV', blurb: 'CCTV, access control and structured cabling.', model: 'cctv' },
  { slug: 'civil-defense-compliance', label: 'Civil Defence compliance', blurb: 'Full compliance with Civil Defence codes and standards.', model: 'clipboard' },
  { slug: 'fire-alarm', label: 'Fire alarm', blurb: 'Design, supply, installation and AMC of fire alarm systems.', model: 'detector' },
  { slug: 'annual-maintenance-contract-abu-dhabi', label: 'AMC Abu Dhabi', blurb: 'Annual maintenance for every fire system in Abu Dhabi.', model: 'tower' },
  { slug: 'fire-amc-dubai', label: 'AMC Dubai', blurb: 'Annual maintenance for every fire system in Dubai.', model: 'tower' },
  { slug: 'fire-amc-sharjah', label: 'AMC Sharjah', blurb: 'Annual maintenance for every fire system in Sharjah.', model: 'tower' },
];

// Hubs and their child pages (order = display order)
export const HUBS = {
  'fire-and-safety': ['fire-alarm', 'fire-fighting-system', 'fire-suppression-system', 'fire-protection-products', 'fire-safety-services'],
  'fire-alarm': ['vesda-system', 'beam-detector', 'flame-detector', 'linear-heat-detection', 'public-address-system-and-voice-evacuation-system'],
  'fire-fighting-system': ['sprinkler-system', 'wet-riser-system', 'fire-hydrant-system', 'fire-hose-reel-system', 'fire-pump-system', 'deluge-system', 'foam-suppression-system', 'hdpe-piping-system'],
  'fire-suppression-system': ['fm200-system', 'novec-1230', 'kitchenhood-fire-suppression-system', 'clean-agent-suppression-system', 'fire-damper'],
  'fire-protection-products': ['fire-extinguisher', 'fire-rated-door', 'emergency-lighting-exit-sign', 'central-battery-system'],
  'fire-safety-services': ['fire-risk-assessment', 'civil-defense-compliance', 'emergency-evacuation-plan', 'annual-maintenance-contract-abu-dhabi'],
  'gas-system': ['lpg-gas-systems', 'central-gas-system', 'gas-leakage-detection-system', 'gas-maintenance'],
  'fire-sealant-and-fire-stopping': ['fire-sealant'],
  'smoke-management-systems': ['staircase-pressurization-fan', 'kitchen-ventilation-system', 'fire-damper'],
  'security-and-elv-systems': ['elv-system', 'cctv-camera-installation', 'access-control-system', 'time-attendance-system', 'gate-barrier-system', 'burglar-alarm-system', 'video-intercom-system', 'anpr-system', 'structured-cabling', 'it-solutions'],
  'civil-defense-compliance': ['istifa-certificate-uae', 'fire-risk-assessment', 'emergency-evacuation-plan'],
};

// Primary parent for breadcrumbs
export const PARENT = {};
for (const [hub, kids] of Object.entries(HUBS)) for (const k of kids) if (!PARENT[k]) PARENT[k] = hub;
PARENT['fire-amc-dubai'] = 'fire-safety-services';
PARENT['fire-amc-sharjah'] = 'fire-safety-services';
delete PARENT['civil-defense-compliance'];
delete PARENT['fire-alarm'];
PARENT['fire-alarm'] = 'fire-and-safety';

// Short labels used on cards / breadcrumbs
export const LABEL = {
  'fire-and-safety': 'Fire protection services',
  'fire-alarm': 'Fire alarm',
  'fire-fighting-system': 'Fire fighting systems',
  'fire-suppression-system': 'Fire suppression',
  'fire-protection-products': 'Fire protection products',
  'fire-safety-services': 'Fire safety services',
  'vesda-system': 'VESDA system',
  'beam-detector': 'Beam detector',
  'flame-detector': 'Flame detector',
  'linear-heat-detection': 'Linear heat detection',
  'public-address-system-and-voice-evacuation-system': 'PA & voice evacuation',
  'sprinkler-system': 'Sprinkler system',
  'wet-riser-system': 'Wet riser system',
  'fire-hydrant-system': 'Fire hydrant system',
  'fire-hose-reel-system': 'Fire hose reel',
  'fire-pump-system': 'Fire pump system',
  'deluge-system': 'Deluge system',
  'foam-suppression-system': 'Foam suppression',
  'hdpe-piping-system': 'HDPE piping',
  'fm200-system': 'FM200 system',
  'novec-1230': 'Novec 1230',
  'kitchenhood-fire-suppression-system': 'Kitchen hood suppression',
  'clean-agent-suppression-system': 'Clean agent suppression',
  'fire-damper': 'Fire damper',
  'fire-extinguisher': 'Fire extinguishers',
  'fire-rated-door': 'Fire rated doors',
  'emergency-lighting-exit-sign': 'Emergency lighting & exit signs',
  'central-battery-system': 'Central battery system',
  'fire-risk-assessment': 'Fire risk assessment',
  'civil-defense-compliance': 'Civil Defence compliance',
  'emergency-evacuation-plan': 'Evacuation plan',
  'annual-maintenance-contract-abu-dhabi': 'AMC Abu Dhabi',
  'fire-amc-dubai': 'AMC Dubai',
  'fire-amc-sharjah': 'AMC Sharjah',
  'istifa-certificate-uae': 'Istifa certificate',
  'gas-system': 'Gas system',
  'lpg-gas-systems': 'LPG gas systems',
  'central-gas-system': 'Central gas system',
  'gas-leakage-detection-system': 'Gas leak detection',
  'gas-maintenance': 'Gas maintenance & AMC',
  'fire-sealant-and-fire-stopping': 'Fire sealant & fire stopping',
  'fire-sealant': 'Fire sealant',
  'smoke-management-systems': 'Smoke management',
  'staircase-pressurization-fan': 'Staircase pressurization',
  'kitchen-ventilation-system': 'Kitchen ventilation',
  'security-and-elv-systems': 'Security & ELV',
  'elv-system': 'ELV system',
  'cctv-camera-installation': 'CCTV cameras',
  'access-control-system': 'Access control',
  'time-attendance-system': 'Time attendance',
  'gate-barrier-system': 'Gate barrier',
  'burglar-alarm-system': 'Burglar alarm',
  'video-intercom-system': 'Video intercom',
  'anpr-system': 'ANPR system',
  'structured-cabling': 'Structured cabling',
  'it-solutions': 'IT solutions',
  'fire-safety-emergency-support': 'Emergency support',
  'clients-and-projects': 'Clients & projects',
};

// 3D model per service
const M = {
  tower: ['fire-and-safety', 'fire-safety-services', 'annual-maintenance-contract-abu-dhabi', 'fire-amc-dubai', 'fire-amc-sharjah', 'clients-and-projects'],
  detector: ['fire-alarm', 'vesda-system', 'beam-detector', 'flame-detector', 'linear-heat-detection', 'public-address-system-and-voice-evacuation-system'],
  sprinkler: ['fire-fighting-system', 'sprinkler-system', 'deluge-system', 'wet-riser-system', 'hdpe-piping-system', 'foam-suppression-system'],
  hydrant: ['fire-hydrant-system', 'fire-hose-reel-system', 'fire-pump-system'],
  cylinders: ['fire-suppression-system', 'fm200-system', 'novec-1230', 'clean-agent-suppression-system', 'kitchenhood-fire-suppression-system'],
  extinguisher: ['fire-protection-products', 'fire-extinguisher'],
  door: ['fire-rated-door', 'fire-damper'],
  exitsign: ['emergency-lighting-exit-sign', 'central-battery-system'],
  plan: ['emergency-evacuation-plan'],
  lpg: ['gas-system', 'lpg-gas-systems', 'central-gas-system', 'gas-leakage-detection-system', 'gas-maintenance'],
  sealant: ['fire-sealant-and-fire-stopping', 'fire-sealant'],
  fan: ['smoke-management-systems', 'staircase-pressurization-fan', 'kitchen-ventilation-system'],
  cctv: ['security-and-elv-systems', 'cctv-camera-installation', 'burglar-alarm-system', 'anpr-system', 'video-intercom-system'],
  barrier: ['gate-barrier-system', 'access-control-system', 'time-attendance-system'],
  rack: ['elv-system', 'structured-cabling', 'it-solutions'],
  clipboard: ['civil-defense-compliance', 'istifa-certificate-uae', 'fire-risk-assessment'],
  beacon: ['fire-safety-emergency-support'],
};
// FAMILY: the broad equipment family of each page (used for annotations)
export const FAMILY = {};
for (const [m, list] of Object.entries(M)) for (const s of list) FAMILY[s] = m;
// MODEL: every page has its own registry entry (public/js/registry.js), keyed by slug
export const MODEL = new Proxy({}, { get: (_, k) => (typeof k === 'string' ? k : undefined) });

// Families of distinct models, used so tiles in one grid never repeat a drawing
export const FAMILIES = {
  alarm: ['fire-alarm', 'detector', 'beam-detector', 'flame-detector', 'linear-heat-detection', 'vesda-system', 'public-address-system-and-voice-evacuation-system', 'fire-security'],
  sprinkler: ['sprinkler-system', 'deluge-system', 'fire-fighting-system', 'wet-riser-system', 'foam-suppression-system', 'hdpe-piping-system'],
  hydrant: ['fire-hydrant-system', 'fire-hose-reel-system', 'fire-pump-system'],
  suppression: ['fm200-system', 'novec-1230', 'clean-agent-suppression-system', 'kitchenhood-fire-suppression-system', 'fire-suppression-system'],
  extinguisher: ['fire-extinguisher', 'fire-protection-products'],
  door: ['fire-rated-door', 'fire-damper'],
  exit: ['emergency-lighting-exit-sign', 'central-battery-system'],
  gas: ['gas-system', 'lpg-gas-systems', 'central-gas-system', 'gas-leakage-detection-system', 'gas-maintenance'],
  seal: ['fire-sealant-and-fire-stopping', 'fire-sealant'],
  fan: ['smoke-management-systems', 'staircase-pressurization-fan', 'kitchen-ventilation-system'],
  cctv: ['cctv-camera-installation', 'security-and-elv-systems', 'anpr-system', 'video-intercom-system', 'burglar-alarm-system'],
  access: ['access-control-system', 'time-attendance-system', 'gate-barrier-system'],
  network: ['structured-cabling', 'it-solutions', 'elv-system', 'rack'],
  compliance: ['istifa-certificate-uae', 'civil-defense-compliance', 'fire-risk-assessment', 'fire-safety-services', 'emergency-evacuation-plan'],
};

// Blog posts: a distinct drawing per article; new articles pick by keyword
export const BLOG_MODELS = {
  'fire-safety-maintenance-why-regular-inspection-and-testing-matter': 'fire-safety-services',
  'how-integrated-gas-security-and-safety-systems-are-changing-modern-buildings': 'elv-system',
  'the-non-negotiables-what-to-demand-from-a-fire-safety-contractor-in-the-uae': 'istifa-certificate-uae',
  'why-routine-fire-safety-maintenance-prevents-failures': 'sprinkler-system',
  'warehouse-fire-risk-assessment-a-strategic-approach-to-fire-safety-and-business-continuity': 'fire-risk-assessment',
  'fire-protection-is-a-business-continuity-strategy-protecting-operations-beyond-compliance': 'skyline',
  'summer-fire-risk-uae-commercial-properties': 'flame-detector',
  'fire-safety-compliance-uae-portfolios': 'civil-defense-compliance',
  'elv-systems-building-smarter-safer-and-more-connected-environments': 'rack',
  'smoke-management-ventilation-systems-creating-safer-smarter-buildings-in-the-uae': 'staircase-pressurization-fan',
  'the-most-common-causes-of-fire': 'kitchenhood-fire-suppression-system',
  'the-vital-security-measure-is-fire-safety': 'fire-and-safety',
  'why-is-the-fire-alarm-system-important': 'fire-alarm',
  'fire-safety-solutions': 'fire-protection-products',
  'the-importance-of-fire-extinguisher-maintenance': 'fire-extinguisher',
};
const KEYWORDS = [
  [/cctv|camera|surveillance/i, 'cctv'], [/access control|biometric|attendance|barrier/i, 'access'], [/\belv\b|network|cabling|\bIT (solutions|systems|support)\b/i, 'network'],
  [/smoke|ventilat|pressuri/i, 'fan'], [/gas|lpg/i, 'gas'], [/alarm|detect|vesda/i, 'alarm'], [/sprinkler|riser|pump|hydrant/i, 'sprinkler'],
  [/fm ?200|novec|suppression|kitchen/i, 'suppression'], [/extinguisher|blanket/i, 'extinguisher'], [/seal|stopping|compartment/i, 'seal'],
  [/door|damper/i, 'door'], [/exit sign|emergency light|battery/i, 'exit'], [/compliance|istifa|certificate|inspection|audit|civil defen|maintenance|\bamc\b/i, 'compliance'],
];
export function blogModel(slug = '', text = '', used = new Set()) {
  if (BLOG_MODELS[slug]) return BLOG_MODELS[slug];
  for (const [re, fam] of KEYWORDS) if (re.test(text)) { const pick = FAMILIES[fam].find((k) => !used.has(k)); if (pick) return pick; }
  return '';
}

// Annotation words ("redlines") shown beside each model in heroes
export const NOTES = {
  tower: ['ADCD · DCD · SCD', 'single point of contact'],
  detector: ['NFPA 72', 'addressable / conventional'],
  sprinkler: ['NFPA 13', 'heat-activated heads'],
  hydrant: ['NFPA 14 / 20', 'ready on arrival'],
  cylinders: ['clean agent', 'no residue'],
  extinguisher: ['tagged & tested', 'refill · service'],
  door: ['fire rated', 'self-closing'],
  exitsign: ['3 hr backup', 'photoluminescent'],
  plan: ['you are here', 'two ways out'],
  lpg: ['DOE approved', 'leak-tested'],
  sealant: ['FCIA certified', 'compartmentation'],
  fan: ['smoke extract', 'pressurised stairs'],
  cctv: ['SIRA approved', 'ADMCC AMC'],
  barrier: ['ANPR · RFID', 'access logged'],
  rack: ['Cat6 / fibre', 'tested & labelled'],
  clipboard: ['Istifa ready', 'inspection passed'],
  beacon: ['24 / 7', 'call · WhatsApp'],
};
