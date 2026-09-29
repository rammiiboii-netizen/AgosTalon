/**
 * Real-world geographic dataset for Barangay Talon Dos, Las Piñas City, Metro Manila.
 * Derived from official OpenStreetMap administrative boundaries and street alignments.
 */

// Precise Barangay Talon Dos Administrative Boundary Polygon [lat, lng]
export const TALON_DOS_BOUNDARY_POLYGON: [number, number][] = [
  // Northwest Corner (Talon Dos border with Pamplona Tres / CAA along creek & boundary)
  [14.4448, 120.9935],
  [14.4442, 120.9960],
  [14.4435, 120.9982],
  [14.4428, 121.0005],
  // Northeast Boundary (Border with Talon Uno / Angela Village perimeter)
  [14.4418, 121.0032],
  [14.4402, 121.0048],
  [14.4385, 121.0062],
  // East Perimeter (Near Marcos Alvarez Avenue / Talon Singko & Talon Tres border)
  [14.4362, 121.0068],
  [14.4338, 121.0065],
  [14.4312, 121.0052],
  [14.4288, 121.0035],
  // South Perimeter (Border with Talon Singko & BF Resort South perimeter)
  [14.4278, 121.0010],
  [14.4282, 120.9978],
  [14.4295, 120.9950],
  // Southwest Corner (BF Resort Village West border towards Las Piñas River basin)
  [14.4315, 120.9928],
  [14.4342, 120.9918],
  [14.4370, 120.9912],
  // West Boundary (Along Zapote River tributary towards CAA Road)
  [14.4398, 120.9915],
  [14.4422, 120.9922],
  [14.4448, 120.9935],
];

// Inverted World Mask polygon for darkening/dimming everything outside Talon Dos
// Outer boundary is world box, inner ring is Talon Dos boundary
export const WORLD_INVERTED_MASK: [number, number][][] = [
  [
    [85, -180],
    [85, 180],
    [-85, 180],
    [-85, -180],
    [85, -180],
  ],
  TALON_DOS_BOUNDARY_POLYGON,
];

export interface DrainageRoute {
  id: string;
  name: string;
  roadName: string;
  type: 'ARTERIAL_BOX_CULVERT' | 'LATERAL_COLLECTOR' | 'OPEN_CANAL' | 'OUTFALL_SIPHON';
  coordinates: [number, number][];
  flowDirection: 'WEST' | 'NORTH_WEST' | 'NORTH' | 'SOUTH_WEST';
  description: string;
}

