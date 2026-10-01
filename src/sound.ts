// ── Sound effects ──
// Synthesised with the Web Audio API so there are no audio assets to ship.
// iOS only lets audio start after a user gesture, so the context is resumed on
// the first touch; anything played before that is silently dropped.

const MUTE_KEY = 'ht-muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
const listeners = new Set<(muted: boolean) => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);
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
    lfo.start(t0);
    lfo.stop(t0 + o.dur);
  }

  const vol = o.vol ?? 0.3;
  const attack = o.attack ?? 0.005;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  osc.connect(gain).connect(master!);
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
  src.start(t0);
  src.stop(t0 + o.dur);
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
  /** App ready — two referee whistle blasts. */
  load: () =>
    play((c) => {
      tone(c, { freq: 2600, dur: 0.14, vol: 0.12, type: 'sine', vibrato: { rate: 28, depth: 90 } });
      tone(c, { freq: 2600, start: 0.2, dur: 0.32, vol: 0.12, type: 'sine', vibrato: { rate: 28, depth: 90 } });
    }),

  /** Generic button press. */
  tap: () =>
    play((c) => {
      tone(c, { freq: 1100, to: 600, dur: 0.06, vol: 0.12, type: 'triangle' });
    }),

  /** Question sheet slides in. */
  open: () =>
    play((c) => {
      noise(c, { dur: 0.25, vol: 0.12, from: 400, to: 3000 });
      tone(c, { freq: 330, to: 660, dur: 0.18, vol: 0.12, type: 'triangle' });
    }),

  /** Answer option highlighted. */
  select: () =>
    play((c) => {
      tone(c, { freq: 900, dur: 0.05, vol: 0.14, type: 'square' });
    }),

  /** Correct answer — net swish plus a rising arpeggio. */
  correct: () =>
    play((c) => {
      noise(c, { dur: 0.22, vol: 0.18, from: 5000, to: 1500 });
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) =>
        tone(c, { freq: f, start: 0.08 + i * 0.08, dur: i === 3 ? 0.45 : 0.16, vol: 0.2, type: 'triangle' })
      );
    }),

  /** Wrong answer — low shot-clock buzzer. */
  wrong: () =>
    play((c) => {
      tone(c, { freq: 140, dur: 0.5, vol: 0.18, type: 'sawtooth', attack: 0.01 });
      tone(c, { freq: 147, dur: 0.5, vol: 0.18, type: 'sawtooth', attack: 0.01 });
    }),

  /** Power-up activated — rising zap. */
  powerUp: () =>
    play((c) => {
      tone(c, { freq: 400, to: 1600, dur: 0.28, vol: 0.16, type: 'sine', vibrato: { rate: 18, depth: 60 } });
      tone(c, { freq: 800, to: 3200, start: 0.05, dur: 0.22, vol: 0.06, type: 'triangle' });
    }),

  /** Final buzzer, then a fanfare (or a flat resolve for a tie). */
  final: (tie: boolean) =>
    play((c) => {
      tone(c, { freq: 220, dur: 0.7, vol: 0.16, type: 'square', attack: 0.01 });
      tone(c, { freq: 223, dur: 0.7, vol: 0.12, type: 'sawtooth', attack: 0.01 });
      const notes = tie ? [NOTE.G4, NOTE.C5, NOTE.G4] : [NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6];
      notes.forEach((f, i) => {
        const last = i === notes.length - 1;
        tone(c, { freq: f, start: 0.85 + i * 0.12, dur: last ? 0.9 : 0.2, vol: 0.2, type: 'triangle' });
        if (last && !tie) tone(c, { freq: f / 2, start: 0.85 + i * 0.12, dur: 0.9, vol: 0.12, type: 'triangle' });
      });
    }),
};
