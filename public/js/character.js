// Character look: recolors and stacks the layered sprites (body, tools, hair) for any look.
'use strict';
const LOOK = {
  skins: [
    [[250, 212, 170], [226, 176, 136], [196, 140, 104]],
    [[232, 173, 125], [208, 138, 98], [187, 109, 83]],
    [[204, 140, 96], [176, 112, 74], [148, 88, 60]],
    [[160, 104, 70], [134, 84, 56], [108, 66, 46]],
    [[116, 76, 54], [96, 60, 44], [76, 46, 34]],
  ],
  hairCols: [
    [[34, 30, 40], [52, 46, 58], [74, 66, 80], [100, 90, 104]],
    [[52, 34, 30], [82, 52, 42], [112, 74, 56], [140, 98, 72]],
    [[86, 52, 34], [128, 80, 46], [164, 108, 62], [196, 140, 86]],
    [[110, 40, 30], [160, 64, 40], [200, 96, 52], [232, 134, 80]],
    [[150, 70, 39], [200, 96, 32], [230, 130, 40], [248, 168, 80]],
    [[168, 124, 60], [212, 170, 84], [238, 206, 120], [252, 234, 170]],
    [[90, 90, 100], [140, 140, 150], [186, 186, 194], [226, 226, 232]],
  ],
  shirts: [
    [[236, 226, 196], [190, 172, 132]], [[228, 59, 68], [165, 31, 51]], [[70, 120, 200], [44, 74, 140]], [[96, 170, 80], [56, 110, 56]],
    [[150, 90, 180], [100, 56, 130]], [[230, 180, 60], [176, 124, 36]], [[170, 110, 70], [118, 72, 46]], [[60, 170, 170], [34, 110, 118]],
  ],
  pants: [[[110, 78, 52], [74, 52, 36]], [[55, 68, 100], [37, 44, 67]], [[180, 150, 110], [134, 108, 76]], [[96, 104, 60], [66, 72, 40]], [[100, 100, 110], [66, 66, 76]]],
  hairNames: { short: 'Short', long: 'Long', curly: 'Curly', bowl: 'Bowl', mop: 'Mop', spikey: 'Spiky' },
};
const DEFAULT_LOOK = { hair: 'short', hairCol: 1, skin: 1, shirt: 0, pants: 0 };
const lumOf = (r, g, b) => .299 * r + .587 * g + .114 * b;

// hair colour ramps: rank every colour used by a style, darkest -> lightest
const hairRank = {};
function hairRamp(style) {
  if (hairRank[style]) return hairRank[style];
  const set = new Map();
  for (const k in AT) {
    if (!k.startsWith('ch_hair_' + style + '_')) continue;
    for (const c of AT[k]) {
      const a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < a.length; i += 4) {
        if (!a[i + 3]) continue; const r = a[i], g = a[i + 1], b = a[i + 2];
        if (r < 40 && g < 40 && b < 50) continue; if (r === 232 && g === 172) continue;
        set.set((r << 16) | (g << 8) | b, lumOf(r, g, b));
      }
    }
  }
  const sorted = [...set.entries()].sort((a, b) => a[1] - b[1]); const m = new Map();
  sorted.forEach(([k], i) => m.set(k, sorted.length < 2 ? 2 : Math.round(i / (sorted.length - 1) * 3)));
  return hairRank[style] = m;
}
function recolor(src, fn) {
  const c = mkc(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const o = fn(a[i], a[i + 1], a[i + 2]); if (o) { a[i] = o[0]; a[i + 1] = o[1]; a[i + 2] = o[2] } }
  g.putImageData(d, 0, 0); return c;
}
function bodyFn(look) {
  const sk = LOOK.skins[look.skin], sh = LOOK.shirts[look.shirt], pa = LOOK.pants[look.pants];
  return (r, g, b) => {
    if (r < 40 && g < 40 && b < 50) return null;
    if (r >= 180 && g >= 95 && g <= 190 && b >= 70 && b <= 140 && r - b >= 60) { const l = lumOf(r, g, b); return l >= 175 ? sk[0] : l >= 138 ? sk[1] : sk[2] }
    if (r >= 150 && g < 70 && b < 85) return r >= 200 ? sh[0] : sh[1];
    if (b > r + 25 && r < 70 && b < 120) return lumOf(r, g, b) >= 58 ? pa[0] : pa[1];
    return null;
  };
}
function hairFn(look) {
  const ramp = hairRamp(look.hair), hc = LOOK.hairCols[look.hairCol], sk = LOOK.skins[look.skin];
  return (r, g, b) => {
    if (r < 40 && g < 40 && b < 50) return null;
    if (r === 232 && g === 172) return sk[0];
    const k = ramp.get((r << 16) | (g << 8) | b); return k === undefined ? null : hc[k];
  };
}
// Build every animation frame for a look. Returns {anim: [canvas...]}
function buildCharacter(look) {
  const out = {}, bf = bodyFn(look), hf = hairFn(look);
  for (const anim in ATMETA.char.counts) {
    const body = AT['ch_body_' + anim]; if (!body) continue;
    const hair = AT['ch_hair_' + look.hair + '_' + anim] || [], tool = AT['ch_tool_' + anim] || [], toolr = AT['ch_toolr_' + anim] || [];
    out[anim] = body.map((b, i) => {
      const c = mkc(b.width, b.height), g = c.getContext('2d');
      g.drawImage(recolor(b, bf), 0, 0);
      if (toolr[i]) g.drawImage(toolr[i], 0, 0);
      if (hair[i]) g.drawImage(recolor(hair[i], hf), 0, 0);
      if (tool[i]) g.drawImage(tool[i], 0, 0);
      return c;
    });
  }
  return out;
}
// draw a frame so the feet land on (fx, fy) in the target context
function drawChar(g, frames, anim, i, fx, fy, flip, exact) {
  const fr = frames[anim]; if (!fr) return; const c = fr[((i % fr.length) + fr.length) % fr.length];
  const m = ATMETA.char, a = m.anims[anim], dx = m.feetX - a.ox, dy = m.feetY - a.oy, R = exact ? v => v : Math.round;
  if (flip) { g.save(); g.translate(R(fx), 0); g.scale(-1, 1); g.drawImage(c, Math.round(-dx), R(fy - dy)); g.restore() }
  else g.drawImage(c, R(fx - dx), R(fy - dy));
}

