// Web Audio API Disaster-Grade Industrial Emergency Piezo Buzzer Synthesizer
// Simulates high-decibel (85-90dB) resonant active piezo transducer with dual-tone frequency modulation

let audioCtx: AudioContext | null = null;
let activeLoopNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
let loopTimeoutId: number | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Serious Industrial Emergency Piezo Siren
 * Emits a high-urgency multi-pulse alarm burst typical of flood early-warning telemetry
 */
export function playSeriousEmergencyBuzzer(pulseCount = 4, onComplete?: () => void) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulseDuration = 0.14; // 140ms per burst
    const pulseGap = 0.08;      // 80ms gap
    const totalDuration = pulseCount * (pulseDuration + pulseGap) + 0.1;

    // Master gain with comfortable, well-balanced volume level (lowered to 0.042)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.042, now);

    // Dynamic wave-shaping with gentle soft clipping
    const waveShaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (1.2 * x) / (1 + Math.abs(x));
    }
    waveShaper.curve = curve;

    // Smooth lowpass filter to tame harsh harmonics
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, now);

    masterGain.connect(waveShaper);
    waveShaper.connect(filter);
    filter.connect(ctx.destination);

    // Dual-tone resonant oscillators (simulating piezo chamber resonances)
    for (let i = 0; i < pulseCount; i++) {
      const startTime = now + i * (pulseDuration + pulseGap);
      const stopTime = startTime + pulseDuration;

      // Primary resonant tone (2850Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      // Slight pitch droop characteristic of active DC buzzers under load
      osc1.frequency.setValueAtTime(2950, startTime);
      osc1.frequency.exponentialRampToValueAtTime(2780, stopTime);

      // Overtone harmonic (3720Hz)
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(3720, startTime);
      osc2.frequency.exponentialRampToValueAtTime(3640, stopTime);

      // Pulse Envelope
      const pulseGain = ctx.createGain();
      pulseGain.gain.setValueAtTime(0.0001, startTime);
      pulseGain.gain.linearRampToValueAtTime(1.0, startTime + 0.012); // Fast 12ms attack
      pulseGain.gain.setValueAtTime(1.0, stopTime - 0.02);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);   // Fast decay

      osc1.connect(pulseGain);
      osc2.connect(pulseGain);
      pulseGain.connect(masterGain);

      osc1.start(startTime);
      osc1.stop(stopTime);
      osc2.start(startTime);
      osc2.stop(stopTime);
    }

    if (onComplete) {
      setTimeout(onComplete, Math.round(totalDuration * 1000));
    }
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

/**
 * Continuous Evacuation Siren Loop (used for severe flood alerts)
 */
export function startContinuousSeriousSiren(durationSec = 3.5, onEnd?: () => void) {
  stopContinuousSiren();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Emergency warble LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(6.5, now); // 6.5 Hz fast warble

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(320, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.frequency.setValueAtTime(2800, now);
    osc2.frequency.setValueAtTime(3600, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.05);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, now);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    activeLoopNodes = { osc1, osc2, gain };

    loopTimeoutId = window.setTimeout(() => {
      stopContinuousSiren();
      if (onEnd) onEnd();
    }, durationSec * 1000);
  } catch (e) {
    console.warn('Audio error', e);
  }
}

export function stopContinuousSiren() {
  if (loopTimeoutId) {
    clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }
  if (activeLoopNodes) {
    try {
      const { osc1, osc2, gain } = activeLoopNodes;
      if (audioCtx) {
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {}
        }, 60);
      }
    } catch {}
    activeLoopNodes = null;
  }
}

// Backwards compatibility aliases
export function playBuzzerBeep(durationMs = 400, frequency = 2800) {
  playSeriousEmergencyBuzzer(2);
}

export function triggerDoubleAlertBeep() {
  playSeriousEmergencyBuzzer(4);
}

export function triggerCriticalAlarmPattern() {
  startContinuousSeriousSiren(3.0);
}
