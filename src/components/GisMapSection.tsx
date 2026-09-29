import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Layers, MapPin, Eye, AlertTriangle, Droplets, Radio, 
  Maximize2, RotateCcw, ShieldCheck, Compass, Info, CheckSquare, Square,
  Navigation, Crosshair, Waves, Activity, School, Building, Wrench
} from 'lucide-react';
import { DrainageNode, SimulationState } from '../types';
import { TALON_DOS_GOOGLE_MAPS_BOUNDARY } from '../data/talonDosBoundary';
import { 
  MAYNILAD_PIPELINES, 
  DPWH_CULVERTS, 
  TALON_DOS_CAMPUS_DATA,
  MayniladPipeline,
  DpwhCulvert
} from '../data/infrastructureData';

interface GisMapSectionProps {
  nodes: DrainageNode[];
  simulation: SimulationState;
  onSelectNode: (node: DrainageNode) => void;
  selectedNode: DrainageNode | null;
  onSimulateNodeBlockage: (nodeCode: string) => void;
}

// Full Geographic Border for Barangay Talon Dos, Las Piñas City matching Google Maps & OpenStreetMap.
// Encompasses BF Resort Village, Talon Dos Barangay Hall (Carnival Park), Tropical Ave,
// Casimiro, Angela Village, Marcos Alvarez, up to CAA Road and west to the Zapote River / Bacoor boundary.
const TALON_DOS_BOUNDARY = TALON_DOS_GOOGLE_MAPS_BOUNDARY;

// Roadside storm drainage conduits following real road alignments in Talon Dos
interface DrainageCorridor {
  id: string;
  name: string;
  roadName: string;
  description: string;
  dimensions: string;
  dischargeTarget: string;
  path: [number, number][];
}

const ROADSIDE_DRAINAGE_CORRIDORS: DrainageCorridor[] = [
  {
    id: 'drain-carnival-park',
    name: 'Carnival Park Street Drainage Conduit',
    roadName: 'Carnival Park Street (Talon Dos Campus Frontage)',
    description: 'Roadside storm drainage conduit directly fronting LPCNSHS Talon Dos Campus, conveying runoff westward to Tartar Creek Siphon.',
    dimensions: '1.2m × 1.2m Precast RCBC',
    dischargeTarget: 'Tartar Creek Western Collector Canal',
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
    id: 'drain-tartar-creek',
    name: 'Tartar Creek Floodway & Siphon Channel',
    roadName: 'Tartar Creek Easement (West Talon Dos)',
    description: 'Major stormwater siphon and floodway under the DPWH ₱101.9M Tartar Creek flood control project, conveying flood flows to Zapote River.',
    dimensions: '3.0m × 2.0m Twin Box Culvert Siphon',
    dischargeTarget: 'Zapote River Western Basin Outfall',
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
    id: 'drain-bf-resort',
    name: 'BF Resort Drive Arterial Storm Drain',
    roadName: 'BF Resort Drive (Central Spine)',
    description: 'Primary arterial storm conduit along the central BF Resort spine road through Talon Dos towards southern retention channels.',
    dimensions: '2.4m × 1.8m Twin Precast RCBC',
    dischargeTarget: 'Southern Retention Line & Sluice Gate',
    path: [
      [14.43950, 120.98800],
      [14.43620, 120.98550],
      [14.43480, 120.99100],
      [14.43320, 120.99540],
      [14.42820, 120.99420],
    ],
  },
  {
    id: 'drain-tropical-ave',
    name: 'Tropical Avenue Central Road Conduit',
    roadName: 'Tropical Avenue (BF Resort)',
    description: 'Central road storm collector linking north and central BF Resort residential sectors to Carnival Park junction.',
    dimensions: '1.8m × 1.5m Reinforced Box Culvert',
    dischargeTarget: 'Carnival Park // Tropical Ave Confluence Box',
    path: [
      [14.44280, 120.98900],
      [14.43950, 120.98800],
      [14.43780, 120.98250],
      [14.43350, 120.98600],
      [14.43150, 120.99300],
    ],
  },
  {
    id: 'drain-gloria-diaz',
    name: 'Gloria Diaz Street Commercial Collector Conduit',
    roadName: 'Gloria Diaz Street',
    description: 'Roadside cross-drain box culvert draining runoff from the commercial and retail strips towards south retention conduits.',
    dimensions: '1.8m × 1.5m Roadside RCBC',
    dischargeTarget: 'BF Resort Southern Collector Canal',
    path: [
      [14.43620, 120.98550],
      [14.43550, 120.98800],
      [14.43480, 120.99100],
      [14.43350, 120.99400],
    ],
  },
  {
    id: 'drain-venetian-south',
    name: 'Venetian Drive South Retention Conduit',
    roadName: 'Venetian Drive / South Boundary',
    description: 'Southern border retention culvert buffering stormwater before the Talon Singko perimeter boundary line.',
    dimensions: '1.5m Covered RCBC & Siphon',
    dischargeTarget: 'Southern Boundary Retention Siphon',
    path: [
      [14.43150, 120.99300],
      [14.42900, 120.99350],
      [14.42820, 120.99420],
      [14.42650, 120.99400],
    ],
  },
];

