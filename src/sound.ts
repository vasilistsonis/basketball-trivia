// ── Sound effects ──
// Synthesised with the Web Audio API so there are no audio assets to ship.
// iOS only lets audio start after a user gesture, so the context is resumed on
// the first touch; anything played before that is silently dropped.

const MUTE_KEY = 'ht-muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
const listeners = new Set<(muted: boolean) => void>();

// An explicit choice from the toggle wins; otherwise treat Reduce Motion as a
// signal the player prefers a quieter experience and start muted.
function readMuted(): boolean {
  try {
    const stored = localStorage.getItem(MUTE_KEY);
    if (stored !== null) return stored === '1';
  } catch {
    // Storage unavailable — fall through to the system preference.
  }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  // Compressor keeps layered sounds (e.g. swish + arpeggio) loud without clipping.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 6;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.15;
  limiter.connect(ctx.destination);
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(limiter);
  return ctx;
}

function unlock() {
  const c = getCtx();
  if (c && c.state !== 'running') c.resume().catch(() => {});
}
['pointerdown', 'touchstart', 'keydown'].forEach((evt) =>
  window.addEventListener(evt, unlock, { capture: true, passive: true })
);

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // Storage unavailable — keep the in-memory value.
  }
  listeners.forEach((fn) => fn(value));
}

export function onMuteChange(fn: (muted: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ── Building blocks ──

/** Disconnect a sound's nodes once its source finishes so the graph doesn't grow. */
function disconnectOnEnd(source: AudioScheduledSourceNode, ...nodes: AudioNode[]) {
  source.onended = () => {
    source.disconnect();
    nodes.forEach((n) => n.disconnect());
  };
}

interface ToneOpts {
  freq: number;
  to?: number;          // glide target frequency
  type?: OscillatorType;
  start?: number;       // seconds from now
  dur: number;
  vol?: number;
  attack?: number;
  vibrato?: { rate: number; depth: number };
}

function tone(c: AudioContext, o: ToneOpts) {
  const t0 = c.currentTime + (o.start ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);

  if (o.vibrato) {
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = o.vibrato.rate;
    lfoGain.gain.value = o.vibrato.depth;
    lfo.connect(lfoGain).connect(osc.frequency);
    disconnectOnEnd(lfo, lfoGain);
    lfo.start(t0);
    lfo.stop(t0 + o.dur);
  }

  const vol = o.vol ?? 0.3;
  const attack = o.attack ?? 0.005;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  osc.connect(gain).connect(master!);
  disconnectOnEnd(osc, gain);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.02);
}

function noise(c: AudioContext, o: { start?: number; dur: number; vol?: number; from: number; to: number }) {
  const t0 = c.currentTime + (o.start ?? 0);
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * o.dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(o.from, t0);
  filter.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(o.vol ?? 0.3, t0 + o.dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  src.connect(filter).connect(gain).connect(master!);
  disconnectOnEnd(src, filter, gain);
  src.start(t0);
  src.stop(t0 + o.dur);
}

// ── Arena intro building blocks ──

let reverb: ConvolverNode | null = null;

/** Big-gym reverb: a synthetic impulse response of decaying stereo noise. */
function getReverb(c: AudioContext): AudioNode {
  if (reverb) return reverb;
  const len = Math.floor(c.sampleRate * 1.8);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  reverb = c.createConvolver();
  reverb.buffer = ir;
  const wet = c.createGain();
  wet.gain.value = 0.3;
  reverb.connect(wet).connect(master!);
  return reverb;
}

/** Send a node to the master bus plus some of it into the gym reverb. */
function toArena(c: AudioContext, node: AudioNode, wet: number) {
  node.connect(master!);
  const send = c.createGain();
  send.gain.value = wet;
  node.connect(send).connect(getReverb(c));
}

/** Crowd murmur that swells into a cheer: pink noise through vocal-range bands. */
function crowd(c: AudioContext, t0: number, dur: number, vol: number, cheerAt: number) {
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      d[i] = (b0 + b1 + b2 + white * 0.1848) * 0.25;
    }
  }
  const src = c.createBufferSource();
  src.buffer = buf;

  const bus = c.createGain();
  [
    { f: 450, q: 0.8, g: 1 },
    { f: 1100, q: 1.2, g: 0.8 },
    { f: 2600, q: 1.5, g: 0.35 },
  ].forEach((b) => {
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = b.f;
    bp.Q.value = b.q;
    const g = c.createGain();
    g.gain.value = b.g;
    src.connect(bp).connect(g).connect(bus);
  });

  // Uneven swells so it reads as a crowd breathing, not steady hiss.
  const env = bus.gain;
  env.setValueAtTime(0.0001, t0);
  env.linearRampToValueAtTime(vol * 0.6, t0 + 0.5);
  for (let t = t0 + 0.75; t < t0 + cheerAt - 0.3; t += 0.25) {
    env.linearRampToValueAtTime(vol * (0.5 + Math.random() * 0.25), t);
  }
  env.linearRampToValueAtTime(vol * 1.4, t0 + cheerAt + 0.35);
  env.linearRampToValueAtTime(vol * 1.1, t0 + dur - 0.6);
  env.exponentialRampToValueAtTime(0.0001, t0 + dur);

  toArena(c, bus, 0.25);
  disconnectOnEnd(src, bus);
  src.start(t0);
  src.stop(t0 + dur);
}

