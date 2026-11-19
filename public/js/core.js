// My Little Promise Land — core helpers, art loading and sound.
'use strict';
const G = window.G = {};
G.TS = 16;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
function mkc(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- art atlas ----------
const AT = {};          // name -> [canvas, ...]
let ATMETA = null;
async function loadAtlas() {
  const [meta, img] = await Promise.all([
    fetch('art/atlas.json').then(r => r.json()),
    new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'art/atlas.png' })
  ]);
  ATMETA = meta.meta;
  for (const k in meta.frames) {
    const out = [];
    for (const [x, y, w, h, n] of meta.frames[k]) for (let i = 0; i < n; i++) {
      const c = mkc(w, h); c.getContext('2d').drawImage(img, x + i * w, y, w, h, 0, 0, w, h); out.push(c);
    }
    AT[k] = out;
  }
}
// tint a canvas (multiply + add), returns new canvas
function tintCanvas(src, mul, add = [0, 0, 0]) {
  const c = mkc(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; for (let k = 0; k < 3; k++) a[i + k] = clamp(a[i + k] * mul[k] + add[k], 0, 255) }
  g.putImageData(d, 0, 0); return c;
}
const iconCache = {};
function iconURL(name) {
  if (iconCache[name]) return iconCache[name];
  const s = AT[name] && AT[name][0]; if (!s) return '';
  const c = mkc(16, 16); c.getContext('2d').drawImage(s, Math.round(8 - s.width / 2), Math.round(8 - s.height / 2));
  return iconCache[name] = c.toDataURL();
}

// ---------- sound (tiny synth, no files) ----------
let AC = null;
function ensureAudio() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume() } catch (e) { } }
function tone(f, d = .1, type = 'sine', v = .06, delay = 0, f2) {
  if (!AC || (G.state && G.state.opts && !G.state.opts.sound)) return;
  try {
    const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) { }
}
function noise(d = .1, v = .08, hp = 800, delay = 0) {
  if (!AC || (G.state && G.state.opts && !G.state.opts.sound)) return;
  try {
    const t = AC.currentTime + delay, n = Math.floor(AC.sampleRate * d), b = AC.createBuffer(1, n, AC.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = AC.createBufferSource(); s.buffer = b; const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = AC.createGain(); g.gain.value = v; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t);
  } catch (e) { }
}
const sfx = {
  chop: () => { noise(.1, .14, 400); tone(160, .08, 'square', .03, 0, 110) },
  rock: () => { noise(.07, .14, 2400); tone(700, .05, 'square', .02) },
  swish: () => noise(.12, .06, 3000),
  miss: () => noise(.08, .04, 1500),
  fall: () => { noise(.5, .12, 200); tone(90, .4, 'sine', .08, .1, 50) },
  pop: () => tone(880, .06, 'square', .025, 0, 1320),
  pick: () => { tone(1046, .05, 'square', .02); tone(1568, .06, 'square', .02, .05) },
  tap: () => tone(660, .04, 'square', .02),
  no: () => tone(220, .12, 'square', .03, 0, 180),
  sleep: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, .5, 'sine', .04, i * .18)) },
  bird: () => { const b = rnd(2200, 3000); tone(b, .07, 'sine', .015, 0, b * 1.3); tone(b * 1.1, .06, 'sine', .012, .1, b * 1.4) },
};