export const GisMapSection: React.FC<GisMapSectionProps> = ({
  nodes,
  simulation,
  onSelectNode,
  selectedNode,
  onSimulateNodeBlockage,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const boundaryPaneRef = useRef<HTMLElement | null>(null);
  const maskPaneRef = useRef<HTMLElement | null>(null);

  // Layer groups
  const maskLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  const roadsideDrainageLayerRef = useRef<L.LayerGroup | null>(null);
  const mayniladLayerRef = useRef<L.LayerGroup | null>(null);
  const culvertsLayerRef = useRef<L.LayerGroup | null>(null);
  const campusLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const waterwaysLayerRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerRef = useRef<L.LayerGroup | null>(null);
  const coverageLayerRef = useRef<L.LayerGroup | null>(null);
  const historicalLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer toggles
  const [highlightTalonDosOnly, setHighlightTalonDosOnly] = useState(true);
  const [showRoadsideDrainage, setShowRoadsideDrainage] = useState(true);
  const [showMayniladPipelines, setShowMayniladPipelines] = useState(true);
  const [showDpwhCulverts, setShowDpwhCulverts] = useState(true);
  const [showTalonDosCampus, setShowTalonDosCampus] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWaterways, setShowWaterways] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);

  // Selected corridor for tooltip inspection
  const [inspectedCorridor, setInspectedCorridor] = useState<DrainageCorridor | null>(null);

  // Full Google Maps & OSM Boundary
  const [talonDosBoundary, setTalonDosBoundary] = useState<[number, number][]>(TALON_DOS_BOUNDARY);

  // Mobile Map View mode tab ('map' | 'node' | 'layers' | 'legend')
  const [mobileMapTab, setMobileMapTab] = useState<'map' | 'node' | 'layers' | 'legend'>('map');

  // Talon Dos Center Coordinates & Bounds (Encompassing BF Resort & Central Talon Dos)
  const TALON_DOS_CENTER: [number, number] = [14.4365, 120.9870];
  const talonDosBounds = L.latLngBounds(talonDosBoundary);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: TALON_DOS_CENTER,
      zoom: 15,
      zoomControl: true,
      minZoom: 13,
      maxZoom: 18,
      maxBounds: [
        [14.405, 120.955],
        [14.465, 121.030],
      ],
      maxBoundsViscosity: 0.85,
      attributionControl: false,
    });

    // Dedicated panes guarantee that the Talon Dos boundary remains visible
    // above the dark mask and infrastructure layers.
    map.createPane('talonDosMaskPane');
    map.createPane('talonDosBoundaryPane');
    const maskPane = map.getPane('talonDosMaskPane');
    const boundaryPane = map.getPane('talonDosBoundaryPane');
    if (maskPane) {
      maskPane.style.zIndex = '350';
      maskPaneRef.current = maskPane;
    }
    if (boundaryPane) {
      boundaryPane.style.zIndex = '700';
      boundaryPaneRef.current = boundaryPane;
    }

    // Dark-styled OpenStreetMap base map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Create layer groups in order of depth
    maskLayerRef.current = L.layerGroup().addTo(map);
    waterwaysLayerRef.current = L.layerGroup().addTo(map);
    roadsLayerRef.current = L.layerGroup().addTo(map);
    mayniladLayerRef.current = L.layerGroup().addTo(map);
    roadsideDrainageLayerRef.current = L.layerGroup().addTo(map);
    culvertsLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    boundaryLayerRef.current = L.layerGroup().addTo(map);
    historicalLayerRef.current = L.layerGroup().addTo(map);
    coverageLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    campusLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Fit smoothly to Talon Dos boundary on mount
    map.fitBounds(talonDosBounds, { padding: [35, 35], maxZoom: 16 });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Re-fit the existing map when the official polygon finishes loading.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || talonDosBoundary.length < 3) return;

    map.fitBounds(L.latLngBounds(talonDosBoundary), {
      padding: [35, 35],
      maxZoom: 16,
    });
  }, [talonDosBoundary]);

  // Update Map Layers whenever states change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. TALON DOS SPOTLIGHT & INVERTED MASK (Highlight ONLY Talon Dos)
    if (maskLayerRef.current) {
      maskLayerRef.current.clearLayers();

      if (highlightTalonDosOnly && talonDosBoundary.length >= 3) {
        const outerWorld: [number, number][] = [
          [85, -180],
          [85, 180],
          [-85, 180],
          [-85, -180],
          [85, -180],
        ];

        // Keep the mask in its own pane so it can never cover the boundary line.
        const invertedMask = L.polygon([outerWorld, talonDosBoundary], {
          pane: 'talonDosMaskPane',
          fillColor: '#030712',
          fillOpacity: 0.82,
          stroke: false,
          interactive: false,
        });

        maskLayerRef.current.addLayer(invertedMask);
      }
    }

    // 2. TALON DOS JURISDICTION BOUNDARY & GLOW
    if (boundaryLayerRef.current) {
      boundaryLayerRef.current.clearLayers();

      if (highlightTalonDosOnly && talonDosBoundary.length >= 3) {
        // Subtle fill makes the selected barangay visible even when the basemap is dark.
        const boundaryFill = L.polygon(talonDosBoundary, {
          pane: 'talonDosBoundaryPane',
          color: '#22d3ee',
          weight: 1,
          opacity: 0.35,
          fillColor: '#06b6d4',
          fillOpacity: 0.07,
          interactive: false,
        });

        // Draw the perimeter as a Polyline as well as a Polygon. The polyline
        // guarantees a visible outline even if the GIS ring has unusual winding.
        const closedBoundary = [...talonDosBoundary, talonDosBoundary[0]];
        const glowBoundary = L.polyline(closedBoundary, {
          pane: 'talonDosBoundaryPane',
          color: '#00f0ff',
          weight: 10,
          opacity: 0.24,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        });

        const neonBoundary = L.polyline(closedBoundary, {
          pane: 'talonDosBoundaryPane',
          color: '#22d3ee',
          weight: 4,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '10 6',
          interactive: false,
        });

        boundaryLayerRef.current.addLayer(boundaryFill);
        boundaryLayerRef.current.addLayer(glowBoundary);
        boundaryLayerRef.current.addLayer(neonBoundary);

        // Boundary gateway labels inside Talon Dos
        const keyGates: { name: string; coords: [number, number] }[] = [
          { name: 'Zapote River West Gate (Bacoor Border)', coords: [14.4430, 120.9730] },
          { name: 'Tartar Creek Western Outfall', coords: [14.4410, 120.9760] },
          { name: 'Talon Dos Campus (Carnival Park St)', coords: [14.43716, 120.97880] },
          { name: 'Talon Dos Barangay Hall (BF Resort)', coords: [14.4326, 120.9854] },
          { name: 'BF Resort Central Spine Gate', coords: [14.4362, 120.9855] },
          { name: 'BF Martinville North Gate', coords: [14.4428, 120.9890] },
          { name: 'Zapote River Bridge Outfall', coords: [14.4368, 120.9912] },
          { name: 'South Gate (Talon Singko Border)', coords: [14.4265, 120.9940] },
        ];

        keyGates.forEach((gate) => {
          const pinHtml = `
            <div class="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#070d18]/90 text-cyan-300 border border-cyan-500/50 shadow-md whitespace-nowrap">
              ${gate.name}
            </div>
          `;
          const pinMarker = L.marker(gate.coords, {
            pane: 'talonDosBoundaryPane',
            icon: L.divIcon({
              html: pinHtml,
              className: 'gate-pin',
              iconSize: [80, 16],
              iconAnchor: [40, 8],
            }),
            interactive: false,
          });
          boundaryLayerRef.current?.addLayer(pinMarker);
        });
      }
    }

    // 3. ROADSIDE DRAINAGE NETWORK (Conduits & Box Culverts Following Roads)
    if (roadsideDrainageLayerRef.current) {
      roadsideDrainageLayerRef.current.clearLayers();

      if (showRoadsideDrainage) {
        ROADSIDE_DRAINAGE_CORRIDORS.forEach((corridor) => {
          const isCritical = simulation.waterLevel >= 80;
          const isWarning = simulation.waterLevel >= 50;

          const conduitColor = isCritical
            ? '#f43f5e'
            : isWarning
            ? '#f59e0b'
            : '#00f0ff';

          // Underlay glow along road corridor
          const roadUnderlay = L.polyline(corridor.path, {
            color: '#0284c7',
            weight: 6,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round',
          });

          // Active storm conduit line with animated flow dash
          const activeConduit = L.polyline(corridor.path, {
            color: conduitColor,
            weight: 3,
            opacity: 0.95,
            dashArray: '6, 5',
            className: 'drainage-conduit-animated',
          });

          // Interactive popup on conduit
          const popupContent = `
            <div class="p-2 font-mono text-xs">
              <div class="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] mb-1">
                <span class="w-2 h-2 rounded-full" style="background-color: ${conduitColor};"></span>
                ${corridor.name}
              </div>
              <div class="text-[10px] text-slate-300 mb-1">
                <span class="text-slate-400">Road Corridor:</span> ${corridor.roadName}
              </div>
              <div class="text-[10px] text-slate-300 mb-1">
                <span class="text-slate-400">Culvert Dimensions:</span> ${corridor.dimensions}
              </div>
              <div class="text-[10px] text-slate-300 mb-1">
                <span class="text-slate-400">Hydraulic Target:</span> ${corridor.dischargeTarget}
              </div>
              <p class="text-[9px] text-slate-400 mt-1 leading-snug border-t border-slate-700/60 pt-1">
                ${corridor.description}
              </p>
            </div>
          `;

          activeConduit.bindPopup(popupContent);
          activeConduit.on('click', () => {
            setInspectedCorridor(corridor);
          });

          roadsideDrainageLayerRef.current?.addLayer(roadUnderlay);
          roadsideDrainageLayerRef.current?.addLayer(activeConduit);
        });
      }
    }

    // 4. ROAD CORRIDORS & NAMES
    if (roadsLayerRef.current) {
      roadsLayerRef.current.clearLayers();

      if (showRoads) {
        // Alabang-Zapote Road
        const alabangZapoteRd = L.polyline(
          [
            [14.4346, 121.0080],
            [14.4350, 121.0058],
            [14.4352, 121.0040],
            [14.4355, 121.0018],
            [14.4358, 120.9995],
            [14.4362, 120.9950],
            [14.4368, 120.9912],
          ],
          {
            color: '#64748b',
            weight: 4,
            opacity: 0.5,
          }
        );

        // Marcos Alvarez Avenue
        const marcosAlvarezRd = L.polyline(
          [
            [14.4442, 121.0055],
            [14.4405, 121.0052],
            [14.4365, 121.0055],
            [14.4350, 121.0058],
            [14.4310, 121.0065],
            [14.4285, 121.0070],
          ],
          {
            color: '#64748b',
            weight: 3.5,
            opacity: 0.5,
          }
        );

        // Casimiro Avenue
        const casimiroRd = L.polyline(
          [
            [14.4435, 120.9985],
            [14.4410, 120.9983],
            [14.4385, 120.9982],
            [14.4372, 120.9988],
            [14.4358, 120.9995],
          ],
          {
            color: '#64748b',
            weight: 3,
            opacity: 0.45,
          }
        );

        // CAA Road
        const caaRd = L.polyline(
          [
            [14.4442, 121.0055],
            [14.4438, 121.0020],
            [14.4435, 120.9985],
            [14.4432, 120.9935],
            [14.4448, 120.9920],
          ],
          {
            color: '#64748b',
            weight: 3,
            opacity: 0.45,
          }
        );

        // BF Resort Drive
        const bfResortRd = L.polyline(
          [
            [14.4362, 120.9950],
            [14.4345, 120.9952],
            [14.4332, 120.9954],
            [14.4305, 120.9958],
            [14.4282, 120.9962],
          ],
          {
            color: '#64748b',
            weight: 3,
            opacity: 0.45,
          }
        );

        roadsLayerRef.current.addLayer(alabangZapoteRd);
        roadsLayerRef.current.addLayer(marcosAlvarezRd);
        roadsLayerRef.current.addLayer(casimiroRd);
        roadsLayerRef.current.addLayer(caaRd);
        roadsLayerRef.current.addLayer(bfResortRd);
      }
    }

    // 5. NATURAL WATERWAYS & ZAPOTE RIVER FLOODWAY
    if (waterwaysLayerRef.current) {
      waterwaysLayerRef.current.clearLayers();

      if (showWaterways) {
        // Zapote River Western Floodway Channel (Bordering Bacoor, Cavite)
        const zapoteRiverPath: [number, number][] = [
          [14.4448, 120.9721],
          [14.4420, 120.9728],
          [14.4390, 120.9785],
          [14.4368, 120.9850],
          [14.4368, 120.9912],
          [14.4320, 120.9925],
        ];

        const zapoteRiver = L.polyline(zapoteRiverPath, {
          color: '#06b6d4',
          weight: 4,
          opacity: 0.85,
        });

        // Real Street Natural Confluence Creek
        const centralCreekPath: [number, number][] = [
          [14.4372, 120.9988],
          [14.4370, 120.9950],
          [14.4368, 120.9912],
        ];

        const centralCreek = L.polyline(centralCreekPath, {
          color: '#0284c7',
          weight: 3,
          opacity: 0.8,
          dashArray: '4, 4',
        });

        waterwaysLayerRef.current.addLayer(zapoteRiver);
        waterwaysLayerRef.current.addLayer(centralCreek);
      }
    }

    // 5B. MAYNILAD WATER & SEWERAGE PIPELINES (TALON DOS & BF RESORT NETWORK)
    if (mayniladLayerRef.current) {
      mayniladLayerRef.current.clearLayers();

      if (showMayniladPipelines) {
        MAYNILAD_PIPELINES.forEach((pipe) => {
          const isSewer = pipe.category === 'SEWERAGE';
          const isTransmission = pipe.category === 'TRANSMISSION';
          const isCampusFeed = pipe.id === 'may-dist-carnival-park';

          const pipeColor = isSewer
            ? '#c084fc'
            : isTransmission
            ? '#38bdf8'
            : isCampusFeed
            ? '#00f0ff'
            : '#0284c7';

          const pipeWeight = isTransmission ? 5 : isSewer ? 4 : isCampusFeed ? 4 : 3.5;

          const pipeGlow = L.polyline(pipe.path, {
            color: pipeColor,
            weight: pipeWeight + 4,
            opacity: 0.22,
            lineCap: 'round',
            lineJoin: 'round',
          });

          const pipeLine = L.polyline(pipe.path, {
            color: pipeColor,
            weight: pipeWeight,
            opacity: 0.95,
            dashArray: isSewer ? '6, 6' : isTransmission ? '12, 4' : '8, 5',
          });

          const popupContent = `
            <div class="p-2.5 font-mono text-xs max-w-xs">
              <div class="flex items-center justify-between gap-1 pb-1 mb-1.5 border-b border-cyan-900/60">
                <span class="font-bold text-white text-[11px] leading-tight">${pipe.name}</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                  isSewer
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }">${pipe.code}</span>
              </div>
              <div class="space-y-1 text-[10px] text-slate-300">
                <div><span class="text-slate-400">Road Corridor:</span> <strong class="text-white">${pipe.roadName}</strong></div>
                <div><span class="text-slate-400">Classification:</span> <strong class="${isSewer ? 'text-purple-300' : 'text-cyan-300'}">${pipe.category}</strong> · ${pipe.diameterMm}mm Ø</div>
                <div><span class="text-slate-400">Material:</span> ${pipe.material}</div>
                <div><span class="text-slate-400">Hydraulic Pressure:</span> ${pipe.pressurePsi > 0 ? `${pipe.pressurePsi} PSI (Potable Main)` : 'Gravity Sewer'}</div>
                <div><span class="text-slate-400">Depth / Cover:</span> ${pipe.depthMeters}m below street level</div>
                <div><span class="text-slate-400">Operating Utility:</span> <span class="text-cyan-400 font-bold">${pipe.operationalAgency}</span></div>
                <div class="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-snug">${pipe.description}</div>
              </div>
            </div>
          `;

          pipeLine.bindPopup(popupContent);
          mayniladLayerRef.current?.addLayer(pipeGlow);
          mayniladLayerRef.current?.addLayer(pipeLine);
        });
      }
    }

    // 5C. DPWH DRAINAGE CROSS-DRAINS & BOX CULVERTS
    if (culvertsLayerRef.current) {
      culvertsLayerRef.current.clearLayers();

      if (showDpwhCulverts) {
        DPWH_CULVERTS.forEach((culvert) => {
          const isCampusCulvert = culvert.code === 'DPWH-C01';
          const badgeColor = isCampusCulvert ? '#f59e0b' : '#fb923c';

          const culvertHtml = `
            <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -50%);">
              <div class="absolute -inset-2 rounded-lg ${isCampusCulvert ? 'bg-amber-400/40 animate-pulse' : 'bg-orange-500/20'}"></div>
              <div class="relative px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow-xl flex items-center gap-1 transition-transform group-hover:scale-110"
                style="background-color: #0c1524; border: 1.5px solid ${badgeColor};">
                <span class="w-1.5 h-1.5 rounded-sm" style="background-color: ${badgeColor};"></span>
                <span>${culvert.code}</span>
              </div>
            </div>
          `;

          const culvertMarker = L.marker(culvert.coordinates, {
            icon: L.divIcon({
              html: culvertHtml,
              className: 'dpwh-culvert-marker',
              iconSize: [60, 20],
              iconAnchor: [30, 10],
            }),
            zIndexOffset: isCampusCulvert ? 800 : 500,
          });

          const popupContent = `
            <div class="p-2.5 font-mono text-xs max-w-xs">
              <div class="flex items-center justify-between gap-1 pb-1 mb-1.5 border-b border-orange-950/60">
                <span class="font-bold text-amber-300 text-[11px] leading-tight">${culvert.name}</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-950 text-orange-200 border border-orange-800 shrink-0">${culvert.code}</span>
              </div>
              <div class="space-y-1 text-[10px] text-slate-300">
                <div><span class="text-slate-400">Road Location:</span> <strong class="text-white">${culvert.roadName}</strong></div>
                <div><span class="text-slate-400">Structure Size:</span> <strong class="text-amber-200">${culvert.dimensions}</strong></div>
                <div><span class="text-slate-400">Structure Type:</span> ${culvert.structureType.replace('_', ' ')}</div>
                <div><span class="text-slate-400">Discharge Capacity:</span> <strong class="text-cyan-300">${culvert.flowCapacityCms} m³/s</strong></div>
                <div><span class="text-slate-400">Discharge Outfall:</span> ${culvert.dischargeOutfall}</div>
                <div><span class="text-slate-400">Governing Standard:</span> ${culvert.dpwhStandard}</div>
                <div><span class="text-slate-400">Agency:</span> <span class="text-amber-400">${culvert.agencyResponsible}</span></div>
                <div class="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-snug">${culvert.description}</div>
              </div>
            </div>
          `;

          culvertMarker.bindPopup(popupContent);
          culvertsLayerRef.current?.addLayer(culvertMarker);
        });
      }
    }

    // 5D. TALON DOS CAMPUS SPOTLIGHT (CARNIVAL PARK ST, BF RESORT)
    if (campusLayerRef.current) {
      campusLayerRef.current.clearLayers();

      if (showTalonDosCampus) {
        const campus = TALON_DOS_CAMPUS_DATA;

        const campusHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            <div class="absolute -inset-3.5 rounded-full bg-cyan-400/30 animate-ping"></div>
            <div class="absolute -inset-2 rounded-full bg-indigo-500/40"></div>
            <div class="relative px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-white shadow-2xl flex items-center gap-2 bg-[#091328] border-2 border-cyan-400 transition-transform hover:scale-105">
              <span class="text-base">🎓</span>
              <div class="flex flex-col text-left">
                <span class="text-cyan-200 font-extrabold text-[10px] tracking-wide">LPCNSHS TALON DOS</span>
                <span class="text-[8px] text-slate-300 font-normal">STEM Campus · Carnival Park</span>
              </div>
            </div>
          </div>
        `;

        const campusMarker = L.marker(campus.coordinates, {
          icon: L.divIcon({
            html: campusHtml,
            className: 'campus-landmark-marker',
            iconSize: [175, 40],
            iconAnchor: [87, 20],
          }),
          zIndexOffset: 1200,
        });

        const campusPopup = `
          <div class="p-3 font-mono text-xs max-w-sm">
            <div class="flex items-center gap-2 pb-2 mb-2 border-b border-cyan-900/80">
              <span class="text-2xl">🎓</span>
              <div>
                <h4 class="font-bold text-white text-xs leading-snug">${campus.name}</h4>
                <span class="text-[10px] text-cyan-300 font-semibold">${campus.strand}</span>
              </div>
            </div>

            <div class="space-y-2 text-[10px] text-slate-300">
              <div class="p-2 rounded bg-slate-950 border border-slate-800">
                <span class="text-cyan-400 font-bold block mb-0.5">CAMPUS ADDRESS:</span>
                <span>${campus.address}</span>
                <span class="text-slate-400 block mt-0.5">Topographic Ground Elevation: ${campus.elevationM}m AMSL</span>
              </div>

              <div class="p-2 rounded bg-[#061426] border border-cyan-900/60">
                <span class="text-cyan-300 font-bold flex items-center gap-1 mb-0.5">
                  💧 MAYNILAD WATER INFRASTRUCTURE:
                </span>
                <span class="text-slate-200 font-medium">${campus.waterSupply.pipelineConnection}</span>
                <span class="text-slate-400 block mt-0.5">
                  Pipeline Spec: ${campus.waterSupply.pipeSizeMm}mm ${campus.waterSupply.pipeMaterial} · Nominal Pressure: ${campus.waterSupply.pressureNominalPsi} PSI
                </span>
                <span class="text-slate-500 block text-[9px] mt-0.5">
                  Utility Provider: ${campus.waterSupply.agency}
                </span>
              </div>

              <div class="p-2 rounded bg-[#1c1206] border border-amber-900/60">
                <span class="text-amber-300 font-bold flex items-center gap-1 mb-0.5">
                  🛡️ DPWH DRAINAGE & CULVERT INFRASTRUCTURE:
                </span>
                <span class="text-slate-200 font-medium">${campus.drainage.culvertConnection}</span>
                <span class="text-slate-400 block mt-0.5">
                  Structure Spec: ${campus.drainage.conduitSize} · Discharge: ${campus.drainage.outfallBasin}
                </span>
                <span class="text-slate-500 block text-[9px] mt-0.5">
                  Managing Agency: ${campus.drainage.agency}
                </span>
              </div>
            </div>
          </div>
        `;

        campusMarker.bindPopup(campusPopup);
        campusLayerRef.current?.addLayer(campusMarker);
      }
    }

    // 6. UPDATE DRAINAGE MONITORING NODES (12 IoT stations)
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      if (showNodes) {
        nodes.forEach((node) => {
          const isKey = node.isKeyDemoNode;
          const nodeWater = isKey ? simulation.waterLevel : node.waterLevel;
          const nodeCondition = isKey
            ? simulation.drainageCondition
            : (node.severity === 'CRITICAL'
                ? 'POSSIBLE_BLOCKAGE'
                : node.severity === 'WARNING'
                ? 'POTENTIALLY_RESTRICTED'
                : 'NORMAL');

          const isNodeOffline = simulation.sensorStatus === 'OFFLINE' && isKey;

          let severityColor = '#10b981';
          let severityRing = 'rgba(16, 185, 129, 0.4)';
          let statusText = 'NORMAL';

          if (isNodeOffline) {
            severityColor = '#64748b';
            severityRing = 'transparent';
            statusText = 'OFFLINE';
          } else if (
            nodeWater >= 80 ||
            nodeCondition === 'POSSIBLE_BLOCKAGE'
          ) {
            severityColor = '#f43f5e';
            severityRing = 'rgba(244, 63, 94, 0.5)';
            statusText = 'CRITICAL';
          } else if (
            nodeWater >= 50 ||
            nodeCondition === 'POTENTIALLY_RESTRICTED'
          ) {
            severityColor = '#f59e0b';
            severityRing = 'rgba(245, 158, 11, 0.4)';
            statusText = 'WARNING';
          }

          const isSelected = selectedNode?.code === node.code;

          const markerHtml = `
            <div class="relative flex items-center justify-center cursor-pointer group"
              style="transform: translate(-50%, -50%);">

              ${
                statusText === 'CRITICAL'
                  ? `<div class="absolute -inset-3 rounded-full animate-ping"
                      style="background: ${severityRing};"></div>`
                  : ''
              }

              <div
                class="absolute -inset-2 rounded-full"
                style="background: ${severityRing};">
              </div>

              <div
                class="relative px-2 py-1 rounded-md text-[10px] font-mono font-bold text-white shadow-xl flex items-center gap-1.5 transition-transform ${
                  isSelected
                    ? 'scale-125 ring-2 ring-cyan-300'
                    : 'hover:scale-110'
                }"
                style="
                  background-color: #070e1b;
                  border: 1.5px solid ${severityColor};
                ">

                <span
                  class="w-2 h-2 rounded-full"
                  style="background-color: ${severityColor};">
                </span>

                <span>${node.code}</span>

                <span class="text-[9px] opacity-80">
                  ${nodeWater}%
                </span>

              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-leaflet-marker',
            iconSize: [60, 24],
            iconAnchor: [30, 12],
          });

          const marker = L.marker(node.coordinates, {
            icon: customIcon,
          });

          marker.on('click', () => {
            onSelectNode(node);
            setMobileMapTab('node');
          });

          markersLayerRef.current?.addLayer(marker);
        });
      }
    }

    // 7. FLOOD RISK HEATMAP / CONTOURS (Restricted to Talon Dos)
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.clearLayers();

      if (showHeatmap) {
        const isSimulationCritical = simulation.waterLevel >= 80;
        const isSimulationWarning = simulation.waterLevel >= 50;

        // Zone 1: Central Talon Dos Outfall Confluence (Barangay Hall / Real St)
        const centralColor = isSimulationCritical
          ? '#ef4444'
          : isSimulationWarning
          ? '#f59e0b'
          : '#10b981';

        const centralZone = L.circle([14.4372, 120.9988], {
          radius: isSimulationCritical ? 380 : 230,
          color: centralColor,
          weight: 1.5,
          fillColor: centralColor,
          fillOpacity: isSimulationCritical ? 0.35 : 0.18,
          dashArray: isSimulationCritical ? undefined : '4, 4',
        });
        heatmapLayerRef.current.addLayer(centralZone);

        // Zone 2: Marcos Alvarez & Alabang-Zapote intersection culvert
        const marcosColor = isSimulationCritical || simulation.waterLevel >= 68
          ? '#f59e0b'
          : '#10b981';

        const marcosZone = L.circle([14.4350, 121.0058], {
          radius: 280,
          color: marcosColor,
          weight: 1,
          fillColor: marcosColor,
          fillOpacity: 0.2,
        });
        heatmapLayerRef.current.addLayer(marcosZone);

        // Zone 3: CAA Road & Casimiro North tributary junction
        const pamplonaZone = L.circle([14.4435, 120.9985], {
          radius: 290,
          color: isSimulationCritical ? '#f97316' : '#10b981',
          weight: 1,
          fillColor: isSimulationCritical ? '#f97316' : '#10b981',
          fillOpacity: 0.18,
        });
        heatmapLayerRef.current.addLayer(pamplonaZone);
      }
    }

    // 8. SENSOR LoRa COVERAGE
    if (coverageLayerRef.current) {
      coverageLayerRef.current.clearLayers();

      if (showCoverage) {
        nodes.forEach((n) => {
          const circle = L.circle(n.coordinates, {
            radius: 350,
            color: '#38bdf8',
            weight: 1,
            fillColor: '#0284c7',
            fillOpacity: 0.05,
          });
          coverageLayerRef.current?.addLayer(circle);
        });
      }
    }

    // 9. HISTORICAL FLOOD AREAS
    if (historicalLayerRef.current) {
      historicalLayerRef.current.clearLayers();

      if (showHistorical) {
        const historical1 = L.polygon(
          [
            [14.4378, 120.9965],
            [14.4390, 120.9995],
            [14.4365, 121.0010],
            [14.4355, 120.9980],
          ],
          {
            color: '#818cf8',
            weight: 1,
            fillColor: '#6366f1',
            fillOpacity: 0.25,
            dashArray: '3, 3',
          }
        );
        historicalLayerRef.current.addLayer(historical1);
      }
    }
  }, [
    nodes,
    simulation,
    highlightTalonDosOnly,
    showRoadsideDrainage,
    showMayniladPipelines,
    showDpwhCulverts,
    showTalonDosCampus,
    showNodes,
    showHeatmap,
    showWaterways,
    showRoads,
    showHistorical,
    showCoverage,
    selectedNode,
    talonDosBoundary,
  ]);

  // Recenter and lock view to Talon Dos
  const handleFocusTalonDos = () => {
    mapInstanceRef.current?.fitBounds(talonDosBounds, {
      padding: [40, 40],
      maxZoom: 16,
      animate: true,
    });
  };

  // Zoom directly to Talon Dos Campus (LPCNSHS on Carnival Park St)
  const handleFocusCampus = () => {
    setShowTalonDosCampus(true);
    setShowMayniladPipelines(true);
    setShowDpwhCulverts(true);
    mapInstanceRef.current?.setView([14.4357, 120.9808], 17, {
      animate: true,
    });
  };

  // Inspecting active node
  const activeNode =
    selectedNode ||
    nodes.find((n) => n.isKeyDemoNode) ||
    nodes[0];

  const activeNodeWater = activeNode.isKeyDemoNode
    ? simulation.waterLevel
    : activeNode.waterLevel;

  const isKeyActive = activeNode.isKeyDemoNode;

  const activeCondition = isKeyActive
    ? simulation.drainageCondition.replace('_', ' ')
    : activeNode.drainageStatus;

  const activeSensorStatus = isKeyActive
    ? simulation.sensorStatus
    : activeNode.sensorStatus;

  return (
    <section
      id="gis-map"
      className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">GEOSPATIAL SITUATIONAL AWARENESS</span>
            <span>·</span>
            <span className="text-slate-400">EPSG:4326 WGS84</span>
            <span>·</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              TARGET: BARANGAY TALON DOS, LAS PIÑAS CITY
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
            TALON DOS // FLOOD RISK MONITOR
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Real-time geospatial risk mapping across 12 IoT culvert nodes and street drainage conduits running along primary road corridors in <span className="text-cyan-300 font-semibold">Barangay Talon Dos</span> (including the full BF Resort Village, Casimiro, and Zapote River floodway border). Surrounding jurisdictions outside Talon Dos are dimmed to spotlight local drainage infrastructure.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleFocusCampus}
            className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            title="Inspect Talon Dos Campus & Carnival Park Pipeline"
          >
            <School className="w-3.5 h-3.5 text-indigo-400" />
            <span>CAMPUS & PIPELINE</span>
          </button>

          <button
            onClick={() => setHighlightTalonDosOnly(!highlightTalonDosOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 border transition-all ${
              highlightTalonDosOnly
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title="Toggle Talon Dos Spotlight Mask"
          >
            <Crosshair className={`w-3.5 h-3.5 ${highlightTalonDosOnly ? 'text-cyan-400' : 'text-slate-500'}`} />
            SPOTLIGHT TALON DOS: {highlightTalonDosOnly ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleFocusTalonDos}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="Focus and Center Map on Talon Dos"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CENTER TALON DOS</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-cyan-950/80 bg-[#040813] shadow-2xl">

        {/* Tactical Banner Above Map */}
        <div className="bg-[#08101e] px-3 sm:px-4 py-2 border-b border-cyan-900/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="font-bold text-white tracking-wide truncate">
              JURISDICTION: BARANGAY TALON DOS (GOOGLE MAPS BOUNDARY)
            </span>
            <span className="text-slate-500 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline truncate">
              BF Resort Village · Casimiro · Real St · CAA · Marcos Alvarez · Zapote River
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-cyan-300 flex-wrap">
            <span>Area: 3.92 km² (391.6 ha)</span>
            <span>·</span>
            <span>7 Active Corridors</span>
            <span>·</span>
            <span>12 Inlet Sensors</span>
          </div>
        </div>

        {/* Mobile View Switcher Tabs (Visible only on mobile/tablet) */}
        <div className="flex lg:hidden items-center justify-between p-1.5 bg-[#070d1a] border-b border-cyan-950/80 text-xs font-mono overflow-x-auto gap-1">
          <button
            onClick={() => setMobileMapTab('map')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[44px] flex-1 ${
              mobileMapTab === 'map' ? 'bg-cyan-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => setMobileMapTab('node')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[44px] flex-1 ${
              mobileMapTab === 'node' ? 'bg-cyan-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-300" />
            <span>Node {activeNode.code}</span>
          </button>

          <button
            onClick={() => setMobileMapTab('layers')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[44px] flex-1 ${
              mobileMapTab === 'layers' ? 'bg-cyan-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>

          <button
            onClick={() => setMobileMapTab('legend')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[44px] flex-1 ${
              mobileMapTab === 'legend' ? 'bg-cyan-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Legend</span>
          </button>
        </div>

        {/* Leaflet Map */}
        <div
          ref={mapContainerRef}
          className="w-full h-[380px] sm:h-[480px] lg:h-[640px] z-10"
        />

        {/* ========================================================================= */}
        {/* DESKTOP FLOATING PANELS (hidden on mobile, visible on lg) */}
        {/* ========================================================================= */}

        {/* Floating Top-Left: Map Layers Control Panel (Desktop) */}
        <div className="hidden lg:block absolute top-14 left-4 z-20 w-72 max-w-[calc(100%-2rem)] bg-[#090f1d]/95 backdrop-blur-md border border-cyan-800/60 rounded-xl p-3 shadow-2xl text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-950 mb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              MAP DATA LAYERS
            </span>

            <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
              TALON DOS GIS
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={highlightTalonDosOnly}
                onChange={(e) => setHighlightTalonDosOnly(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-cyan-300 font-semibold">Highlight Talon Dos Only (Spotlight)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showTalonDosCampus}
                onChange={(e) => setShowTalonDosCampus(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-indigo-400 focus:ring-0"
              />
              <span className="text-indigo-300 font-semibold flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                Talon Dos Campus (LPCNSHS STEM)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showMayniladPipelines}
                onChange={(e) => setShowMayniladPipelines(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-400 focus:ring-0"
              />
              <span className="text-cyan-200 font-medium flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Maynilad Water & Sewer Pipelines
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showDpwhCulverts}
                onChange={(e) => setShowDpwhCulverts(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span className="text-amber-300 font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                DPWH Box Culverts & Cross-Drains
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showRoadsideDrainage}
                onChange={(e) => setShowRoadsideDrainage(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-cyan-200">Roadside Drainage Network (Culverts)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showNodes}
                onChange={(e) => setShowNodes(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Drainage Monitoring Nodes (12 IoT)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Flood Risk Heatmap & Contours</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showWaterways}
                onChange={(e) => setShowWaterways(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Zapote River & Confluence Creek</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showRoads}
                onChange={(e) => setShowRoads(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Road Network Corridors</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showCoverage}
                onChange={(e) => setShowCoverage(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Sensor LoRa Coverage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showHistorical}
                onChange={(e) => setShowHistorical(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Historical Flood Inundation Zones</span>
            </label>
          </div>
        </div>

        {/* Floating Top-Right: Selected Node Detail Panel (Desktop) */}
        <div className="hidden lg:block absolute top-14 right-4 z-20 w-80 max-w-[calc(100%-2rem)] bg-[#090f1d]/95 backdrop-blur-md border border-cyan-800/60 rounded-xl p-4 shadow-2xl text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-950/60 mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  activeNodeWater >= 80
                    ? 'bg-rose-400 animate-ping'
                    : activeNodeWater >= 50
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />

              <span className="font-bold text-white tracking-wider">
                DRAINAGE NODE {activeNode.code}
              </span>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeSensorStatus === 'ONLINE'
                  ? 'bg-emerald-950 text-emerald-300'
                  : 'bg-rose-950 text-rose-300'
              }`}
            >
              {activeSensorStatus}
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] text-cyan-400 uppercase block font-semibold flex items-center gap-1">
                <Navigation className="w-3 h-3 text-cyan-400" />
                Road Location:
              </span>

              <p className="text-slate-100 font-sans text-xs leading-tight font-semibold mt-0.5">
                {activeNode.name}
              </p>

              <p className="text-[10px] text-slate-300 font-mono mt-1">
                {activeNode.locationDesc}
              </p>
            </div>

            {/* Water Level Gauge */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-medium">
                  CULVERT WATER LEVEL:
                </span>

                <span
                  className={`font-bold text-sm ${
                    activeNodeWater >= 80
                      ? 'text-rose-400'
                      : activeNodeWater >= 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {activeNodeWater}%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeNodeWater >= 80
                      ? 'bg-rose-500'
                      : activeNodeWater >= 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${activeNodeWater}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>
                  Depth: {Math.round((activeNodeWater * 150) / 100)} cm
                </span>

                <span>Max Canal Depth: 150 cm</span>
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">
                  DRAINAGE STATUS
                </span>

                <span
                  className={`font-bold uppercase ${
                    activeNodeWater >= 80
                      ? 'text-rose-400'
                      : activeNodeWater >= 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {activeCondition}
                </span>
              </div>

              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">
                  FLOOD RISK
                </span>

                <span
                  className={`font-bold uppercase ${
                    activeNodeWater >= 80
                      ? 'text-rose-400'
                      : activeNodeWater >= 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {activeNodeWater >= 80
                    ? 'HIGH / DANGER'
                    : activeNodeWater >= 50
                    ? 'MODERATE'
                    : 'LOW RISK'}
                </span>
              </div>
            </div>

            {/* Road Corridor Connection */}
            <div className="p-2 rounded bg-[#06101f] border border-cyan-900/60 text-[10px] text-slate-300">
              <span className="text-cyan-400 font-semibold block mb-0.5">
                CONNECTED ROADSIDE DRAINAGE TRUNK:
              </span>
              <span>{activeNode.catchmentArea}</span>
              <span className="text-slate-400 block mt-0.5">
                Elevation: {activeNode.elevationM}m AMSL · Flow: {activeNode.flowVelocityMps} m/s
              </span>
            </div>

            {/* Telemetry info */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>
                BATTERY: {activeNode.batteryPercent}%
              </span>

              <span>
                RSSI: {activeNode.signalRssi} dBm
              </span>

              <span>
                {activeNode.lastUpdate}
              </span>
            </div>

            {/* Quick Action Button */}
            {activeNode.isKeyDemoNode && (
              <button
                onClick={() =>
                  onSimulateNodeBlockage(activeNode.code)
                }
                className="w-full py-1.5 px-3 rounded bg-rose-900/50 hover:bg-rose-800/80 border border-rose-500/50 text-rose-200 text-[11px] font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                SIMULATE CRITICAL SURGE HERE
              </button>
            )}
          </div>
        </div>

        {/* Floating Bottom-Center: Legend & Road Drainage Guide (Desktop) */}
        <div className="hidden lg:block absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 max-w-lg bg-[#070e1b]/95 backdrop-blur-md border border-cyan-900/70 rounded-xl p-3 text-[11px] font-mono shadow-2xl text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-cyan-950/80 mb-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              GIS ROAD & DRAINAGE INFRASTRUCTURE LEGEND:
            </span>

            <span className="text-[10px] text-cyan-400 font-bold">
              BARANGAY TALON DOS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] mb-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-cyan-400 border-t-2 border-dashed border-cyan-400" />
              <span>Roadside Box Culverts (DPWH)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-1 rounded bg-[#06b6d4]" />
              <span>Zapote River Natural Floodway</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#38bdf8]" />
              <span>Talon Dos Perimeter Boundary</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-1 rounded bg-[#64748b]" />
              <span>Primary Arterial Road Corridors</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#00f0ff]" />
              <span className="text-cyan-200">Maynilad Water & Sewer Pipeline</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-amber-300" />
              <span className="text-amber-200">DPWH Storm Box Culvert</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs">🎓</span>
              <span className="text-indigo-200">Talon Dos Campus (LPCNSHS)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1.5 border-t border-slate-800">
            <span className="font-bold text-slate-300">
              NODE RISK:
            </span>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Low</span>
              </span>

              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Moderate</span>
              </span>

              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Critical</span>
              </span>

              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>Offline</span>
              </span>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 leading-snug mt-1.5">
            *Drainage alignment follows actual municipal rights-of-way (Alabang-Zapote Rd, Marcos Alvarez, Casimiro Ave, CAA Rd, BF Resort Dr, Real St). Surrounding areas outside Talon Dos are shaded to preserve jurisdictional focus.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE OVERLAYS & CARDS (visible on mobile only based on mobileMapTab) */}
        {/* ========================================================================= */}

        {/* Mobile View: Quick Active Node Snapshot Bar on Map View */}
        {mobileMapTab === 'map' && (
          <div className="lg:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between p-2.5 rounded-xl bg-[#08101e]/95 backdrop-blur-md border border-cyan-800/70 text-xs font-mono text-slate-200 shadow-2xl">
            <div className="flex items-center gap-2 truncate mr-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  activeNodeWater >= 80 ? 'bg-rose-500 animate-ping' : activeNodeWater >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span className="font-bold text-white shrink-0">{activeNode.code}:</span>
              <span className="truncate text-slate-300 text-[11px]">{activeNode.name}</span>
              <span className="font-bold text-cyan-300 shrink-0 tabular-nums">({activeNodeWater}%)</span>
            </div>
            <button
              onClick={() => setMobileMapTab('node')}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold shrink-0 min-h-[38px] active:scale-95"
            >
              Inspect
            </button>
          </div>
        )}

        {/* Mobile View: Node Detail Panel */}
        {mobileMapTab === 'node' && (
          <div className="lg:hidden p-4 bg-[#090f1d] border-t border-cyan-900/60 text-xs font-mono animate-fadeIn space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeNodeWater >= 80 ? 'bg-rose-400 animate-ping' : activeNodeWater >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-bold text-white tracking-wider text-sm">
                  NODE {activeNode.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    activeSensorStatus === 'ONLINE' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}
                >
                  {activeSensorStatus}
                </span>
              </div>

              <button
                onClick={() => setMobileMapTab('map')}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-medium"
              >
                Back to Map
              </button>
            </div>

            <div>
              <span className="text-[10px] text-cyan-400 uppercase font-semibold block">
                Road Location:
              </span>
              <p className="text-slate-100 font-sans text-sm font-semibold mt-0.5">
                {activeNode.name}
              </p>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                {activeNode.locationDesc}
              </p>
            </div>

            {/* Water Level Gauge */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-medium">CULVERT WATER LEVEL:</span>
                <span
                  className={`font-bold text-base ${
                    activeNodeWater >= 80 ? 'text-rose-400' : activeNodeWater >= 50 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {activeNodeWater}% ({Math.round((activeNodeWater * 150) / 100)} cm)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeNodeWater >= 80 ? 'bg-rose-500' : activeNodeWater >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${activeNodeWater}%` }}
                />
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">DRAINAGE STATUS</span>
                <span className={`font-bold uppercase ${activeNodeWater >= 80 ? 'text-rose-400' : activeNodeWater >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {activeCondition}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">FLOOD RISK</span>
                <span className={`font-bold uppercase ${activeNodeWater >= 80 ? 'text-rose-400' : activeNodeWater >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {activeNodeWater >= 80 ? 'HIGH / DANGER' : activeNodeWater >= 50 ? 'MODERATE' : 'LOW RISK'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#06101f] border border-cyan-900/60 text-[11px] text-slate-300">
              <span className="text-cyan-400 font-semibold block mb-0.5">DRAINAGE CORRIDOR:</span>
              <span>{activeNode.catchmentArea}</span>
              <span className="text-slate-400 block mt-0.5">
                Elevation: {activeNode.elevationM}m AMSL · Flow: {activeNode.flowVelocityMps} m/s
              </span>
            </div>

            {activeNode.isKeyDemoNode && (
              <button
                onClick={() => onSimulateNodeBlockage(activeNode.code)}
                className="w-full py-2.5 px-3 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-500/60 text-rose-200 text-xs font-bold tracking-wider flex items-center justify-center gap-2 min-h-[44px]"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>SIMULATE CRITICAL SURGE AT {activeNode.code}</span>
              </button>
            )}
          </div>
        )}

        {/* Mobile View: Map Data Layers */}
        {mobileMapTab === 'layers' && (
          <div className="lg:hidden p-4 bg-[#090f1d] border-t border-cyan-900/60 text-xs font-mono animate-fadeIn space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Layers className="w-4 h-4 text-cyan-400" />
                MAP DATA LAYERS (TALON DOS)
              </span>
              <button
                onClick={() => setMobileMapTab('map')}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-medium"
              >
                Back to Map
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 pt-1">
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTalonDosCampus}
                  onChange={(e) => setShowTalonDosCampus(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-indigo-400 focus:ring-0"
                />
                <span className="text-indigo-300 font-semibold">🎓 Talon Dos Campus (LPCNSHS)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMayniladPipelines}
                  onChange={(e) => setShowMayniladPipelines(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-cyan-400 focus:ring-0"
                />
                <span className="text-cyan-200 font-semibold">💧 Maynilad Water & Sewer Pipes</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDpwhCulverts}
                  onChange={(e) => setShowDpwhCulverts(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-amber-400 focus:ring-0"
                />
                <span className="text-amber-300 font-semibold">🛡️ DPWH Box Culverts</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={highlightTalonDosOnly}
                  onChange={(e) => setHighlightTalonDosOnly(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-cyan-300 font-semibold">Talon Dos Spotlight Mask</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRoadsideDrainage}
                  onChange={(e) => setShowRoadsideDrainage(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-cyan-200">Roadside Culvert Corridors</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNodes}
                  onChange={(e) => setShowNodes(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>12 IoT Monitoring Nodes</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Flood Risk Heatmap & Contours</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWaterways}
                  onChange={(e) => setShowWaterways(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Zapote River & Confluence Creek</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCoverage}
                  onChange={(e) => setShowCoverage(e.target.checked)}
                  className="rounded w-4 h-4 bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Sensor LoRa Coverage</span>
              </label>
            </div>
          </div>
        )}

        {/* Mobile View: Legend Panel */}
        {mobileMapTab === 'legend' && (
          <div className="lg:hidden p-4 bg-[#090f1d] border-t border-cyan-900/60 text-xs font-mono animate-fadeIn space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-cyan-400" />
                GIS MAP LEGEND
              </span>
              <button
                onClick={() => setMobileMapTab('map')}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] font-medium"
              >
                Back to Map
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-4 h-0.5 bg-cyan-400 border-t-2 border-dashed border-cyan-400" />
                <span>Roadside Culverts</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-4 h-1 rounded bg-[#06b6d4]" />
                <span>Zapote River</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#38bdf8]" />
                <span>Perimeter Border</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-4 h-1 rounded bg-[#64748b]" />
                <span>Road Corridors</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#00f0ff]" />
                <span className="text-cyan-300">Maynilad Pipeline</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-amber-300" />
                <span className="text-amber-300">DPWH Culvert</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 col-span-2">
                <span className="text-xs">🎓</span>
                <span className="text-indigo-200">Talon Dos Campus (LPCNSHS STEM)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <span className="font-bold text-slate-300">NODE STATUS:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Low</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Moderate</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Critical</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Offline</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
