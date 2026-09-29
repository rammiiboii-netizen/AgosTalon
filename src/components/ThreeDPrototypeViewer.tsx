import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, ZoomIn, ZoomOut, Play, Pause, Eye, Compass, 
  Sparkles, Maximize2, RefreshCw, Volume2, Sliders, CheckCircle, 
  AlertTriangle, Waves, ArrowDown, Tag, EyeOff, Layers, Info, X
} from 'lucide-react';

interface ThreeDPrototypeViewerProps {
  waterLevel: number; // 0 - 100%
  flowVelocity: number; // 0.0 - 2.5 m/s
  isClogged: boolean;
  isBuzzerActive: boolean;
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  onRotatePotentiometer: (newLevel: number) => void;
}

interface CalloutPosition {
  id: string;
  label: string;
  sub: string;
  pinout: string;
  x: number;
  y: number;
  visible: boolean;
  anchorWorld: THREE.Vector3;
}

export const ThreeDPrototypeViewer: React.FC<ThreeDPrototypeViewerProps> = ({
  waterLevel,
  flowVelocity,
  isClogged,
  isBuzzerActive,
  selectedComponentId,
  onSelectComponent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showCallouts, setShowCallouts] = useState(true);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [callouts, setCallouts] = useState<CalloutPosition[]>([]);
  const [activeInspector, setActiveInspector] = useState<string | null>(null);

  // References to dynamic Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Dynamic animated components
  const turbineRotorRef = useRef<THREE.Group | null>(null);
  const buzzerGroupRef = useRef<THREE.Group | null>(null);
  const buzzerRingsRef = useRef<THREE.Mesh[]>([]);
  const waterSurfaceRef = useRef<THREE.Mesh | null>(null);
  const sonarBeamsRef = useRef<THREE.LineSegments | null>(null);
  const sonarRippleRef = useRef<THREE.Mesh | null>(null);

  // Status LEDs and lights
  const greenLedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const yellowLedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const redLedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const greenLedLightRef = useRef<THREE.PointLight | null>(null);
  const yellowLedLightRef = useRef<THREE.PointLight | null>(null);
  const redLedLightRef = useRef<THREE.PointLight | null>(null);

  // Component highlights and bounding anchors
  const componentAnchorsRef = useRef<{ 
    id: string; 
    label: string; 
    sub: string; 
    pinout: string;
    anchor: THREE.Vector3; 
    mesh: THREE.Object3D 
  }[]>([]);

  // Camera Orbit state (spherical coords)
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ spherical: { radius: 18.0, theta: Math.PI / 4.2, phi: Math.PI / 3.3 } });

  const updateCameraFromSpherical = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraRotationRef.current.spherical;
    const clampedPhi = Math.max(0.12, Math.min(Math.PI / 2 - 0.05, phi));
    cameraRotationRef.current.spherical.phi = clampedPhi;

    cameraRef.current.position.x = radius * Math.sin(clampedPhi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(clampedPhi);
    cameraRef.current.position.z = radius * Math.sin(clampedPhi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraFromSpherical();

    // 2. Renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Clear, High-Visibility Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    // Primary key light from top-front
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(14, 24, 16);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Crisp soft blue fill light from opposite corner
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-16, 16, -12);
    scene.add(fillLight);

    // Bottom soft reflector
    const bottomLight = new THREE.DirectionalLight(0x1e293b, 0.8);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);

    // Staging table / lab bench platform
    const benchGeo = new THREE.BoxGeometry(24, 0.4, 18);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x090f1d,
      roughness: 0.8,
      metalness: 0.1,
    });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.y = -4.0;
    bench.receiveShadow = true;
    scene.add(bench);

    // Tech Grid on table surface
    const gridHelper = new THREE.GridHelper(26, 26, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -3.79;
    scene.add(gridHelper);

    // Reset component anchors
    componentAnchorsRef.current = [];

    // Master Group for Prototype
    const prototypeGroup = new THREE.Group();
    scene.add(prototypeGroup);

    // =========================================================================
    // 1. TRANSPARENT WATERPROOF ENCLOSURE (IP65 Junction Box)
    // =========================================================================
    // Proportions: ~13cm wide x 9.5cm deep x 4.2cm high
    const encWidth = 12.0;
    const encDepth = 9.0;
    const encHeight = 4.0;

    const enclosureGroup = new THREE.Group();
    enclosureGroup.position.set(-1.8, 0.3, 0.4);

    // Opaque Base Box (Light industrial ABS plastic, off-white/light gray)
    const baseBoxGeo = new THREE.BoxGeometry(encWidth, 1.6, encDepth);
    const baseBoxMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Industrial light gray
      roughness: 0.45,
      metalness: 0.1,
    });
    const baseBox = new THREE.Mesh(baseBoxGeo, baseBoxMat);
    baseBox.position.y = -0.8;
    baseBox.castShadow = true;
    baseBox.receiveShadow = true;
    enclosureGroup.add(baseBox);

    // Dark Neoprene Sealing Gasket Rim along perimeter
    const gasketGeo = new THREE.BoxGeometry(encWidth + 0.12, 0.14, encDepth + 0.12);
    const gasketMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    const gasket = new THREE.Mesh(gasketGeo, gasketMat);
    gasket.position.y = 0.05;
    enclosureGroup.add(gasket);

    // Transparent Polycarbonate Cover Lid (Clear crystal acrylic - 100% visible inside)
    const lidHeight = encHeight - 1.6;
    const lidGeo = new THREE.BoxGeometry(encWidth, lidHeight, encDepth);
    const lidMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe, // Ultra clear slight ice tint
      transparent: true,
      opacity: 0.24,
      roughness: 0.08,
      transmission: 0.92,
      ior: 1.5,
      thickness: 0.4,
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = lidHeight / 2 + 0.1;
    enclosureGroup.add(lid);

    // Clean CAD wireframe edges for the transparent cover
    const lidEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(lidGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
    );
    lidEdges.position.copy(lid.position);
    enclosureGroup.add(lidEdges);

    // 4 Corner Stainless Steel Screws with brass inserts
    const screwGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.25, 16);
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95, roughness: 0.15 });
    const screwPositions = [
      [-encWidth / 2 + 0.6, -encDepth / 2 + 0.6],
      [encWidth / 2 - 0.6, -encDepth / 2 + 0.6],
      [-encWidth / 2 + 0.6, encDepth / 2 - 0.6],
      [encWidth / 2 - 0.6, encDepth / 2 - 0.6],
    ];
    screwPositions.forEach(([sx, sz]) => {
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(sx, encHeight - 1.45, sz);
      enclosureGroup.add(screw);

      // Screw driver cross slot
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x52525b })
      );
      slot.position.set(sx, encHeight - 1.32, sz);
      enclosureGroup.add(slot);
    });

    // Prototyping Board Platform inside enclosure (Base mounting breadboard/perfboard)
    const protoPcbGeo = new THREE.BoxGeometry(encWidth - 1.2, 0.2, encDepth - 1.2);
    const protoPcbMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark navy prototyping perfboard
      roughness: 0.5,
      metalness: 0.1,
    });
    const protoPcb = new THREE.Mesh(protoPcbGeo, protoPcbMat);
    protoPcb.position.y = -0.05;
    enclosureGroup.add(protoPcb);

    // 3 Liquid-Tight Nylon Cable Glands (PG7/M16 style with compression nuts)
    const createCableGland = (x: number, y: number, z: number, rotationY: number) => {
      const glandGroup = new THREE.Group();
      glandGroup.position.set(x, y, z);
      glandGroup.rotation.y = rotationY;

      // Hex gland body
      const glandBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.44, 0.55, 6),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
      );
      glandBody.rotation.z = Math.PI / 2;
      glandGroup.add(glandBody);

      // Threaded dome compression nut
      const glandNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 })
      );
      glandNut.rotation.z = Math.PI / 2;
      glandNut.position.x = 0.42;
      glandGroup.add(glandNut);

      enclosureGroup.add(glandGroup);
    };

    // Gland 1: POWER (Left wall)
    createCableGland(-encWidth / 2 - 0.1, -0.4, 0, Math.PI);
    // Gland 2: HC-SR04 Sensor Wire Harness (Right wall, Upper/Front)
    createCableGland(encWidth / 2 + 0.1, -0.4, -2.0, 0);
    // Gland 3: Water Flow Sensor Wire Harness (Right wall, Lower/Back)
    createCableGland(encWidth / 2 + 0.1, -0.4, 2.0, 0);

    prototypeGroup.add(enclosureGroup);

    // =========================================================================
    // 2. REALISTIC ESP32 DEVKIT V1 BOARD (Mounted inside enclosure, left-center)
    // =========================================================================
    const esp32Group = new THREE.Group();
    esp32Group.position.set(-2.8, 0.25, 0.2);

    // 4 Brass Standoff Spacers underneath ESP32
    const standoffGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 12);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
    [[-2.1, -1.2], [2.1, -1.2], [-2.1, 1.2], [2.1, 1.2]].forEach(([sx, sz]) => {
      const so = new THREE.Mesh(standoffGeo, brassMat);
      so.position.set(sx, -0.2, sz);
      esp32Group.add(so);
    });

    // ESP32 PCB (Matte Black FR-4 board with gold edge traces)
    const espPcbGeo = new THREE.BoxGeometry(5.2, 0.18, 3.0);
    const espPcbMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Matte black solder mask
      roughness: 0.35,
      metalness: 0.2,
    });
    const espPcb = new THREE.Mesh(espPcbGeo, espPcbMat);
    esp32Group.add(espPcb);

    // Silk screen text texture for ESP32
    const espCanvas = document.createElement('canvas');
    espCanvas.width = 512;
    espCanvas.height = 256;
    const ctxEsp = espCanvas.getContext('2d');
    if (ctxEsp) {
      ctxEsp.fillStyle = '#090d16';
      ctxEsp.fillRect(0, 0, 512, 256);
      ctxEsp.fillStyle = '#ffffff';
      ctxEsp.font = 'bold 30px monospace';
      ctxEsp.fillText('ESP32 DEVKIT V1', 40, 60);
      ctxEsp.font = '18px monospace';
      ctxEsp.fillStyle = '#38bdf8';
      ctxEsp.fillText('30-PIN DUAL-CORE MCU // 240MHz', 40, 100);
      ctxEsp.fillStyle = '#94a3b8';
      ctxEsp.fillText('LAS PINAS TALON DOS FLOOD TELEMETRY', 40, 135);
      ctxEsp.fillText('GPIO18:TRIG  GPIO5:ECHO  GPIO34:FLOW  GPIO23:BUZZ', 40, 175);
      ctxEsp.fillText('GPIO19:LED_GRN  GPIO21:LED_YEL  GPIO22:LED_RED', 40, 210);
    }
    const espTex = new THREE.CanvasTexture(espCanvas);
    const espLabelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.8),
      new THREE.MeshBasicMaterial({ map: espTex })
    );
    espLabelMesh.rotation.x = -Math.PI / 2;
    espLabelMesh.position.set(0.6, 0.1, 0);
    esp32Group.add(espLabelMesh);

    // Silver-Nickel ESP-WROOM-32 RF Shield Box
    const rfShieldGeo = new THREE.BoxGeometry(2.1, 0.38, 2.0);
    const rfShieldMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.95,
      roughness: 0.15,
    });
    const rfShield = new THREE.Mesh(rfShieldGeo, rfShieldMat);
    rfShield.position.set(-0.8, 0.28, 0);
    esp32Group.add(rfShield);

    // Distinct Laser Marking on RF Shield
    const rfCanvas = document.createElement('canvas');
    rfCanvas.width = 256;
    rfCanvas.height = 256;
    const ctxRf = rfCanvas.getContext('2d');
    if (ctxRf) {
      ctxRf.fillStyle = '#d4d4d8';
      ctxRf.fillRect(0, 0, 256, 256);
      ctxRf.fillStyle = '#3f3f46';
      ctxRf.font = 'bold 24px sans-serif';
      ctxRf.fillText('Espressif', 50, 60);
      ctxRf.font = 'bold 28px monospace';
      ctxRf.fillText('ESP-WROOM-32', 30, 110);
      ctxRf.font = '16px monospace';
      ctxRf.fillText('FCC ID: 2AC7Z-ESPWROOM32', 15, 160);
      ctxRf.fillText('CE  RoHS  2.4GHz', 40, 200);
    }
    const rfTex = new THREE.CanvasTexture(rfCanvas);
    const rfLaser = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.8),
      new THREE.MeshBasicMaterial({ map: rfTex })
    );
    rfLaser.rotation.x = -Math.PI / 2;
    rfLaser.position.set(-0.8, 0.48, 0);
    esp32Group.add(rfLaser);

    // Gold PCB Serpentine Inverted-F Trace Antenna (top edge)
    const antennaGeo = new THREE.BoxGeometry(0.8, 0.19, 2.4);
    const antennaMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Polished copper / gold trace
      metalness: 0.9,
      roughness: 0.2,
    });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(-2.0, 0.16, 0);
    esp32Group.add(antenna);

    // Micro-USB / USB-C Metallic Receptacle (bottom edge)
    const usbGeo = new THREE.BoxGeometry(0.9, 0.36, 0.9);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, metalness: 0.95, roughness: 0.15 });
    const usbPort = new THREE.Mesh(usbGeo, usbMat);
    usbPort.position.set(2.6, 0.24, 0);
    esp32Group.add(usbPort);

    // USB Receptacle interior socket opening
    const usbHole = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.18, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    usbHole.position.set(3.06, 0.24, 0);
    esp32Group.add(usbHole);

    // Two Parallel 15-Pin GPIO Header Rows (Top and Bottom rows)
    const headerGeo = new THREE.BoxGeometry(4.8, 0.48, 0.32);
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const headerTop = new THREE.Mesh(headerGeo, headerMat);
    headerTop.position.set(0, 0.28, 1.35);
    const headerBottom = new THREE.Mesh(headerGeo, headerMat);
    headerBottom.position.set(0, 0.28, -1.35);
    esp32Group.add(headerTop);
    esp32Group.add(headerBottom);

    // 30 Individual Shiny Silver Square Pin Tips protruding through headers
    const pinTipGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
    const pinTipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    for (let p = 0; p < 15; p++) {
      const px = -2.1 + p * 0.3;
      // Top row pin
      const pTop = new THREE.Mesh(pinTipGeo, pinTipMat);
      pTop.position.set(px, 0.56, 1.35);
      esp32Group.add(pTop);
      // Bottom row pin
      const pBtm = new THREE.Mesh(pinTipGeo, pinTipMat);
      pBtm.position.set(px, 0.56, -1.35);
      esp32Group.add(pBtm);
    }

    // Tactile Buttons: EN (Reset) & BOOT
    const createTactileBtn = (x: number, z: number) => {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.22, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x52525b })
      );
      base.position.set(x, 0.2, z);
      const plunger = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.14, 12),
        new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9 })
      );
      plunger.position.set(x, 0.34, z);
      esp32Group.add(base);
      esp32Group.add(plunger);
    };
    createTactileBtn(1.8, 0.9);  // BOOT button
    createTactileBtn(1.8, -0.9); // EN reset button

    // On-board Blue Status Micro-LED
    const pwrLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    pwrLed.position.set(0.6, 0.22, 0.6);
    esp32Group.add(pwrLed);

    // CP2102 USB-to-UART Silicon Bridge IC
    const cp2102 = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.16, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 })
    );
    cp2102.position.set(1.6, 0.2, 0);
    esp32Group.add(cp2102);

    // Invisible Raycast Click Target for ESP32
    const espClickMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 1.4, 3.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    esp32Group.add(espClickMesh);

    prototypeGroup.add(esp32Group);

    // Register Callout: ESP32
    componentAnchorsRef.current.push({
      id: 'esp32',
      label: 'ESP32',
      sub: '32-Bit Dual-Core Microcontroller (Brain)',
      pinout: 'GPIO 18, 5, 34, 23, 19, 21, 22 · 240MHz',
      anchor: new THREE.Vector3(-4.4, 1.2, 0.6),
      mesh: espClickMesh,
    });

    // =========================================================================
    // 3. POWER SYSTEM & USB CABLE (Entering via left gland directly into ESP32)
    // =========================================================================
    const powerGroup = new THREE.Group();
    powerGroup.position.set(-7.8, -0.1, 0.6);

    // Molded Black Industrial USB Power Cable
    const usbCableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, 0.0, 0.0),
      new THREE.Vector3(-0.6, 0.1, 0.0),
      new THREE.Vector3(1.0, 0.35, -0.2),
      new THREE.Vector3(2.4, 0.45, -0.4),
    ]);
    const usbCableGeo = new THREE.TubeGeometry(usbCableCurve, 20, 0.18, 10, false);
    const usbCableMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
    const usbCableMesh = new THREE.Mesh(usbCableGeo, usbCableMat);
    powerGroup.add(usbCableMesh);

    // 5V Regulated DC Power Supply Adapter Module
    const pwrBrick = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.45 })
    );
    pwrBrick.position.set(-2.8, 0.3, 0);
    pwrBrick.castShadow = true;
    powerGroup.add(pwrBrick);

    // Power Brick AC Prongs & Silkscreen
    const pwrLedLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    pwrLedLight.position.set(-2.8, 0.95, -0.7);
    powerGroup.add(pwrLedLight);

    // Power Click Target
    const pwrClickMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.6, 2.8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    pwrClickMesh.position.set(-2.6, 0.3, 0);
    powerGroup.add(pwrClickMesh);

    prototypeGroup.add(powerGroup);

    // Register Callout: POWER
    componentAnchorsRef.current.push({
      id: 'power',
      label: 'POWER',
      sub: 'Regulated 5V DC Supply Input',
      pinout: '5V VBUS · IP68 Liquid-Tight Gland',
      anchor: new THREE.Vector3(-9.6, 0.8, 0.6),
      mesh: pwrClickMesh,
    });

    // =========================================================================
    // 4. THREE SEPARATE STATUS LEDS: GREEN, YELLOW, RED (Mounted inside enclosure)
    // =========================================================================
    const ledsGroup = new THREE.Group();
    ledsGroup.position.set(1.4, 0.3, -1.8);

    // Prototyping Sub-Strip for LEDs with silk screen labels
    const ledStripGeo = new THREE.BoxGeometry(1.3, 0.18, 4.0);
    const ledStripMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const ledStrip = new THREE.Mesh(ledStripGeo, ledStripMat);
    ledsGroup.add(ledStrip);

    // Helper for 5mm through-hole LED with dome lens and ballast resistor
    const createDistinctLed = (
      colorHex: number,
      zPos: number,
      id: string,
      label: string,
      sub: string,
      pinout: string
    ) => {
      // Black LED Panel-Mount Holder/Bezel
      const holder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.34, 0.32, 16),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
      );
      holder.position.set(0, 0.16, zPos);
      ledsGroup.add(holder);

      // 5mm Domed Epoxy Lens
      const domeGeo = new THREE.SphereGeometry(0.28, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.35,
        roughness: 0.12,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(0, 0.32, zPos);
      ledsGroup.add(dome);

      // Dynamic Colored Point Light
      const light = new THREE.PointLight(colorHex, 0, 3.5);
      light.position.set(0, 0.65, zPos);
      ledsGroup.add(light);

      // Distinct 220-Ohm Ballast Resistor (Beige cylinder with color bands)
      const resBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.55, 12),
        new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.5 })
      );
      resBody.rotation.z = Math.PI / 2;
      resBody.position.set(-0.4, 0.18, zPos);
      ledsGroup.add(resBody);

      // Red/Gold bands on resistor
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.125, 0.125, 0.08, 12),
        new THREE.MeshBasicMaterial({ color: 0xd97706 })
      );
      band.rotation.z = Math.PI / 2;
      band.position.set(-0.4, 0.18, zPos);
      ledsGroup.add(band);

      // Raycast Click Target
      const clickMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.2, 1.1),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      clickMesh.position.set(0, 0.4, zPos);
      ledsGroup.add(clickMesh);

      // Register Callout Anchor
      componentAnchorsRef.current.push({
        id,
        label,
        sub,
        pinout,
        anchor: new THREE.Vector3(1.4 - 1.8, 1.0, -1.8 + zPos + 0.4),
        mesh: clickMesh,
      });

      return { domeMat, light };
    };

    // 1. GREEN LED – NORMAL (z = -1.2)
    const greenLed = createDistinctLed(
      0x10b981,
      -1.2,
      'led_green',
      'GREEN LED – NORMAL',
      'Free Gravity Flow · Nominal Water Level',
      'GPIO 19 via 220Ω Ballast · Continuous ON'
    );
    greenLedMatRef.current = greenLed.domeMat;
    greenLedLightRef.current = greenLed.light;

    // 2. YELLOW LED – WARNING (z = 0.0)
    const yellowLed = createDistinctLed(
      0xf59e0b,
      0.0,
      'led_yellow',
      'YELLOW LED – WARNING',
      'Elevated Water · Restricted Runoff',
      'GPIO 21 via 220Ω Ballast · Warning Alert'
    );
    yellowLedMatRef.current = yellowLed.domeMat;
    yellowLedLightRef.current = yellowLed.light;

    // 3. RED LED – CRITICAL (z = +1.2)
    const redLed = createDistinctLed(
      0xf43f5e,
      1.2,
      'led_red',
      'RED LED – CRITICAL',
      'Severe Blockage / Flood Alert',
      'GPIO 22 via 220Ω Ballast · Urgent Flash'
    );
    redLedMatRef.current = redLed.domeMat;
    redLedLightRef.current = redLed.light;

    prototypeGroup.add(ledsGroup);

    // =========================================================================
    // 5. SEPARATE BLACK PIEZO BUZZER (Mounted inside enclosure, right-front)
    // =========================================================================
    const buzzerGroup = new THREE.Group();
    buzzerGroup.position.set(1.8, 0.24, 1.6);
    buzzerGroupRef.current = buzzerGroup;

    // Black Cylindrical Piezo Housing (12mm x 9.5mm standard DC buzzer)
    const buzzerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 1.05, 24),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.35, metalness: 0.15 })
    );
    buzzerBody.position.y = 0.52;
    buzzerGroup.add(buzzerBody);

    // Central Sound Emission Aperture Hole
    const buzzerHole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.16, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    buzzerHole.position.y = 1.06;
    buzzerGroup.add(buzzerHole);

    // Yellow Peel-off Protective Warning Seal
    const bSeal = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.95, 22),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    bSeal.rotation.x = -Math.PI / 2;
    bSeal.position.y = 1.07;
    buzzerGroup.add(bSeal);

    // Acoustic Concentric Shockwave Rings for Alarm Sounding
    const bRings: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.48, 20),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1.15 + r * 0.25;
      buzzerGroup.add(ring);
      bRings.push(ring);
    }
    buzzerRingsRef.current = bRings;

    // Click target
    const buzzClickMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 1.8, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    buzzClickMesh.position.y = 0.6;
    buzzerGroup.add(buzzClickMesh);

    prototypeGroup.add(buzzerGroup);

    // Register Callout: PIEZO BUZZER
    componentAnchorsRef.current.push({
      id: 'buzzer',
      label: 'PIEZO BUZZER',
      sub: '85dB Emergency Audio Annunciator',
      pinout: 'GPIO 23 via NPN Driver Transistor',
      anchor: new THREE.Vector3(1.8 - 1.8, 1.2, 1.6 + 0.4),
      mesh: buzzClickMesh,
    });

    // =========================================================================
    // 6. HC-SR04 ULTRASONIC WATER LEVEL SENSOR (Mounted overhead above drainage)
    // =========================================================================
    const ultrasonicGroup = new THREE.Group();
    ultrasonicGroup.position.set(7.6, 0.0, -1.8);

    // Rigid Steel L-Bracket extending from enclosure to over the drainage flume
    const bracketArm = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.26, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    );
    bracketArm.position.set(-1.6, 1.4, 0);
    ultrasonicGroup.add(bracketArm);

    // Classic Royal Blue HC-SR04 PCB
    const usPcb = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.4, 4.4),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.15 })
    );
    usPcb.position.y = 1.4;
    ultrasonicGroup.add(usPcb);

    // Silkscreen "HC-SR04" and pin labels on sensor PCB
    const usCanvas = document.createElement('canvas');
    usCanvas.width = 256;
    usCanvas.height = 128;
    const ctxUs = usCanvas.getContext('2d');
    if (ctxUs) {
      ctxUs.fillStyle = '#0284c7';
      ctxUs.fillRect(0, 0, 256, 128);
      ctxUs.fillStyle = '#ffffff';
      ctxUs.font = 'bold 26px monospace';
      ctxUs.fillText('HC-SR04', 60, 45);
      ctxUs.font = '16px monospace';
      ctxUs.fillText('VCC TRIG ECHO GND', 25, 95);
    }
    const usTex = new THREE.CanvasTexture(usCanvas);
    const usLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.9),
      new THREE.MeshBasicMaterial({ map: usTex })
    );
    usLabel.position.set(-0.71, 1.4, 0);
    usLabel.rotation.y = -Math.PI / 2;
    ultrasonicGroup.add(usLabel);

    // Two Circular Aluminum Acoustic Transducers (Transmitter "T" & Receiver "R")
    const canGeo = new THREE.CylinderGeometry(0.82, 0.82, 1.4, 24);
    const canMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    const screenGeo = new THREE.CircleGeometry(0.76, 20);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true });

    // Transmitter Canister ("T")
    const txCan = new THREE.Mesh(canGeo, canMat);
    txCan.rotation.z = Math.PI / 2;
    txCan.position.set(0.85, 1.4, -1.2);
    const txScr = new THREE.Mesh(screenGeo, screenMat);
    txScr.rotation.y = Math.PI / 2;
    txScr.position.set(1.56, 1.4, -1.2);
    ultrasonicGroup.add(txCan);
    ultrasonicGroup.add(txScr);

    // Receiver Canister ("R")
    const rxCan = new THREE.Mesh(canGeo, canMat);
    rxCan.rotation.z = Math.PI / 2;
    rxCan.position.set(0.85, 1.4, 1.2);
    const rxScr = new THREE.Mesh(screenGeo, screenMat);
    rxScr.rotation.y = Math.PI / 2;
    rxScr.position.set(1.56, 1.4, 1.2);
    ultrasonicGroup.add(rxCan);
    ultrasonicGroup.add(rxScr);

    // 4.000 MHz Silver Quartz Crystal
    const crystal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.75, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95 })
    );
    crystal.position.set(0.65, 1.4, 0);
    ultrasonicGroup.add(crystal);

    // 4-Pin Right Angle Header on Back of HC-SR04
    const usHeader = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x18181b })
    );
    usHeader.position.set(-0.8, 1.4, 0);
    ultrasonicGroup.add(usHeader);

    // =========================================================================
    // DRAINAGE CULVERT CHANNEL DIRECTLY UNDERNEATH ULTRASONIC TRANSDUCERS
    // =========================================================================
    const drainageChannelGroup = new THREE.Group();
    drainageChannelGroup.position.set(3.0, -2.2, 0);

    // Concrete Culvert Channel Flume (Gray concrete with depth gauge ruler)
    const flumeGeo = new THREE.BoxGeometry(3.6, 3.4, 5.0);
    const flumeMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Concrete gray
      roughness: 0.9,
    });
    const flume = new THREE.Mesh(flumeGeo, flumeMat);
    flume.receiveShadow = true;
    drainageChannelGroup.add(flume);

    // Blue Depth Markers & Flume Wireframe Rim
    const flumeEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(flumeGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
    );
    drainageChannelGroup.add(flumeEdges);

    // Metric Depth Ruler Texture on Front Face of Culvert
    const rulerCanvas = document.createElement('canvas');
    rulerCanvas.width = 128;
    rulerCanvas.height = 256;
    const ctxRuler = rulerCanvas.getContext('2d');
    if (ctxRuler) {
      ctxRuler.fillStyle = '#334155';
      ctxRuler.fillRect(0, 0, 128, 256);
      ctxRuler.fillStyle = '#e2e8f0';
      ctxRuler.font = 'bold 20px monospace';
      ctxRuler.fillText('0 cm', 20, 240);
      ctxRuler.fillText('50 cm', 20, 170);
      ctxRuler.fillText('100 cm', 20, 100);
      ctxRuler.fillText('150 cm', 20, 30);
      // Tick marks
      for (let i = 0; i <= 15; i++) {
        const y = 240 - i * 14;
        ctxRuler.fillRect(2, y, i % 5 === 0 ? 16 : 8, 2);
      }
    }
    const rulerTex = new THREE.CanvasTexture(rulerCanvas);
    const rulerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 3.2),
      new THREE.MeshBasicMaterial({ map: rulerTex })
    );
    rulerMesh.position.set(0, 0, 2.51);
    drainageChannelGroup.add(rulerMesh);

    // Dynamic Rising/Falling Water Volume in Flume
    const waterGeo = new THREE.BoxGeometry(3.4, 1.0, 4.8);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      transmission: 0.75,
      transparent: true,
      opacity: 0.85,
    });
    const waterSurface = new THREE.Mesh(waterGeo, waterMat);
    waterSurface.position.y = -0.6; // Base bottom position
    drainageChannelGroup.add(waterSurface);
    waterSurfaceRef.current = waterSurface;

    // Time-of-Flight Sonar Conical Rays connecting transducers to water
    const sonarGeo = new THREE.BufferGeometry();
    const sonarPts = new Float32Array([
      -1.5, 3.6, -1.2,  // Transmitter "T"
       0.0, 0.0,  0.0,  // Water surface impact point
       0.0, 0.0,  0.0,  // Water surface impact point
      -1.5, 3.6,  1.2,  // Receiver "R"
    ]);
    sonarGeo.setAttribute('position', new THREE.BufferAttribute(sonarPts, 3));
    const sonarBeams = new THREE.LineSegments(
      sonarGeo,
      new THREE.LineDashedMaterial({ color: 0x00f0ff, dashSize: 0.25, gapSize: 0.15 })
    );
    sonarBeams.computeLineDistances();
    drainageChannelGroup.add(sonarBeams);
    sonarBeamsRef.current = sonarBeams;

    // Acoustic Surface Ripple Ring on water
    const sonarRipple = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.55, 20),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    sonarRipple.rotation.x = -Math.PI / 2;
    drainageChannelGroup.add(sonarRipple);
    sonarRippleRef.current = sonarRipple;

    ultrasonicGroup.add(drainageChannelGroup);

    // Ultrasonic Click Target
    const usClickMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 4.6, 5.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    usClickMesh.position.set(1.5, 0.8, 0);
    ultrasonicGroup.add(usClickMesh);

    prototypeGroup.add(ultrasonicGroup);

    // Register Callout: HC-SR04 WATER LEVEL SENSOR
    componentAnchorsRef.current.push({
      id: 'ultrasonic',
      label: 'HC-SR04 WATER LEVEL SENSOR',
      sub: 'Overhead Acoustic Transducers (Non-Contact)',
      pinout: 'Trig: GPIO 18 · Echo: GPIO 5 · 5V VCC',
      anchor: new THREE.Vector3(8.8, 1.8, -1.8),
      mesh: usClickMesh,
    });

    // =========================================================================
    // 7. WATER FLOW SENSOR (Distinct Inline Pipe Component - YF-S201 style)
    // =========================================================================
    const flowSensorGroup = new THREE.Group();
    flowSensorGroup.position.set(7.0, -1.6, 2.6);

    // Horizontal PVC/Clear Drainage Pipe Running Through Sensor
    const pipeGeo = new THREE.CylinderGeometry(0.72, 0.72, 9.0, 20);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // PVC gray pipe
      roughness: 0.45,
      metalness: 0.1,
    });
    const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
    pipeMesh.rotation.z = Math.PI / 2;
    flowSensorGroup.add(pipeMesh);

    // Heavy Brass Threaded Union Nuts on Both Ends
    const createPipeCoupling = (xPos: number) => {
      const coupling = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 0.92, 0.85, 18),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
      );
      coupling.rotation.z = Math.PI / 2;
      coupling.position.x = xPos;
      flowSensorGroup.add(coupling);
    };
    createPipeCoupling(-2.4);
    createPipeCoupling(2.4);

    // Central Molded Black YF-S201 Turbine Housing
    const flowBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.35, 1.65, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
    );
    flowSensorGroup.add(flowBody);

    // Flow Direction Arrow Plate embossed on pipe
    const arrowPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    arrowPlate.position.set(0, 0.75, 0.95);
    flowSensorGroup.add(arrowPlate);

    // Transparent Top Rotor Inspection Dome
    const domeGeo = new THREE.CylinderGeometry(0.98, 0.98, 0.42, 22);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 0.32,
      roughness: 0.1,
      transparent: true,
    });
    const flowDome = new THREE.Mesh(domeGeo, domeMat);
    flowDome.position.y = 0.92;
    flowSensorGroup.add(flowDome);

    // Internal 6-Blade Red Water Turbine Rotor (Physically spins with flow!)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.y = 0.88;

    const rotorHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 })
    );
    rotorGroup.add(rotorHub);

    // 6 Red Curved Turbine Blades
    for (let b = 0; b < 6; b++) {
      const angle = (b * Math.PI) / 3;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.2, 0.09),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
      );
      blade.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
      blade.rotation.y = -angle + 0.35;
      rotorGroup.add(blade);
    }
    flowSensorGroup.add(rotorGroup);
    turbineRotorRef.current = rotorGroup;

    // Hall-Effect Wiring Exit Boss (3 wires: Red 5V, Yellow Pulse, Black GND)
    const wireBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.45, 10),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    wireBoss.position.set(-0.75, 0.85, -0.65);
    flowSensorGroup.add(wireBoss);

    // Click target
    const flowClickMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 2.6, 3.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    flowSensorGroup.add(flowClickMesh);

    prototypeGroup.add(flowSensorGroup);

    // Register Callout: WATER FLOW SENSOR
    componentAnchorsRef.current.push({
      id: 'flow_sensor',
      label: 'WATER FLOW SENSOR',
      sub: 'Inline Turbine Hall Pulse Meter',
      pinout: 'GPIO 34 (Digital Pulse) · 5V VCC',
      anchor: new THREE.Vector3(7.0, -0.2, 2.6),
      mesh: flowClickMesh,
    });

    // =========================================================================
    // 8. REALISTIC INDIVIDUAL JUMPER WIRES (DuPont wires with black connectors)
    // =========================================================================
    const createDuPontWire = (points: [number, number, number][], colorHex: number) => {
      const vPoints = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      const curve = new THREE.CatmullRomCurve3(vPoints);
      const wire = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 26, 0.058, 8, false),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 })
      );
      prototypeGroup.add(wire);

      // Black rectangular DuPont 1-pin connectors at both ends
      const shroudMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
      const sh1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.24), shroudMat);
      sh1.position.set(points[0][0], points[0][1], points[0][2]);
      const sh2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.24), shroudMat);
      sh2.position.set(points[points.length - 1][0], points[points.length - 1][1], points[points.length - 1][2]);
      prototypeGroup.add(sh1);
      prototypeGroup.add(sh2);
    };

    // 1. Red VCC (+5V Power Bus)
    createDuPontWire([[-2.4, 0.65, -1.0], [-1.4, 1.4, -1.8], [0.8, 0.55, -2.6]], 0xef4444);
    // 2. Black GND (Ground Wire)
    createDuPontWire([[-2.4, 0.65, 1.6], [-1.2, 1.2, 2.2], [0.8, 0.55, 2.6]], 0x18181b);
    // 3. Cyan Trig Wire (ESP32 GPIO 18 to Ultrasonic gland)
    createDuPontWire([[-1.5, 0.65, -1.0], [0.5, 1.3, -1.6], [4.4, 0.05, -1.5]], 0x00f0ff);
    // 4. Yellow Echo Wire (ESP32 GPIO 5 to Ultrasonic gland)
    createDuPontWire([[-1.2, 0.65, -1.0], [0.8, 1.1, -1.3], [4.4, 0.05, -1.9]], 0xfacc15);
    // 5. Orange Flow Sensor Pulse Wire (Flow gland to ESP32 GPIO 34)
    createDuPontWire([[4.4, 0.05, 2.4], [1.6, 1.2, 1.8], [-1.2, 0.65, 1.6]], 0xf97316);
    // 6. Purple Buzzer Control Wire (ESP32 GPIO 23 to Piezo Buzzer)
    createDuPontWire([[-1.8, 0.65, -1.0], [-0.4, 1.3, 0.3], [1.2, 0.6, 1.9]], 0xa855f7);
    // 7. Green LED wire (ESP32 GPIO 19)
    createDuPontWire([[-0.9, 0.65, 1.6], [0.2, 1.0, 0.0], [0.6, 0.55, -3.0]], 0x10b981);
    // 8. Yellow LED wire (ESP32 GPIO 21)
    createDuPontWire([[-0.6, 0.65, 1.6], [0.3, 0.9, 0.0], [0.6, 0.55, -1.8]], 0xf59e0b);
    // 9. Red LED wire (ESP32 GPIO 22)
    createDuPontWire([[-0.3, 0.65, 1.6], [0.4, 0.8, 0.0], [0.6, 0.55, -0.6]], 0xf43f5e);

    // =========================================================================
    // 9. ANIMATION LOOP & PROJECTION OF CALLOUT LABELS
    // =========================================================================
    let clock = new THREE.Clock();

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto rotation
      if (autoRotate) {
        cameraRotationRef.current.spherical.theta += 0.005;
        updateCameraFromSpherical();
      }

      // Rotate Water Flow Turbine Rotor at speed proportional to flowVelocity
      if (turbineRotorRef.current) {
        if (flowVelocity > 0.05) {
          turbineRotorRef.current.rotation.y += flowVelocity * 0.14;
        }
      }

      // Pulse Sonar echo ripple from sensor to water
      if (sonarRippleRef.current && waterSurfaceRef.current) {
        const pingT = (elapsedTime * 3.2) % 1;
        sonarRippleRef.current.position.y = waterSurfaceRef.current.position.y + 0.52;
        sonarRippleRef.current.scale.set(1 + pingT * 1.6, 1 + pingT * 1.6, 1);
        (sonarRippleRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 - pingT * 0.85);
      }

      // Serious Buzzer Alarm Physical Vibration and Concentric Shockwaves
      if (buzzerGroupRef.current) {
        if (isBuzzerActive || isClogged) {
          const vib = Math.sin(elapsedTime * 60) * 0.035;
          buzzerGroupRef.current.position.x = 1.8 + vib;
          buzzerGroupRef.current.position.z = 1.6 + vib * 0.8;

          buzzerRingsRef.current.forEach((ring, idx) => {
            const wOffset = (elapsedTime * 3.5 + idx * 0.33) % 1;
            ring.scale.set(1 + wOffset * 3.2, 1 + wOffset * 3.2, 1);
            ring.position.y = 1.15 + wOffset * 1.2;
            (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 - wOffset * 0.85);
          });
        } else {
          buzzerGroupRef.current.position.set(1.8, 0.24, 1.6);
          buzzerRingsRef.current.forEach((r) => {
            (r.material as THREE.MeshBasicMaterial).opacity = 0;
          });
        }
      }

      // Render 3D Scene
      renderer.render(scene, camera);

      // Project 3D Component Anchor Positions to 2D Screen Callouts
      if (container && cameraRef.current) {
        const rect = container.getBoundingClientRect();
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;

        const updatedCallouts: CalloutPosition[] = componentAnchorsRef.current.map((item) => {
          const wp = item.anchor.clone();
          wp.project(cameraRef.current!);

          // Check if component is in front of camera
          const isVisible = wp.z < 1.0;
          const screenX = wp.x * halfW + halfW;
          const screenY = -wp.y * halfH + halfH;

          return {
            id: item.id,
            label: item.label,
            sub: item.sub,
            pinout: item.pinout,
            x: screenX,
            y: screenY,
            visible: isVisible,
            anchorWorld: item.anchor,
          };
        });

        setCallouts(updatedCallouts);
      }
    };

    animate();

    // =========================================================================
    // 10. MOUSE & TOUCH ORBIT CONTROLS
    // =========================================================================
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / container.clientWidth) * 2 - 1,
        -((e.clientY - rect.top) / container.clientHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const hitMeshes = componentAnchorsRef.current.map((c) => c.mesh);
      const intersects = raycaster.intersectObjects(hitMeshes, true);

      if (intersects.length > 0) {
        const found = componentAnchorsRef.current.find((c) => c.mesh === intersects[0].object);
        if (found) {
          setHoveredComponent(found.id);
          container.style.cursor = 'pointer';
        }
      } else {
        setHoveredComponent(null);
        container.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
      }

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        cameraRotationRef.current.spherical.theta -= deltaX * 0.007;
        cameraRotationRef.current.spherical.phi -= deltaY * 0.007;
        updateCameraFromSpherical();

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = 'grab';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / container.clientWidth) * 2 - 1,
        -((e.clientY - rect.top) / container.clientHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const hitMeshes = componentAnchorsRef.current.map((c) => c.mesh);
      const intersects = raycaster.intersectObjects(hitMeshes, true);

      if (intersects.length > 0) {
        const found = componentAnchorsRef.current.find((c) => c.mesh === intersects[0].object);
        if (found) {
          onSelectComponent(found.id);
          setActiveInspector(found.id);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.012;
      cameraRotationRef.current.spherical.radius = Math.max(
        8,
        Math.min(26, cameraRotationRef.current.spherical.radius + zoomDelta)
      );
      updateCameraFromSpherical();
    };

    // Mobile touch
    let tStartX = 0;
    let tStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        tStartX = e.touches[0].clientX;
        tStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const dX = e.touches[0].clientX - tStartX;
        const dY = e.touches[0].clientY - tStartY;
        cameraRotationRef.current.spherical.theta -= dX * 0.007;
        cameraRotationRef.current.spherical.phi -= dY * 0.007;
        updateCameraFromSpherical();
        tStartX = e.touches[0].clientX;
        tStartY = e.touches[0].clientY;
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('click', handleClick);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update dynamic properties when waterLevel, flowVelocity, or isClogged changes
  useEffect(() => {
    // 1. Physically rise/lower water volume under ultrasonic sensor
    if (waterSurfaceRef.current) {
      const norm = Math.max(0, Math.min(100, waterLevel)) / 100;
      // Target Y from -0.6 to +1.2
      const targetY = -0.6 + norm * 1.7;
      waterSurfaceRef.current.position.y = targetY;
      waterSurfaceRef.current.scale.set(1, 0.4 + norm * 1.6, 1);

      const waterMat = waterSurfaceRef.current.material as THREE.MeshPhysicalMaterial;
      if (norm >= 0.8 || isClogged) {
        waterMat.color.setHex(0xf43f5e); // Danger red
        waterMat.emissive.setHex(0x9f1239);
      } else if (norm >= 0.5) {
        waterMat.color.setHex(0xf59e0b); // Warning amber
        waterMat.emissive.setHex(0xb45309);
      } else {
        waterMat.color.setHex(0x00f0ff); // Normal clear cyan
        waterMat.emissive.setHex(0x0284c7);
      }
    }

    // 2. Update Status LED Colors and Dynamic Point Lights
    const isCritical = waterLevel >= 80 || isClogged;
    const isWarning = waterLevel >= 50 && !isCritical;

    // GREEN LED – NORMAL
    if (greenLedMatRef.current && greenLedLightRef.current) {
      const active = !isWarning && !isCritical;
      greenLedMatRef.current.emissiveIntensity = active ? 1.5 : 0.08;
      greenLedLightRef.current.intensity = active ? 2.2 : 0;
    }

    // YELLOW LED – WARNING
    if (yellowLedMatRef.current && yellowLedLightRef.current) {
      yellowLedMatRef.current.emissiveIntensity = isWarning ? 1.6 : 0.08;
      yellowLedLightRef.current.intensity = isWarning ? 2.4 : 0;
    }

    // RED LED – CRITICAL
    if (redLedMatRef.current && redLedLightRef.current) {
      redLedMatRef.current.emissiveIntensity = isCritical ? 2.2 : 0.08;
      redLedLightRef.current.intensity = isCritical ? 3.5 : 0;
    }
  }, [waterLevel, flowVelocity, isClogged]);

  // Camera presets
  const setCameraPreset = (preset: 'ISO' | 'TOP' | 'FRONT' | 'SENSOR') => {
    if (preset === 'ISO') {
      cameraRotationRef.current.spherical = { radius: 18.0, theta: Math.PI / 4.2, phi: Math.PI / 3.3 };
    } else if (preset === 'TOP') {
      cameraRotationRef.current.spherical = { radius: 16.0, theta: 0, phi: 0.1 };
    } else if (preset === 'FRONT') {
      cameraRotationRef.current.spherical = { radius: 16.0, theta: 0, phi: Math.PI / 2.2 };
    } else if (preset === 'SENSOR') {
      cameraRotationRef.current.spherical = { radius: 11.0, theta: Math.PI / 2.6, phi: Math.PI / 3.8 };
    }
    updateCameraFromSpherical();
  };

  const distanceToSensorCm = Math.max(5, Math.round(150 - (waterLevel * 150) / 100));

  const activeCalloutData = callouts.find((c) => c.id === (activeInspector || selectedComponentId));

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] rounded-xl overflow-hidden bg-gradient-to-b from-[#030712] via-[#070e1c] to-[#040813] select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Title Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#08101e]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-800/60 text-xs font-mono">
        <span className="text-cyan-400 font-bold flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>STUDENT IOT FLOOD RIG</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-[11px] text-slate-300 hidden sm:inline">
          Educational Prototyping Showcase
        </span>
      </div>

      {/* Camera Presets & Callout Toggle */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#08101e]/90 backdrop-blur-md p-1 rounded-lg border border-cyan-800/60 text-xs font-mono">
        <button
          onClick={() => setShowCallouts(!showCallouts)}
          className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
            showCallouts ? 'bg-cyan-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
          title="Toggle Component Callout Labels"
        >
          {showCallouts ? <Tag className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>LABELS</span>
        </button>
        <span className="text-slate-700">|</span>
        <button
          onClick={() => setCameraPreset('ISO')}
          className="px-2 py-1 rounded hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-[11px] font-semibold transition-colors"
          title="Isometric View"
        >
          ISO
        </button>
        <button
          onClick={() => setCameraPreset('SENSOR')}
          className="px-2 py-1 rounded hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-[11px] font-semibold transition-colors text-cyan-300"
          title="Zoom to Ultrasonic Sensor & Water Culvert"
        >
          SENSORS
        </button>
        <button
          onClick={() => setCameraPreset('TOP')}
          className="px-2 py-1 rounded hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-[11px] font-semibold transition-colors"
          title="Top-Down Enclosure View"
        >
          TOP
        </button>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded transition-colors ${
            autoRotate ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
          title={autoRotate ? 'Pause 3D Turntable' : 'Auto-Rotate 3D Model'}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2D SCREEN-SPACE CALLOUT LABELS (Pointing Directly to Each Physical Component) */}
      {showCallouts &&
        callouts.map((callout) => {
          if (!callout.visible) return null;
          const isSelected = selectedComponentId === callout.id || activeInspector === callout.id;
          const isHovered = hoveredComponent === callout.id;

          return (
            <div
              key={callout.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectComponent(callout.id);
                setActiveInspector(callout.id);
              }}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-full cursor-pointer transition-transform z-20 group"
              style={{
                left: `${callout.x}px`,
                top: `${callout.y - 10}px`,
              }}
            >
              {/* Leader Pointer Line & Target Dot */}
              <div className="flex flex-col items-center">
                {/* Clean Educational Callout Badge */}
                <div
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-tight shadow-xl flex items-center gap-1.5 border transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-400 scale-110 ring-2 ring-cyan-400/80 shadow-cyan-950/80'
                      : isHovered
                      ? 'bg-slate-900 text-white border-white scale-105 shadow-lg'
                      : 'bg-[#08101e]/90 text-slate-200 border-slate-700/90 hover:border-cyan-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callout.id === 'led_red' && (waterLevel >= 80 || isClogged)
                        ? 'bg-rose-500 animate-ping'
                        : callout.id === 'led_green' && waterLevel < 50
                        ? 'bg-emerald-400'
                        : callout.id === 'led_yellow' && waterLevel >= 50 && waterLevel < 80
                        ? 'bg-amber-400'
                        : callout.id === 'buzzer' && (isBuzzerActive || isClogged)
                        ? 'bg-rose-400 animate-bounce'
                        : 'bg-cyan-400'
                    }`}
                  />
                  <span>{callout.label}</span>
                </div>

                {/* Vertical Leader Line */}
                <div className="w-0.5 h-3 bg-cyan-400/80" />
                {/* Anchor Target Dot directly on component */}
                <div className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-900/90" />
              </div>
            </div>
          );
        })}

      {/* Floating Component Inspection Drawer / Card */}
      {activeCalloutData && activeInspector && (
        <div className="absolute top-14 left-3 z-30 max-w-xs bg-[#08101e]/95 backdrop-blur-md p-3.5 rounded-xl border border-cyan-500/70 shadow-2xl text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start justify-between gap-2 border-b border-cyan-900/60 pb-2 mb-2">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase block">
                COMPONENT INSPECTION
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{activeCalloutData.label}</h4>
            </div>
            <button
              onClick={() => setActiveInspector(null)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
            {activeCalloutData.sub}
          </p>
          <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 mb-2">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">WIRING & PIN CONNECTIONS:</span>
            <span className="text-[10px] text-cyan-300 font-semibold mt-0.5 block">
              {activeCalloutData.pinout}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Enclosure: IP65 Clear Box</span>
            <span className="text-emerald-400">STATUS: ACTIVE</span>
          </div>
        </div>
      )}

      {/* Floating Bottom Telemetry Strip */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#070e1b]/95 backdrop-blur-md border border-cyan-900/60 text-[11px] font-mono text-slate-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                waterLevel >= 80 || isClogged
                  ? 'bg-rose-500 animate-ping'
                  : waterLevel >= 50
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-bold text-white">
              ULTRASONIC ECHO: {distanceToSensorCm} cm {distanceToSensorCm <= 20 ? '(CLOSING IN!)' : ''}
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-cyan-300 hidden sm:inline">
            Flow Turbine: {flowVelocity.toFixed(1)} m/s ({Math.round(flowVelocity * 12)} L/min)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 hidden sm:inline">ENCLOSURE:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
            TRANSPARENT WATERPROOF IP65
          </span>
        </div>
      </div>
    </div>
  );
};