// Street-aligned drainage network precisely tracing the roads in Talon Dos:
// 1. Alabang-Zapote Road corridor (Main arterial storm drain box culvert)
// 2. CAA Road (Northern collector box culvert)
// 3. Casimiro Avenue (Central collector drain towards central outfall)
// 4. BF Resort Drive & Onelia Heights (Subdivision lateral collectors)
// 5. Marcos Alvarez Avenue (Eastern spillway box drain)
// 6. Central Talon Dos Outfall Trunk (Main discharge towards Zapote River tributary)
export const ACCURATE_ROAD_DRAINAGE_NETWORK: DrainageRoute[] = [
  {
    id: 'drain-alabang-zapote',
    name: 'Alabang-Zapote Road Arterial Culvert',
    roadName: 'Alabang-Zapote Road',
    type: 'ARTERIAL_BOX_CULVERT',
    flowDirection: 'WEST',
    description: 'Twin 2.4m x 2.4m reinforced concrete box culvert running directly beneath the highway curb line.',
    coordinates: [
      [14.4362, 121.0066], // Near boundary towards SM Southmall
      [14.4358, 121.0028], // In front of SM Southmall North Gate / Talon Dos entrance
      [14.4354, 121.0002], // Real Street / Talon Dos junction
      [14.4350, 120.9976], // Casimiro Avenue intersection
      [14.4346, 120.9950], // BF Resort Drive junction
      [14.4340, 120.9922], // Towards Las Piñas City Hall / Zapote bridge
    ],
  },
  {
    id: 'drain-casimiro-ave',
    name: 'Casimiro Avenue Collector Drain',
    roadName: 'Casimiro Avenue',
    type: 'LATERAL_COLLECTOR',
    flowDirection: 'NORTH_WEST',
    description: 'Subterranean collector culvert carrying commercial & residential runoff into the Central Outfall.',
    coordinates: [
      [14.4350, 120.9976], // Alabang-Zapote Rd junction
      [14.4365, 120.9977], // Casimiro Commercial Strip
      [14.4372, 120.9979], // Confluence near Talon Dos Barangay Hall
      [14.4388, 120.9978], // Casimiro Townhomes
      [14.4402, 120.9974], // Connecting towards CAA Road
    ],
  },
  {
    id: 'drain-caa-road',
    name: 'CAA Road Storm Drain Trunk',
    roadName: 'CAA Road',
    type: 'ARTERIAL_BOX_CULVERT',
    flowDirection: 'WEST',
    description: 'High-volume northern collector draining CAA and northern Talon Dos towards the creek basin.',
    coordinates: [
      [14.4418, 121.0030], // Northeast Talon Dos boundary
      [14.4415, 121.0008], // Angela Village junction
      [14.4410, 120.9980], // Casimiro North intersection
      [14.4416, 120.9952], // CAA Road main collector
      [14.4425, 120.9930], // Zapote Creek confluence weir
    ],
  },
  {
    id: 'drain-bf-resort-drive',
    name: 'BF Resort Drive Primary Trunk',
    roadName: 'BF Resort Drive',
    type: 'LATERAL_COLLECTOR',
    flowDirection: 'NORTH_WEST',
    description: 'Major stormwater trunk collecting runoff from the BF Resort residential sectors in Talon Dos.',
    coordinates: [
      [14.4288, 120.9975], // Southern BF Resort sector
      [14.4305, 120.9968], // BF Resort Clubhouse approach
      [14.4325, 120.9960], // Onelia Heights intersection
      [14.4334, 120.9955], // BF Resort Gate
      [14.4346, 120.9950], // Alabang-Zapote Rd intersection
    ],
  },
  {
    id: 'drain-marcos-alvarez',
    name: 'Marcos Alvarez Spillway Culvert',
    roadName: 'Marcos Alvarez Avenue',
    type: 'ARTERIAL_BOX_CULVERT',
    flowDirection: 'NORTH',
    description: 'Arterial border canal draining eastern Talon Dos and routing runoff away from low-lying residential clusters.',
    coordinates: [
      [14.4312, 121.0052], // South Talon Dos / Talon Singko border
      [14.4328, 121.0050], // Low-lying spillway zone
      [14.4345, 121.0055], // Marcos Alvarez commercial district
      [14.4362, 121.0066], // Alabang-Zapote junction
    ],
  },
  {
    id: 'drain-central-outfall',
    name: 'Talon Dos Central Outfall Canal',
    roadName: 'Central Outfall Waterway / Canal',
    type: 'OUTFALL_SIPHON',
    flowDirection: 'WEST',
    description: 'Primary discharge siphon channeling combined urban stormwater westward into the Zapote River tributary.',
    coordinates: [
      [14.4365, 121.0015], // Angela Village drain confluence
      [14.4368, 120.9995], // Public Market collector feed
      [14.4372, 120.9988], // Central Confluence Node TD-004
      [14.4376, 120.9962], // Westward canal discharge
      [14.4382, 120.9935], // Bypass weir towards river
      [14.4388, 120.9918], // Zapote River confluence
    ],
  },
  {
    id: 'drain-angela-village',
    name: 'Angela Village Secondary Drain',
    roadName: 'Angela Avenue / Village Interior',
    type: 'LATERAL_COLLECTOR',
    flowDirection: 'SOUTH_WEST',
    description: 'Subdivision lateral collector discharging into the central canal system.',
    coordinates: [
      [14.4402, 121.0018], // Interior Angela Village
      [14.4385, 121.0012], // Middle collector
      [14.4365, 121.0015], // Central Outfall Canal intake
    ],
  },
];