/** Ball hitting hardwood: a falling low thump plus a short leather slap. */
function dribble(c: AudioContext, t: number, vol: number) {
  const osc = c.createOscillator();
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(g);
  toArena(c, g, 0.6);
  disconnectOnEnd(osc, g);
  osc.start(t);
  osc.stop(t + 0.2);

  const slapLen = Math.ceil(c.sampleRate * 0.03);
  const slap = c.createBuffer(1, slapLen, c.sampleRate);
  const d = slap.getChannelData(0);
  for (let i = 0; i < slapLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / slapLen);
  const src = c.createBufferSource();
  src.buffer = slap;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const sg = c.createGain();
  sg.gain.value = vol * 0.5;
  src.connect(lp).connect(sg);
  toArena(c, sg, 0.6);
  disconnectOnEnd(src, lp, sg);
  src.start(t);
}

/** Sneaker squeak: a resonant chirp with stick-slip roughness. */
function squeak(c: AudioContext, t: number, f: number, vol: number, dur = 0.11) {
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(f * 0.85, t);
  osc.frequency.exponentialRampToValueAtTime(f * 1.12, t + dur * 0.35);
  osc.frequency.exponentialRampToValueAtTime(f * 0.95, t + dur);

  const jitter = c.createOscillator();
  jitter.type = 'square';
  jitter.frequency.value = 70;
  const jitterDepth = c.createGain();
  jitterDepth.gain.value = f * 0.03;
  jitter.connect(jitterDepth).connect(osc.frequency);

  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 6;
  bp.frequency.setValueAtTime(f, t);
  bp.frequency.exponentialRampToValueAtTime(f * 1.1, t + dur * 0.35);

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.setValueAtTime(vol, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(bp).connect(g);
  toArena(c, g, 0.5);
  disconnectOnEnd(osc, bp, g);
  disconnectOnEnd(jitter, jitterDepth);
  [osc, jitter].forEach((o) => {
    o.start(t);
    o.stop(t + dur + 0.02);
  });
}

/** Referee's pea whistle: a bright tone with the pea's fast rattle. */
function whistle(c: AudioContext, t: number, dur: number, vol: number) {
  const osc = c.createOscillator();
  osc.frequency.setValueAtTime(2950, t);
  osc.frequency.setValueAtTime(2950, t + dur - 0.06);
  osc.frequency.exponentialRampToValueAtTime(2700, t + dur);
  const overtone = c.createOscillator();
  overtone.frequency.value = 5900;
  const overtoneGain = c.createGain();
  overtoneGain.gain.value = 0.15;

  const rattle = c.createOscillator();
  rattle.frequency.value = 38;
  const am = c.createGain();
  am.gain.value = 0.65;
  const amDepth = c.createGain();
  amDepth.gain.value = 0.35;
  rattle.connect(amDepth).connect(am.gain);
  const fmDepth = c.createGain();
  fmDepth.gain.value = 70;
  rattle.connect(fmDepth).connect(osc.frequency);

  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  env.gain.setValueAtTime(vol, t + dur - 0.05);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(am);
  overtone.connect(overtoneGain).connect(am);
  am.connect(env);
  toArena(c, env, 0.7);
  disconnectOnEnd(osc, am, env);
  disconnectOnEnd(overtone, overtoneGain);
  disconnectOnEnd(rattle, amDepth, fmDepth);
  [osc, overtone, rattle].forEach((o) => {
    o.start(t);
    o.stop(t + dur + 0.02);
  });
}

function play(fn: (c: AudioContext) => void) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'running') {
    fn(c);
    return;
  }
  // Not unlocked yet (e.g. the launch sound). Try to resume; if it doesn't
  // happen promptly, drop the sound rather than playing it late.
  const requestedAt = performance.now();
  c.resume()
    .then(() => {
      if (performance.now() - requestedAt < 400) fn(c);
    })
    .catch(() => {});
}

