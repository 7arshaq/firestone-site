// Which 3D model illustrates which page. Keys are page slugs (so every
// service has its own drawing) plus a few page/project keys.
import { MODELS } from './models.js';
import * as F from './models-fire.js';
import * as M from './models-more.js';

const city = (n, s) => () => F.cityTower(n, s);
const proj = (t) => () => M.projectBuilding(t);

const R = {
  ...MODELS,
  // fire protection
  'fire-and-safety': MODELS.tower,
  'fire-alarm': F.alarmPanel,
  'vesda-system': F.vesda,
  'beam-detector': F.beam,
  'flame-detector': F.flameDetector,
  'linear-heat-detection': F.lhd,
  'public-address-system-and-voice-evacuation-system': F.paSystem,
  'fire-fighting-system': F.pipeNetwork,
  'sprinkler-system': MODELS.sprinkler,
  'wet-riser-system': F.wetRiser,
  'fire-hydrant-system': F.hydrantPillar,
  'fire-hose-reel-system': F.hoseReel,
  'fire-pump-system': F.pumpSet,
  'deluge-system': F.deluge,
  'foam-suppression-system': F.foam,
  'hdpe-piping-system': F.hdpe,
  'fire-suppression-system': MODELS.cylinders,
  'fm200-system': F.fm200,
  'novec-1230': F.novec,
  'kitchenhood-fire-suppression-system': F.kitchenHood,
  'clean-agent-suppression-system': F.cleanAgent,
  'fire-damper': F.damper,
  'fire-protection-products': F.productsTrio,
  'fire-extinguisher': MODELS.extinguisher,
  'fire-rated-door': MODELS.door,
  'emergency-lighting-exit-sign': MODELS.exitsign,
  'central-battery-system': F.batteryCabinet,
  'fire-safety-services': F.servicesKit,
  'fire-risk-assessment': F.riskAssessment,
  'civil-defense-compliance': MODELS.clipboard,
  'istifa-certificate-uae': F.certificate,
  'emergency-evacuation-plan': MODELS.plan,
  'annual-maintenance-contract-abu-dhabi': city('ABU DHABI', 'ad'),
  'fire-amc-dubai': city('DUBAI', 'dxb'),
  'fire-amc-sharjah': city('SHARJAH', 'shj'),
  // gas
  'gas-system': MODELS.lpg,
  'lpg-gas-systems': M.bulkTank,
  'central-gas-system': M.gasMeters,
  'gas-leakage-detection-system': M.gasDetector,
  'gas-maintenance': M.gasService,
  // passive + smoke
  'fire-sealant-and-fire-stopping': MODELS.sealant,
  'fire-sealant': M.caulkGun,
  'smoke-management-systems': MODELS.fan,
  'staircase-pressurization-fan': M.stairPressure,
  'kitchen-ventilation-system': M.kitchenVent,
  // security + ELV
  'security-and-elv-systems': MODELS.cctv,
  'elv-system': M.elvHub,
  'cctv-camera-installation': M.cctvMulti,
  'access-control-system': M.accessDoor,
  'time-attendance-system': M.biometric,
  'gate-barrier-system': MODELS.barrier,
  'burglar-alarm-system': M.burglar,
  'video-intercom-system': M.intercom,
  'anpr-system': M.anpr,
  'structured-cabling': M.patchPanel,
  'it-solutions': M.itDesk,
  // pages
  'fire-safety-emergency-support': MODELS.beacon,
  'clients-and-projects': M.skyline,
  hq: M.hq,
  hardhat: M.hardhat,
  skyline: M.skyline,
  'fire-security': M.fireSecurity,
  rack: MODELS.rack,
  // client projects — a different building for each
  'project:airport': proj('airport'),
  'project:civic': proj('civic'),
  'project:factory': proj('factory'),
  'project:warehouse': proj('warehouse'),
  'project:pavilion': proj('pavilion'),
  'project:sheds': proj('sheds'),
  'project:hotel': proj('hotel'),
  'project:ambulance': proj('ambulance'),
  'project:logistics': proj('logistics'),
  'project:campus': proj('campus'),
  'project:court': proj('court'),
  'project:arches': proj('arches'),
};

export function resolve(key = '') {
  return R[key] || MODELS.tower;
}
export const KEYS = Object.keys(R);
