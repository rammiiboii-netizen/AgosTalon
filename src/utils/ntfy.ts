// ntfy.sh Municipal Emergency Push Notification Service
// Publishes real-time IoT Prototype dial data to the "barangay-drain-TDCSHS" ntfy subscription

export const NTFY_TOPIC = 'barangay-drain-TDCSHS';
export const NTFY_SERVER_URL = `https://ntfy.sh/${NTFY_TOPIC}`;

export interface NtfyAlertPayload {
  nodeCode: string;
  nodeName: string;
  locationDesc: string;
  waterLevel: number;        // From Ultrasonic dial: 0 - 100%
  distanceToSensorCm: number;// Distance closing in to HC-SR04 sensor (cm)
  waterDepthCm: number;      // Actual culvert water height (cm)
  flowVelocity: number;      // From Potentiometer dial: 0.0 - 2.5 m/s
  isClogged: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  officerBadge?: string;
}

export interface NtfyResponseResult {
  success: boolean;
  topic: string;
  timestamp: string;
  error?: string;
  statusType: 'CRITICAL' | 'WARNING' | 'NORMAL';
}

/**
 * Transmits a municipal push notification to ntfy subscription "barangay-drain-TDCSHS"
 * Uses server-side /api/ntfy proxy with direct text/plain JSON fallback for 100% reliability.
 */
export async function transmitNtfyMunicipalAlert(
  data: NtfyAlertPayload
): Promise<NtfyResponseResult> {
  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const isCritical =
    data.severity === 'CRITICAL' ||
    data.isClogged ||
    data.waterLevel >= 80 ||
    (data.waterLevel >= 68 && data.flowVelocity <= 0.6);

  const isWarning =
    !isCritical &&
    (data.severity === 'WARNING' || data.waterLevel >= 50 || data.flowVelocity <= 0.8);

  const statusType: 'CRITICAL' | 'WARNING' | 'NORMAL' = isCritical
    ? 'CRITICAL'
    : isWarning
    ? 'WARNING'
    : 'NORMAL';

  // Construct titles (avoid unicode in HTTP headers by placing into JSON body)
  let title = '';
  let priority = 3;
  let tags: string[] = ['droplet'];

  if (statusType === 'CRITICAL') {
    title = `[CRITICAL ALERT] Clogged Drain: ${data.nodeCode} - ${data.nodeName.split('//')[0].trim()}`;
    priority = 5; // Urgent
    tags = ['rotating_light', 'warning', 'water_droplet'];
  } else if (statusType === 'WARNING') {
    title = `[WARNING ADVISORY] Elevated Water: ${data.nodeCode} - ${data.nodeName.split('//')[0].trim()}`;
    priority = 4; // High
    tags = ['warning', 'droplet'];
  } else {
    title = `[NORMAL STATUS] Nominal Flow: ${data.nodeCode} - ${data.nodeName.split('//')[0].trim()}`;
    priority = 3; // Default
    tags = ['white_check_mark', 'droplet'];
  }

  // Construct structured message body with all dial metrics and drainage condition
  const flowLitersPerMin = Math.round(data.flowVelocity * 12);
  const adcReading = Math.round((data.flowVelocity / 2.5) * 4095);

  const messageLines = [
    `BARANGAY TALON DOS MUNICIPAL FLOOD TELEMETRY`,
    `========================================`,
    `STATUS: ${statusType === 'CRITICAL' ? 'CRITICAL BLOCKAGE / CLOGGED' : statusType === 'WARNING' ? 'WARNING (RESTRICTED RUNOFF)' : 'NORMAL (CLEAR / GRAVITY FLOW)'}`,
    `DRAINAGE NODE: ${data.nodeCode} - ${data.nodeName}`,
    `ROAD CORRIDOR: ${data.locationDesc}`,
    ``,
    `IOT PROTOTYPE LIVE DIAL TELEMETRY:`,
    `• Ultrasonic Water Proximity: ${data.waterLevel}% (${data.waterDepthCm} cm water depth)`,
    `• Clearance to Ultrasonic Sensor: ${data.distanceToSensorCm} cm ${data.distanceToSensorCm <= 25 ? '(! CLOSING IN !)' : '(safe clearance)'}`,
    `• Potentiometer Flow Velocity: ${data.flowVelocity.toFixed(1)} m/s (~${flowLitersPerMin} L/min, ADC: ${adcReading}/4095)`,
    `• Hydraulic State: ${
      isCritical
        ? 'STAGNANT / BACKFLOW (Debris Obstruction Suspected)'
        : isWarning
        ? 'SLUGGISH RESTRICTION'
        : 'ACTIVE GRAVITY CONVEYANCE'
    }`,
    ``,
    `MUNICIPAL ACTION: ${
      isCritical
        ? 'Immediate CENRO maintenance & desiltation dispatch required.'
        : isWarning
        ? 'Continuous telemetry monitoring & field inspection advised.'
        : 'Nominal gravity drainage. No emergency response needed.'
    }`,
    `OFFICER: ${data.officerBadge || 'ENG-LP-9104 (LGU Las Pinas)'}`,
    `TIMESTAMP: ${timestamp}`,
  ];

  const bodyText = messageLines.join('\n');

  const jsonPayload = {
    topic: NTFY_TOPIC,
    title,
    message: bodyText,
    priority,
    tags,
    click: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // Attempt 1: Server-side proxy /api/ntfy (when running dev/node server)
  try {
    const proxyResponse = await fetch('/api/ntfy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonPayload),
    });

    const contentType = proxyResponse.headers.get('content-type') || '';
    if (proxyResponse.ok && contentType.includes('application/json')) {
      const resJson = await proxyResponse.json().catch(() => null);
      if (resJson && (resJson.id || resJson.topic || resJson.event)) {
        return {
          success: true,
          topic: NTFY_TOPIC,
          timestamp,
          statusType,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('/api/ntfy proxy unavailable, attempting direct ntfy.sh simple request fallback:', proxyErr);
  }

  // Attempt 2: Direct ntfy.sh POST using text/plain (CORS-safelisted simple request, no preflight needed!)
  try {
    const directResponse = await fetch('https://ntfy.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(jsonPayload),
    });

    if (directResponse.ok) {
      return {
        success: true,
        topic: NTFY_TOPIC,
        timestamp,
        statusType,
      };
    }

    const errDetail = await directResponse.text().catch(() => '');
    throw new Error(`ntfy server returned HTTP ${directResponse.status}: ${errDetail || directResponse.statusText}`);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('All transmission attempts to ntfy failed:', errMsg);
    return {
      success: false,
      topic: NTFY_TOPIC,
      timestamp,
      error: errMsg,
      statusType,
    };
  }
}
