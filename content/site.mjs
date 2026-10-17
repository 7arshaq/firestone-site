// Hand-written copy for the custom pages. Service, blog and job pages come
// from content/pages/*.json (imported from the original site).

export const STATS = [
  { n: 1200, suffix: '+', label: 'AMC contracts' },
  { n: 2500, suffix: '+', label: 'Projects completed' },
  { n: 3600, suffix: '+', label: 'Happy clients' },
  { n: 2007, suffix: '', label: 'Operating since', raw: true },
];

export const APPROVALS = ['ADCD', 'DCD', 'SCD', 'DOE', 'ADMCC', 'AACD', 'SIRA'];

export const CLIENTS = [
  { file: 'vps-healthcare.png', name: 'VPS Healthcare' },
  { file: 'ministry-of-finance.png', name: 'UAE Ministry of Finance' },
  { file: 'rabdan-academy.png', name: 'Rabdan Academy' },
  { file: 'adveti.png', name: 'Abu Dhabi Vocational Education and Training Institute (ADVETI)' },
  { file: 'lulu.png', name: 'LuLu Group' },
  { file: 'medeor.png', name: 'Medeor Hospital' },
  { file: 'llh-hospital.png', name: 'LLH Hospital' },
];

export const JOURNEY = [
  {
    label: 'Drawn in-house', title: 'Design & approvals',
    text: 'Our engineers prepare the AutoCAD shop drawings and handle the Civil Defence submissions themselves — ADCD, DCD, SCD and SIRA — before a single pipe is cut.',
    chips: ['Shop drawings', 'Civil Defence approval'], href: '/services/civil-defense-compliance', cta: 'Compliance services',
  },
  {
    label: 'Built to code', title: 'Supply & installation',
    text: 'Sprinklers, hydrants, hose reels, fire alarm, FM200 and gas suppression — installed by certified technicians in offices, warehouses, hospitals, hotels, schools and homes.',
    chips: ['NFPA', 'Grade A approved'], href: '/services/fire-and-safety', cta: 'Fire protection services',
  },
  {
    label: 'Proven before handover', title: 'Testing & commissioning',
    text: 'Every system is tested and commissioned before handover — detectors triggered, heads and pumps checked, cause and effect verified — then certified with the authority.',
    chips: ['Cause & effect', 'Certification'], href: '/services/fire-alarm', cta: 'Fire alarm systems',
  },
  {
    label: 'Always on', title: 'AMC & 24/7 support',
    text: 'Annual Maintenance Contracts keep 1,200+ buildings inspection-ready all year, with planned visits every quarter and a phone that is answered at any hour.',
    chips: ['Quarterly PPM', '24/7 response'], href: '/services/fire-safety-emergency-support', cta: 'Emergency support',
  },
];

export const HOME_SERVICES = [
  { slug: 'fire-and-safety', title: 'Fire protection services', model: 'tower', text: 'Fire alarm, smoke detection, fire fighting, sprinkler and FM200 systems — from AutoCAD shop drawing to testing, commissioning and AMC.' },
  { slug: 'gas-system', title: 'Gas system', model: 'lpg', text: 'LPG and central gas design, supply, installation and AMC. DOE approved and fully compliant with UAE Civil Defence regulations.' },
  { slug: 'security-and-elv-systems', title: 'Security & ELV systems', model: 'cctv', text: 'CCTV, access control, gate barriers and video intercom. SIRA and MCC approved, including ADMCC approved CCTV AMC.' },
  { slug: 'fire-sealant-and-fire-stopping', title: 'Fire sealant & fire stopping', model: 'sealant', text: 'Firestop sealants, sprays and intumescent coatings. FCIA certified, DOE approved penetration sealing for walls, floors and joints.' },
  { slug: 'smoke-management-systems', title: 'Smoke management system', model: 'fan', text: 'DOE approved smoke management, smoke ventilation and exhaust systems for commercial, industrial and residential buildings.' },
  { slug: 'civil-defense-compliance', title: 'Civil Defence compliance', model: 'clipboard', text: 'ADCD fitness certificates, Istifa, DCD and SCD renewals, inspections, documentation and evacuation plan submissions.' },
];

