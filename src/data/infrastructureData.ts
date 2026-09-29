export interface MayniladPipeline {
  id: string;
  code: string;
  name: string;
  roadName: string;
  category: 'TRANSMISSION' | 'DISTRIBUTION' | 'SEWERAGE';
  diameterMm: number;
  material: string;
  pressurePsi: number;
  depthMeters: number;
  status: 'ACTIVE' | 'MAINTENANCE';
  operationalAgency: 'Maynilad Water Services, Inc.';
  description: string;
  sourceSupply: string;
  path: [number, number][];
}

export interface DpwhCulvert {
  id: string;
  code: string;
  name: string;
  roadName: string;
  coordinates: [number, number];
  structureType: 'TWIN_RCBC' | 'SINGLE_RCBC' | 'QUAD_RCBC' | 'CONCRETE_PIPE' | 'OPEN_CANAL';
  dimensions: string;
  dpwhStandard: string;
  agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering';
  flowCapacityCms: number; // cubic meters per second
  dischargeOutfall: string;
  cleanlinessStatus: 'CLEAR' | 'PARTIAL_SILTATION' | 'MONITORED';
  description: string;
}

export interface CampusInfrastructure {
  name: string;
  shortName: string;
  coordinates: [number, number];
  address: string;
  strand: string;
  elevationM: number;
  waterSupply: {
    agency: string;
    pipelineConnection: string;
    pipeSizeMm: number;
    pipeMaterial: string;
    pressureNominalPsi: number;
  };
  drainage: {
    agency: string;
    culvertConnection: string;
    conduitSize: string;
    outfallBasin: string;
    floodRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  };
}

export const TALON_DOS_CAMPUS_DATA: CampusInfrastructure = {
  name: 'Las Piñas City National Senior High School - Talon Dos Campus',
  shortName: 'LPCNSHS Talon Dos Campus',
  coordinates: [14.43716, 120.97880],
  address: 'Carnival Park St., BF Resort Village, Talon Dos, Las Piñas City',
  strand: 'Science, Technology, Engineering, and Mathematics (STEM)',
  elevationM: 16.2,
  waterSupply: {
    agency: 'Maynilad Water Services, Inc. (West Zone)',
    pipelineConnection: 'Maynilad Carnival Park Street 200mm DIP Reticulation Line',
    pipeSizeMm: 200,
    pipeMaterial: 'Ductile Iron Pipe (DIP)',
    pressureNominalPsi: 18,
  },
  drainage: {
    agency: 'DPWH Las Piñas - Muntinlupa District Engineering Office / City Engineering',
    culvertConnection: 'DPWH Carnival Park St 1.2m × 1.2m Reinforced Concrete Box Culvert (RCBC)',
    conduitSize: '1.2m × 1.2m RCBC Box Culvert',
    outfallBasin: 'Tartar Creek Floodway & Zapote River Western Basin',
    floodRiskLevel: 'MODERATE',
  },
};

