// GAA Career — tiny procedural sound effects via WebAudio.
// No audio files: everything here is a couple of oscillators/noise bursts.
// Safe to call from anywhere; silently no-ops if WebAudio is unavailable
// or the context hasn't been unlocked by a user gesture yet.

(function () {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if (muted) return null;
    if (ctx) return ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    return ctx;
  }

  function unlock() {
    const c = getCtx();
    if (c && c.state === "suspended") c.resume();
  }

  function tone(freq, start, dur, { type = "sine", gain = 0.18, glideTo = null } = {}) {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, c.currentTime + start + dur);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    osc.connect(g).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.02);
  }

  function noiseBurst(start, dur, { gain = 0.15, filterFreq = 1800 } = {}) {
    const c = getCtx();
    if (!c) return;
    const bufferSize = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(c.currentTime + start);
  }

  const SFX = {
    unlock,
    setMuted(v) { muted = !!v; },
    isMuted() { return muted; },
    whistle() {
      tone(2200, 0, 0.16, { type: "square", gain: 0.1 });
      tone(2200, 0.2, 0.28, { type: "square", gain: 0.1 });
    },
    tick() {
      tone(900, 0, 0.05, { type: "square", gain: 0.06 });
    },
    kick() {
      tone(140, 0, 0.12, { type: "triangle", gain: 0.22, glideTo: 60 });
      noiseBurst(0, 0.08, { gain: 0.1, filterFreq: 2500 });
    },
    perfect() {
      tone(880, 0, 0.1, { type: "sine", gain: 0.16 });
      tone(1320, 0.09, 0.14, { type: "sine", gain: 0.16 });
      tone(1760, 0.18, 0.22, { type: "sine", gain: 0.16 });
    },
    miss() {
      tone(220, 0, 0.28, { type: "sawtooth", gain: 0.12, glideTo: 110 });
    },
    cheer() {
      noiseBurst(0, 0.9, { gain: 0.14, filterFreq: 1400 });
      tone(220, 0, 0.6, { type: "sine", gain: 0.08, glideTo: 260 });
    },
    trophy() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3, { type: "sine", gain: 0.15 }));
    },
  };

  window.GaaAudio = SFX;
})();