export const HOME_FAQ = [
  ['What does a fire and safety company do?', 'A fire and safety company designs, installs, tests and maintains the systems that control fire and keep people safe in a building. In the UAE it also prepares Civil Defence drawings and arranges approvals and certificates. Firestone, a Civil Defence approved fire company operating since 2007, handles each step in-house for commercial, industrial, residential, hospitality and healthcare buildings.'],
  ['How do I choose a fire safety company in the UAE?', 'Choose a company that holds Civil Defence approval for your emirate, prepares drawings and approvals in-house, tests and commissions every installation before handover, and offers ongoing maintenance with a 24/7 emergency contact. Ask to see completed projects similar to yours, and ask for an itemised quote so you can compare like with like.'],
  ['How much does it cost to hire a fire and safety company in the UAE?', 'It depends on the size and type of the building, the systems involved, the authority’s requirements, and whether you also need drawings, approvals and ongoing maintenance. Firestone gives an itemised quote after a site survey, so you know the full cost before work starts — and we can adjust the scope to fit your budget. For maintenance, see our <a href="/services/annual-maintenance-contract-abu-dhabi">Abu Dhabi</a>, <a href="/services/fire-amc-dubai">Dubai</a> and <a href="/services/fire-amc-sharjah">Sharjah</a> contract pages.'],
  ['Is Firestone a fire fighting company in the UAE?', 'Yes. Firestone is a Civil Defence approved fire fighting company. We design, supply, install, test and maintain <a href="/services/fire-and-safety">fire fighting and sprinkler systems</a>, including hydrants and hose reels, in Abu Dhabi, Dubai, Sharjah and Al Ain — and handle the drawings, approvals and certification.'],
  ['What is the difference between a fire fighting company and a fire and safety company?', 'A fire fighting company focuses on the systems that put fire out, such as sprinklers, hydrants and hose reels. A fire and safety company covers more: Civil Defence compliance, evacuation plans, fire sealing, smoke management and ongoing maintenance. Firestone does both, so one team can handle the whole project.'],
  ['Why use one company for fire safety and security systems?', 'Fire safety and security work often happens in the same building and goes through the same approval process. One company means one set of Civil Defence drawings, one installation schedule and one point of contact. Firestone delivers both, including <a href="/services/security-and-elv-systems">CCTV, access control and ELV systems</a>.'],
  ['Which Civil Defence authority approves fire companies in each emirate?', 'ADCD approves projects in Abu Dhabi and Al Ain, DCD in Dubai and SCD in Sharjah. Ask a company for its Civil Defence licence and approval certificate and check it covers your site’s authority. Firestone is Grade A approved with ADCD, DCD and SCD.'],
  ['Can one company handle a multi-site project across several emirates?', 'Yes, if it is approved with each emirate’s Civil Defence authority. Firestone holds ADCD, DCD and SCD approvals, so we manage drawings, installation and certificates for sites in Abu Dhabi, Al Ain, Dubai and Sharjah with one point of contact and one set of records for renewals.'],
  ['Does Firestone offer 24/7 emergency support?', 'Yes. Firestone provides 24/7 emergency support for fire and safety systems across Abu Dhabi, Al Ain, Dubai and Sharjah. Call <a href="tel:+971506761638">+971 50 676 1638</a> or visit the <a href="/services/fire-safety-emergency-support">emergency support page</a>.'],
];

export const TESTIMONIALS = [
  { quote: 'Outstanding service provided by dedicated experts. I highly recommend Firestone Fire and safety company.', name: 'Musavir Bin Khalifa AlKahyoom', place: 'Abu Dhabi, UAE' },
  { quote: 'The team’s expertise in fire protection is unmatched. Truly professionals at work!', name: 'Shan Rahman PK', place: 'Dubai, UAE' },
];

export const PROJECTS = [
  { name: 'Al Bateen Airport', place: 'Abu Dhabi', status: 'Completed 2025', model: 'project:airport' },
  { name: 'UAE Accountability Authority building', place: 'Abu Dhabi', status: 'Completed 2023', model: 'project:civic' },
  { name: 'Red Planet freeze-dried plant', place: 'Abu Dhabi', status: 'Completed 2025', model: 'project:factory' },
  { name: 'Bosco Trading Co.', place: 'Abu Dhabi', status: 'Ongoing', model: 'project:warehouse' },
  { name: 'Qasr Al Jurf sales center', place: 'Abu Dhabi', status: 'Ongoing', model: 'project:pavilion' },
  { name: 'ADAFSA fodder centers', place: '54 locations, Abu Dhabi', status: 'Ongoing', model: 'project:sheds' },
  { name: 'Al Jazeera main hotel', place: 'Ghantoot', status: 'Completed 2025', model: 'project:hotel' },
  { name: 'National Ambulance warehouse', place: 'KIZAD', status: 'Completed 2019', model: 'project:ambulance' },
  { name: 'DHL Express logistics center', place: 'Dubai', status: 'Completed 2024', model: 'project:logistics' },
  { name: 'Khalifa University campus', place: 'Abu Dhabi', status: 'Completed 2025', model: 'project:campus' },
  { name: 'Presidential Court — Khalifa Park offices', place: 'Abu Dhabi', status: 'Completed 2024', model: 'project:court' },
  { name: 'Presidential Court offices', place: 'Al Ain', status: 'Completed 2026', model: 'project:arches' },
];