export const MAYNILAD_PIPELINES: MayniladPipeline[] = [
  {
    id: 'may-dist-carnival-park',
    code: 'MNL-D-200',
    name: 'Maynilad Talon Dos Campus & Carnival Park Distribution Line',
    roadName: 'Carnival Park Street (BF Resort)',
    category: 'DISTRIBUTION',
    diameterMm: 200,
    material: 'Ductile Iron Pipe (DIP)',
    pressurePsi: 18,
    depthMeters: 1.5,
    status: 'ACTIVE',
    operationalAgency: 'Maynilad Water Services, Inc.',
    description: 'Direct municipal distribution pipeline supplying Las Piñas City National Senior High School - Talon Dos Campus, community centers, and surrounding residential blocks along Carnival Park Street.',
    sourceSupply: 'BF Resort Booster Pumping Station / Magdiwang Reservoir Grid',
    path: [
      [14.43620, 120.98550],
      [14.43680, 120.98400],
      [14.43780, 120.98250],
      [14.43750, 120.98050],
      [14.43716, 120.97880],
      [14.43850, 120.97750],
    ],
  },
  {
    id: 'may-dist-bf-resort',
    code: 'MNL-D-300',
    name: 'Maynilad BF Resort Drive Primary Reticulation Trunk',
    roadName: 'BF Resort Drive',
    category: 'DISTRIBUTION',
    diameterMm: 300,
    material: 'High-Density Polyethylene (HDPE PN16)',
    pressurePsi: 22,
    depthMeters: 1.6,
    status: 'ACTIVE',
    operationalAgency: 'Maynilad Water Services, Inc.',
    description: 'Core potable distribution spine installed under the Maynilad BF Resort modernization project, serving the central and southern subdivisions of Talon Dos.',
    sourceSupply: 'Alabang-Zapote Transmission Header Feeder',
    path: [
      [14.43950, 120.98800],
      [14.43620, 120.98550],
      [14.43480, 120.99100],
      [14.43320, 120.99540],
      [14.42820, 120.99420],
    ],
  },
  {
    id: 'may-dist-tropical-ave',
    code: 'MNL-D-400',
    name: 'Maynilad Tropical Avenue Feeder Pipeline',
    roadName: 'Tropical Avenue (BF Resort)',
    category: 'DISTRIBUTION',
    diameterMm: 250,
    material: 'Ductile Iron Pipe (DIP)',
    pressurePsi: 24,
    depthMeters: 1.6,
    status: 'ACTIVE',
    operationalAgency: 'Maynilad Water Services, Inc.',
    description: 'Arterial pipeline connecting the Tropical Avenue corridor to residential subdivisions and school zones across central Talon Dos.',
    sourceSupply: 'BF Resort Booster Pumping Station',
    path: [
      [14.44280, 120.98900],
      [14.43950, 120.98800],
      [14.43780, 120.98250],
      [14.43350, 120.98600],
      [14.43150, 120.99300],
    ],
  },
  {
    id: 'may-sewer-tartar-creek',
    code: 'MNL-S-375',
    name: 'Maynilad Las Piñas Package 1A Sewerage Interceptor',
    roadName: 'Tartar Creek Floodway Easement',
    category: 'SEWERAGE',
    diameterMm: 375,
    material: 'Reinforced Concrete Sewer Pipe (RCSP) & HDPE',
    pressurePsi: 0, // Gravity sewer
    depthMeters: 2.8,
    status: 'ACTIVE',
    operationalAgency: 'Maynilad Water Services, Inc.',
    description: 'Sanitary wastewater interceptor running along the Tartar Creek easement, conveying household wastewater to the Las Piñas Water Reclamation Facility.',
    sourceSupply: 'Talon Dos Catchment to Las Piñas Water Reclamation Facility',
    path: [
      [14.43350, 120.98600],
      [14.43550, 120.98150],
      [14.43716, 120.97880],
      [14.43850, 120.97750],
      [14.44100, 120.97600],
      [14.44300, 120.97300],
    ],
  },
  {
    id: 'may-transmission-west-corridor',
    code: 'MNL-T-900',
    name: 'Maynilad Putatan Regional Transmission Main (West Talon Dos Segment)',
    roadName: 'West Perimeter Highway Corridor',
    category: 'TRANSMISSION',
    diameterMm: 900,
    material: 'Welded Steel Pipe (WSP) w/ Mortar Lining',
    pressurePsi: 65,
    depthMeters: 2.2,
    status: 'ACTIVE',
    operationalAgency: 'Maynilad Water Services, Inc.',
    description: 'Regional bulk water transmission line conveying potable water from Putatan Water Treatment Plants through the western Talon Dos corridor.',
    sourceSupply: 'Putatan WTP 1 & 2 / Laguna Lake Source',
    path: [
      [14.44300, 120.97300],
      [14.44100, 120.97600],
      [14.43850, 120.97750],
      [14.43680, 120.99120],
      [14.43320, 120.99540],
    ],
  },
];