// ---------- character creator ----------
function openCreator(onDone) {
  const look = Object.assign({}, DEFAULT_LOOK); let frames = buildCharacter(look), t = 0, raf = 0;
  const el = $('#creator'); el.classList.add('on');
  const pv = $('#cPrev'), pg = pv.getContext('2d');
  const sw = (id, list, key, toCss) => {
    const box = $(id); box.innerHTML = '';
    list.forEach((c, i) => { const b = document.createElement('button'); b.className = 'sw' + (look[key] === i ? ' on' : ''); b.style.background = toCss(c); b.onclick = () => { ensureAudio(); sfx.tap(); look[key] = i; refresh() }; box.appendChild(b) });
  };
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  function refresh() {
    frames = buildCharacter(look);
    sw('#cHairCol', LOOK.hairCols, 'hairCol', c => rgb(c[2])); sw('#cSkin', LOOK.skins, 'skin', c => rgb(c[0]));
    sw('#cShirt', LOOK.shirts, 'shirt', c => rgb(c[0])); sw('#cPants', LOOK.pants, 'pants', c => rgb(c[0]));
    $('#cHairName').textContent = LOOK.hairNames[look.hair];
  }
  const hairs = ATMETA.char.hairs;
  $('#cHairL').onclick = () => { sfx.tap(); look.hair = hairs[(hairs.indexOf(look.hair) + hairs.length - 1) % hairs.length]; refresh() };
  $('#cHairR').onclick = () => { sfx.tap(); look.hair = hairs[(hairs.indexOf(look.hair) + 1) % hairs.length]; refresh() };
  $('#cRandom').onclick = () => { sfx.tap(); look.hair = pick(hairs); look.hairCol = ri(0, 6); look.skin = ri(0, 4); look.shirt = ri(0, 7); look.pants = ri(0, 4); refresh() };
  $('#cName').value = ''; $('#cFarm').value = '';
  $('#cStart').onclick = () => {
    const name = $('#cName').value.trim().slice(0, 14), farm = $('#cFarm').value.trim().slice(0, 18);
    if (!name) { $('#cName').focus(); $('#cName').classList.add('need'); sfx.no(); return }
    cancelAnimationFrame(raf); el.classList.remove('on');
    onDone(Object.assign({}, look, { name, farm: farm || name + "'s Farm" }));
  };
  $('#cName').oninput = () => $('#cName').classList.remove('need');
  refresh();
  const loop = () => {
    t += 1 / 60; pg.clearRect(0, 0, pv.width, pv.height); pg.imageSmoothingEnabled = false;
    const seq = ['idle_s', 'walk_s', 'walk', 'walk_n', 'idle'], anim = seq[Math.floor(t / 2) % seq.length];
    pg.save(); pg.scale(4, 4); pg.fillStyle = 'rgba(0,0,0,.18)'; pg.beginPath(); pg.ellipse(16, 30, 6, 2, 0, 0, 7); pg.fill();
    drawChar(pg, frames, anim, Math.floor(t * 8), 16, 30, false); pg.restore();
    raf = requestAnimationFrame(loop);
  };
  loop();
}