export const ABOUT = {
  core: [
    ['Fire fighting systems', 'Design, supply and installation of sprinkler systems, fire pumps, hose reels, FM200 and more.'],
    ['Fire alarm systems', 'Conventional, addressable and wireless alarm systems with full testing and servicing.'],
    ['Fire maintenance & AMC', 'Regular inspections, repairs and Annual Maintenance Contracts that keep systems ready.'],
    ['Emergency evacuation planning', 'Evacuation plans and photoluminescent signage that guide occupants to safety.'],
    ['Fire extinguisher services', 'Inspection, servicing and readiness checks for all portable fire fighting equipment.'],
    ['Fire sealant applications', 'Compartmentation that holds back fire and smoke for stronger building protection.'],
    ['Hassantuk integration', 'Set-up and maintenance of Civil Defence monitoring connectivity.'],
  ],
  why: [
    ['UAE-wide presence', 'Serving Dubai, Abu Dhabi, Al Ain, Sharjah and Ras Al Khaimah.'],
    ['Certified professionals', 'Approved by Dubai and Abu Dhabi Civil Defence.'],
    ['Complete solutions', 'Consultation to commissioning and maintenance, all under one roof.'],
    ['Client-focused', 'Custom, scalable, budget-friendly solutions without compromising safety or compliance.'],
  ],
};

export const SERVICES_APART = [
  ['Single point of responsibility', 'From initial system design through final Civil Defence certification, one dedicated team manages your project — no coordination gaps between contractors.'],
  ['In-house engineering', 'AutoCAD drafting, technical submissions and Civil Defence liaison are all handled internally, for faster turnaround and accountability at every step.'],
  ['Multi-emirate licensing', 'Active approvals across ADCD, DCD, SCD and SIRA let us take on projects spanning several emirates without subcontracting.'],
  ['Long-term maintenance partner', 'Annual Maintenance Contracts designed around your facility’s real usage and inspection cycles — not generic service intervals.'],
];

export const SERVICES_FAQ = [
  ['Which areas in the UAE does Firestone cover?', 'We operate across Abu Dhabi, Dubai, Sharjah and Al Ain, holding active approvals from ADCD, DCD, SCD and SIRA — so we handle multi-site projects without subcontracting.'],
  ['Do you handle both installation and ongoing maintenance?', 'Yes. We design, supply and install fire and safety systems, then support your facility through Annual Maintenance Contracts, Civil Defence inspections and Istifa renewals — so you’re not switching contractors between project phases.'],
  ['How long does a typical project take from design to certification?', 'It varies with system complexity and building size, but most standard commercial projects move from shop drawings through installation, testing and Civil Defence approval within a few weeks. Larger or multi-system projects are scoped individually.'],
  ['Can Firestone service a building with systems installed by another contractor?', 'Yes. We regularly take over maintenance and compliance for existing systems, starting with an assessment to confirm everything meets current Civil Defence standards before issuing an AMC.'],
  ['What happens if my facility fails a Civil Defence inspection?', 'We identify the deficiency, carry out the corrective work and resubmit documentation to ADCD, DCD or SCD to get your facility compliant again as quickly as possible.'],
  ['Do you provide emergency response outside business hours?', 'Yes. AMC clients get priority emergency call-outs for urgent fire system issues, in addition to scheduled maintenance visits.'],
];

export const EMERGENCY = {
  when: ['Fire alarm fault, or a false alarm that won’t stop', 'Fire suppression system fault', 'Fire pump failure', 'Gas leak alert', 'Sprinkler leak or burst pipe', 'Access control or security system failure'],
  steps: ['Call or WhatsApp', 'We assess by phone', 'Technician dispatched', 'Fault fixed on-site'],
};

export const QUOTE_SERVICES = [
  ['fire-and-safety', 'Fire protection'], ['fire-alarm', 'Fire alarm'], ['fire-fighting-system', 'Fire fighting / sprinklers'], ['fire-suppression-system', 'Fire suppression / FM200'],
  ['gas-system', 'Gas system'], ['security-and-elv-systems', 'Security & ELV / CCTV'], ['fire-sealant-and-fire-stopping', 'Fire sealant & stopping'], ['smoke-management-systems', 'Smoke management'],
  ['emergency-evacuation-plan', 'Evacuation plan'], ['civil-defense-compliance', 'Civil Defence / Istifa'], ['amc', 'Maintenance contract (AMC)'], ['fire-protection-products', 'Extinguishers & products'],
];