export const DPWH_CULVERTS: DpwhCulvert[] = [
  {
    id: 'dpwh-c01-campus',
    code: 'DPWH-C01',
    name: 'Talon Dos Campus Frontage Cross-Drain Box Culvert',
    roadName: 'Carnival Park Street',
    coordinates: [14.43716, 120.97880],
    structureType: 'SINGLE_RCBC',
    dimensions: '1.2m × 1.2m Precast RCBC',
    dpwhStandard: 'DPWH Standard Plans for Highways & Cross Drainage (Vol. II)',
    agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering',
    flowCapacityCms: 4.8,
    dischargeOutfall: 'Tartar Creek Western Collector Canal',
    cleanlinessStatus: 'CLEAR',
    description: 'Roadside stormwater cross-drain directly receiving school yard surface water and Carnival Park Street drainage, conveying it into the Tartar Creek system.',
  },
  {
    id: 'dpwh-c02-tartar-creek',
    code: 'DPWH-C02',
    name: 'Tartar Creek Flood Mitigation Siphon & Box Culvert',
    roadName: 'Tartar Creek / Carnival Park Junction',
    coordinates: [14.43850, 120.97750],
    structureType: 'TWIN_RCBC',
    dimensions: '3.0m × 2.0m Twin RCBC Siphon',
    dpwhStandard: 'DPWH ₱101.9M Tartar Creek Flood Control Project',
    agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering',
    flowCapacityCms: 18.5,
    dischargeOutfall: 'Zapote River Western Floodway',
    cleanlinessStatus: 'MONITORED',
    description: 'Major stormwater conduit under DPWH flood mitigation, providing drainage for central BF Resort subdivisions and preventing backflow flooding into Talon Dos campus area.',
  },
  {
    id: 'dpwh-c03-zapote-bridge',
    code: 'DPWH-C03',
    name: 'Zapote River Basin Western Outfall Bridge Culvert',
    roadName: 'Zapote River Buffer / West Perimeter',
    coordinates: [14.43680, 120.99120],
    structureType: 'QUAD_RCBC',
    dimensions: '3.0m × 2.2m Quad-Barrel RCBC Sluice',
    dpwhStandard: 'DPWH National Arterial Highway Drainage Standard',
    agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering',
    flowCapacityCms: 32.0,
    dischargeOutfall: 'Zapote River Natural Riverbed',
    cleanlinessStatus: 'CLEAR',
    description: 'High-capacity regional drainage bridge sluice evacuating runoff from BF Resort and central Talon Dos commercial district into the river.',
  },
  {
    id: 'dpwh-c04-carnival-tropical',
    code: 'DPWH-C04',
    name: 'Carnival Park St // Tropical Avenue Confluence Box Culvert',
    roadName: 'Carnival Park St & Tropical Avenue',
    coordinates: [14.43780, 120.98250],
    structureType: 'TWIN_RCBC',
    dimensions: '1.8m × 1.5m Reinforced Box Culvert',
    dpwhStandard: 'DPWH Municipal Cross-Drainage Specification',
    agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering',
    flowCapacityCms: 8.2,
    dischargeOutfall: 'Tartar Creek Central Drainage Corridor',
    cleanlinessStatus: 'PARTIAL_SILTATION',
    description: 'Key junction box culvert connecting Carnival Park storm conduit to the Tropical Avenue collector conduit inside Talon Dos.',
  },
  {
    id: 'dpwh-c05-bfresort-carnival',
    code: 'DPWH-C05',
    name: 'BF Resort Drive // Carnival Park Arterial Box Culvert',
    roadName: 'BF Resort Drive & Carnival Park Street',
    coordinates: [14.43620, 120.98550],
    structureType: 'TWIN_RCBC',
    dimensions: '2.4m × 1.8m Twin Precast RCBC',
    dpwhStandard: 'DPWH Highway Flood Risk Mitigation Standard',
    agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering',
    flowCapacityCms: 14.5,
    dischargeOutfall: 'BF Resort Main Stormwater Trunk',
    cleanlinessStatus: 'CLEAR',
    description: 'Twin precast reinforced box culvert handling heavy stormwater discharge at the primary intersection between BF Resort Drive and Carnival Park Street.',
  },
  {
    id: 'dpwh-c06-gloria-diaz',
    code: 'DPWH-C06',
    name: 'Gloria Diaz Street Cross-Drain Box Culvert',
    roadName: 'Gloria Diaz Street (BF Resort)',
    coordinates: [14.43480, 120.99100],
    structureType: 'SINGLE_RCBC',
    dimensions: '1.8m × 1.5m Roadside RCBC',
    dpwhStandard: 'DPWH Provincial Road Cross-Drain Standard',
    agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering',
    flowCapacityCms: 7.0,
    dischargeOutfall: 'BF Resort Southern Collector Canal',
    cleanlinessStatus: 'MONITORED',
    description: 'Cross-drain box culvert draining runoff from the Gloria Diaz commercial and residential blocks toward southern retention channels.',
  },
  {
    id: 'dpwh-c07-martinville-north',
    code: 'DPWH-C07',
    name: 'BF Martinville Northern Interceptor Box Culvert',
    roadName: 'BF Martinville North Perimeter',
    coordinates: [14.44280, 120.98900],
    structureType: 'SINGLE_RCBC',
    dimensions: '1.6m × 1.2m Covered RCBC',
    dpwhStandard: 'DPWH Flood Management Unified Plan',
    agencyResponsible: 'DPWH Las Piñas - Muntinlupa DEO / City Engineering',
    flowCapacityCms: 6.5,
    dischargeOutfall: 'Northern Zapote Tributary Inflow',
    cleanlinessStatus: 'CLEAR',
    description: 'Northern boundary roadside box culvert intercepting runoff along the northern perimeter before entering residential streets in Talon Dos.',
  },
];