// ── Sound library ──

const NOTE = { G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 };

export const sfx = {
  /** App ready — game-night arena: crowd, dribbles, sneaker squeaks, ref whistle. */
  load: () =>
    play((c) => {
      const t0 = c.currentTime + 0.05;
      crowd(c, t0, 3.6, 0.35, 2.2);
      [0.25, 0.65, 1.05, 1.45, 1.85].forEach((t, i) => dribble(c, t0 + t, 0.6 - i * 0.05));
      squeak(c, t0 + 0.5, 2350, 0.4);
      squeak(c, t0 + 0.58, 2700, 0.35, 0.08);
      squeak(c, t0 + 1.15, 2100, 0.4, 0.14);
      squeak(c, t0 + 1.6, 2550, 0.35);
      squeak(c, t0 + 1.68, 2900, 0.3, 0.07);
      whistle(c, t0 + 2.15, 0.12, 0.35);
      whistle(c, t0 + 2.35, 0.55, 0.35);
    }),

  /** Question sheet slides in. */
  open: () =>
    play((c) => {
      noise(c, { dur: 0.25, vol: 0.3, from: 400, to: 3000 });
      tone(c, { freq: 330, to: 660, dur: 0.18, vol: 0.3, type: 'triangle' });
    }),

  /** Correct answer — net swish plus a rising arpeggio. */
  correct: () =>
    play((c) => {
      noise(c, { dur: 0.22, vol: 0.45, from: 5000, to: 1500 });
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) =>
        tone(c, { freq: f, start: 0.08 + i * 0.08, dur: i === 3 ? 0.45 : 0.16, vol: 0.5, type: 'triangle' })
      );
    }),

  /** Wrong answer — a soft falling two-note "miss", informative rather than punishing. */
  wrong: () =>
    play((c) => {
      tone(c, { freq: 392, to: 370, dur: 0.18, vol: 0.4, type: 'triangle', attack: 0.01 });
      tone(c, { freq: 311, to: 277, start: 0.16, dur: 0.38, vol: 0.4, type: 'triangle', attack: 0.01 });
    }),

  /** Power-up activated — rising zap. */
  powerUp: () =>
    play((c) => {
      tone(c, { freq: 400, to: 1600, dur: 0.28, vol: 0.4, type: 'sine', vibrato: { rate: 18, depth: 60 } });
      tone(c, { freq: 800, to: 3200, start: 0.05, dur: 0.22, vol: 0.15, type: 'triangle' });
    }),

  /** Final buzzer, then a fanfare (or a flat resolve for a tie). */
  final: (tie: boolean) =>
    play((c) => {
      tone(c, { freq: 220, dur: 0.7, vol: 0.4, type: 'square', attack: 0.01 });
      tone(c, { freq: 223, dur: 0.7, vol: 0.3, type: 'sawtooth', attack: 0.01 });
      const notes = tie ? [NOTE.G4, NOTE.C5, NOTE.G4] : [NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6];
      notes.forEach((f, i) => {
        const last = i === notes.length - 1;
        tone(c, { freq: f, start: 0.85 + i * 0.12, dur: last ? 0.9 : 0.2, vol: 0.5, type: 'triangle' });
        if (last && !tie) tone(c, { freq: f / 2, start: 0.85 + i * 0.12, dur: 0.9, vol: 0.3, type: 'triangle' });
      });
    }),
};
