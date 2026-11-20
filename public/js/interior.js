// ===================== building interiors + the world map =====================
'use strict';
// Each enterable building: where its door is in town (centre, in tiles) and where its room sits on its own map.
// The room is drawn by hand in pixel art (the art pack has no indoor tiles).
const ROOMS = {
  synagogue: {
    name: 'Synagogue', x0: 27, x1: 37, top: 22, bot: 32,   // floor cells (inclusive)
    door: 32,                                               // the doorway cell in the bottom wall (y = bot + 1)
  },
};
// door of a building in town, in world tiles: [centre x, the y just in front of it]
function bldDoor(k) {
  for (let i = 0; i < W * H; i++) { const o = World.maps.town.objs[i]; if (o && o.t === 'bld' && o.k === k) { const x = i % W, y = (i / W) | 0, b = BLD[k], s = AT[b[0]][0]; return [(x * 16 + b[1] * 8 - s.width / 2 + DOOR_PX[k]) / 16, y + 1] } }
  return null;
}
const DOOR_PX = { synagogue: 48 };   // door centre, in pixels from the left of the building sprite

// ---------- the synagogue's room ----------
function genSynagogue() {
  const R = ROOMS.synagogue;
  World.ground = new Uint8Array(W * H).fill(GRASS); World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  // everything outside the room is solid
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < R.x0 || x > R.x1 || y < R.top || y > R.bot) World.objs[idx(x, y)] = { t: 'part', ox: -1, oy: -1 };
  World.objs[idx(R.door, R.bot + 1)] = null; World.objs[idx(R.door, R.bot + 2)] = null;          // the doorway out
  const put = (x, y, k, w = 1, extra) => { for (let xx = x; xx < x + w; xx++) World.objs[idx(xx, y)] = { t: 'part', ox: x, oy: y }; World.objs[idx(x, y)] = Object.assign({ t: 'ifurn', k, w }, extra || {}) };
  put(31, 22, 'ark', 3);                                   // the Ark with the Torah scrolls, against the far wall
  put(29, 22, 'menorah'); put(35, 22, 'menorah');
  put(27, 22, 'shelf', 2); put(36, 22, 'shelf', 2);
  put(31, 26, 'bimah', 3);                                 // the reading platform in the middle
  for (const y of [24, 29, 31]) { put(27, y, 'pew', 4); put(34, y, 'pew', 4) }
  put(27, 32, 'plant'); put(37, 32, 'plant'); put(27, 27, 'lamp'); put(37, 27, 'lamp');
}
const isInside = () => !!ROOMS[World.cur];

// pixel helper
function px(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h) }

// white-and-gold palette
const WG = { wall: '#f6f2e9', wallLine: '#e3dccd', wallShade: '#ddd5c3', gold: '#d9ad3c', goldHi: '#f3d474', goldLo: '#a77c22', white: '#fbf8f1', cream: '#eee6d4', marbleA: '#f3efe6', marbleB: '#e6dfcf', vein: '#d8cfbc', edge: '#bfb39a', dark: '#120c08' };
function drawInterior(g, x0, y0, x1, y1, t) {
  const R = ROOMS[World.cur]; g.fillStyle = WG.dark; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const L = R.x0 * 16, Rr = (R.x1 + 1) * 16, T = R.top * 16, B = (R.bot + 1) * 16;
  // white marble floor in big squares with gold inlay at the corners
  for (let y = T, r = 0; y < B; y += 16, r++) for (let x = L, c = 0; x < Rr; x += 16, c++) {
    px(g, (r + c) % 2 ? WG.marbleB : WG.marbleA, x, y, 16, 16); px(g, WG.vein, x, y, 16, 1); px(g, WG.vein, x, y, 1, 16);
    if (hash(x, y) > .55) { px(g, WG.vein, x + 3 + (hash(y, x) * 8 | 0), y + 4, 4, 1); px(g, WG.vein, x + 6 + (hash(y, x) * 6 | 0), y + 5, 3, 1) }
    px(g, WG.gold, x - 1, y - 1, 2, 2);
  }
  // a gold-edged white runner from the door up to the ark
  const cx = (R.door + .5) * 16; px(g, WG.gold, cx - 7, T + 52, 14, B - T - 52); px(g, WG.white, cx - 6, T + 53, 12, B - T - 53);
  for (let y = T + 58; y < B - 3; y += 8) { px(g, WG.goldHi, cx - 1, y, 2, 2); px(g, WG.gold, cx - 3, y + 1, 1, 1); px(g, WG.gold, cx + 2, y + 1, 1, 1) }
  // the far wall: white stone above, white panelling below, gold bands between
  const WT = T - 40; px(g, WG.wall, L, WT, Rr - L, 40);
  for (let y = WT; y < T - 14; y += 6) { px(g, WG.wallLine, L, y + 5, Rr - L, 1); for (let x = L + ((y / 6 | 0) % 2) * 7; x < Rr; x += 14) px(g, WG.wallLine, x, y, 1, 5) }
  px(g, WG.goldLo, L, WT, Rr - L, 2); px(g, WG.gold, L, WT, Rr - L, 1);                          // gold cornice
  px(g, WG.white, L, T - 13, Rr - L, 12); px(g, WG.gold, L, T - 14, Rr - L, 2); px(g, WG.goldHi, L, T - 14, Rr - L, 1);
  for (let x = L + 4; x < Rr - 8; x += 12) { px(g, WG.wallShade, x, T - 11, 9, 8); px(g, WG.white, x + 1, T - 10, 7, 6) }   // panels
  px(g, WG.goldLo, L, T - 1, Rr - L, 1);
  // arched windows with gold frames
  for (let x = L + 24; x < Rr - 20; x += 32) { if (Math.abs(x + 4 - cx) < 30) continue; px(g, WG.gold, x - 1, WT + 6, 12, 21); px(g, WG.gold, x + 1, WT + 4, 8, 2); px(g, '#9fd2ef', x, WT + 8, 10, 17); px(g, '#9fd2ef', x + 2, WT + 6, 6, 2); px(g, '#d5eefa', x + 1, WT + 9, 3, 12); px(g, WG.goldLo, x + 4, WT + 8, 1, 17); px(g, WG.goldLo, x, WT + 15, 10, 1) }
  // side and front walls: white with gold edging
  for (const [x, w] of [[L - 6, 6], [Rr, 6]]) { px(g, WG.edge, x, WT, w, B - WT + 6); px(g, WG.white, x + 1, WT, w - 2, B - WT + 5); px(g, WG.gold, x === L - 6 ? L - 2 : Rr + 1, WT, 1, B - WT + 2) }
  px(g, WG.edge, L - 6, B, Rr - L + 12, 6); px(g, WG.white, L - 5, B + 1, Rr - L + 10, 4); px(g, WG.gold, L - 2, B + 1, Rr - L + 4, 1);
  // the doorway and its mat
  const dx = R.door * 16; px(g, WG.dark, dx, B, 16, 6); px(g, WG.gold, dx - 1, B, 1, 6); px(g, WG.gold, dx + 16, B, 1, 6);
  px(g, WG.goldLo, dx + 2, B - 6, 12, 5); px(g, WG.gold, dx + 3, B - 5, 10, 3);
  // sunbeams through the windows during the day
  const [dark] = dayLight(); if (dark < .3) { g.save(); g.globalAlpha = .08 * (1 - dark * 3); g.fillStyle = '#fff3c4'; for (let x = L + 24; x < Rr - 20; x += 32) { if (Math.abs(x + 4 - cx) < 30) continue; g.beginPath(); g.moveTo(x, T - 12); g.lineTo(x + 10, T - 12); g.lineTo(x + 22, T + 40); g.lineTo(x + 8, T + 40); g.fill() } g.restore() }
}

function drawFurn(g, o, x, y, t) {
  const X = x * 16, Y = y * 16, B = Y + 16, w = (o.w || 1) * 16;
  const shadow = (cx, wd) => { g.fillStyle = 'rgba(90,70,30,.18)'; g.beginPath(); g.ellipse(cx, B - 1, wd, 3, 0, 0, 7); g.fill() };
  switch (o.k) {
    case 'pew': {   // white benches with gold edges
      shadow(X + w / 2, w / 2);
      px(g, WG.edge, X + 1, Y + 2, w - 2, 7); px(g, WG.white, X + 2, Y + 3, w - 4, 5); px(g, WG.gold, X + 2, Y + 3, w - 4, 1);
      px(g, WG.edge, X + 1, Y + 9, w - 2, 5); px(g, WG.cream, X + 2, Y + 9, w - 4, 3); px(g, WG.white, X + 2, Y + 9, w - 4, 1);
      for (const lx of [X + 2, X + w - 4, X + w / 2 - 1]) px(g, WG.gold, lx, Y + 14, 2, 2);
      break;
    }
    case 'bimah': {
      shadow(X + w / 2, w / 2 + 2);
      px(g, WG.edge, X, Y - 2, w, 18); px(g, WG.white, X + 1, Y - 1, w - 2, 16); px(g, WG.gold, X + 1, Y - 1, w - 2, 2); px(g, WG.gold, X + 1, Y + 13, w - 2, 1);
      for (let i = 0; i < 6; i++) { px(g, WG.gold, X + 4 + i * 7, Y + 5, 2, 8); px(g, WG.goldHi, X + 4 + i * 7, Y + 5, 1, 8) }
      px(g, WG.goldLo, X + 2, Y + 4, w - 4, 2); px(g, WG.goldHi, X + 2, Y + 4, w - 4, 1);
      px(g, WG.goldLo, X + 14, Y - 12, 20, 10); px(g, WG.white, X + 15, Y - 11, 18, 8); px(g, WG.gold, X + 15, Y - 11, 18, 1);   // reading table
      px(g, '#f6ecd0', X + 17, Y - 15, 14, 5); px(g, '#e2d3ad', X + 17, Y - 11, 14, 1); px(g, WG.gold, X + 15, Y - 16, 3, 7); px(g, WG.gold, X + 30, Y - 16, 3, 7);
      for (let i = 0; i < 3; i++) px(g, '#9b8a6a', X + 19 + i * 3, Y - 14, 2, 1);
      break;
    }
    case 'ark': {
      const cx = X + w / 2; shadow(cx, 20);
      px(g, WG.goldLo, X + 4, Y - 26, w - 8, 42); px(g, WG.gold, X + 5, Y - 25, w - 10, 40); px(g, WG.goldHi, X + 5, Y - 25, w - 10, 2);
      px(g, WG.white, X + 9, Y - 19, w - 18, 31); px(g, WG.cream, X + 10, Y - 19, 3, 31); px(g, WG.cream, X + w - 13, Y - 19, 3, 31);   // white curtain
      px(g, WG.gold, X + 9, Y - 19, w - 18, 2); px(g, WG.gold, X + 9, Y + 8, w - 18, 1); for (let i = 0; i < w - 18; i += 2) px(g, WG.gold, X + 9 + i, Y + 12, 1, 2);
      { const sy = Y - 6; g.strokeStyle = WG.gold; g.lineWidth = 1; for (const d of [1, -1]) { g.beginPath(); g.moveTo(cx, sy - 5 * d); g.lineTo(cx + 4.5, sy + 2.5 * d); g.lineTo(cx - 4.5, sy + 2.5 * d); g.closePath(); g.stroke() } }   // Star of David
      for (const s of [-1, 1]) { const tx = cx + (s < 0 ? -11 : 1); px(g, '#9a958a', tx, Y - 38, 10, 13); px(g, '#ece8de', tx + 1, Y - 37, 8, 11); px(g, '#ece8de', tx + 2, Y - 39, 6, 1); for (let i = 0; i < 4; i++) px(g, WG.gold, tx + 2, Y - 35 + i * 2, 6, 1) }
      const f = .6 + Math.sin(t * 5) * .15; px(g, WG.goldLo, cx, Y - 50, 1, 8); px(g, WG.gold, cx - 2, Y - 42, 5, 3); g.fillStyle = `rgba(255,120,40,${f})`; g.fillRect(cx - 1, Y - 44, 3, 2);
      break;
    }
    case 'menorah': {
      const cx = X + 8; shadow(cx, 6);
      px(g, WG.goldLo, cx - 4, B - 3, 9, 2); px(g, WG.gold, cx - 3, B - 4, 7, 1); px(g, WG.gold, cx, Y - 10, 1, 24);
      for (let i = 1; i <= 3; i++) { px(g, WG.gold, cx - i * 2, Y - 10 + (4 - i) * 2 + 4, 1, 12 - (4 - i) * 2); px(g, WG.gold, cx + i * 2, Y - 10 + (4 - i) * 2 + 4, 1, 12 - (4 - i) * 2) }
      px(g, WG.gold, cx - 6, Y + 6, 13, 1);
      for (let i = -3; i <= 3; i++) { const fl = Math.sin(t * 9 + i * 1.7) > .2 ? 2 : 1; px(g, '#ffd36b', cx + i * 2, Y - 12 - fl, 1, fl + 1); px(g, '#fff4c2', cx + i * 2, Y - 12, 1, 1) }
      break;
    }
    case 'shelf': {
      shadow(X + w / 2, w / 2 - 2);
      px(g, WG.edge, X + 2, Y - 14, w - 4, 30); px(g, WG.white, X + 3, Y - 13, w - 6, 28); px(g, WG.gold, X + 2, Y - 14, w - 4, 1);
      for (let r = 0; r < 3; r++) { const yy = Y - 11 + r * 9; px(g, WG.gold, X + 3, yy + 7, w - 6, 1); for (let i = 0; i < 5; i++) { const sx = X + 5 + i * 5; px(g, WG.goldLo, sx, yy + 2, 4, 5); px(g, '#f6ecd0', sx + 1, yy + 2, 2, 5) } }
      break;
    }
    case 'plant': { shadow(X + 8, 6); px(g, WG.goldLo, X + 4, Y + 7, 8, 8); px(g, WG.gold, X + 4, Y + 7, 8, 2); px(g, WG.goldHi, X + 5, Y + 9, 1, 5); const leaf = ['#3f8a3a', '#5aa84a', '#2f6e2e']; for (let i = 0; i < 9; i++) px(g, leaf[i % 3], X + 2 + (i * 5) % 12, Y - 2 + (i * 7) % 9, 3, 2); break }
    case 'lamp': {
      shadow(X + 8, 4); px(g, WG.gold, X + 7, Y - 4, 2, 19); px(g, WG.goldLo, X + 4, B - 2, 8, 2);
      px(g, WG.gold, X + 4, Y - 7, 8, 3); px(g, WG.goldHi, X + 4, Y - 7, 8, 1); const f = Math.sin(t * 8) > 0 ? 3 : 2; px(g, '#ffd36b', X + 7, Y - 7 - f, 2, f); px(g, '#fff4c2', X + 7, Y - 8, 2, 1);
      break;
    }
  }
}

// ---------- going in and out ----------
async function enterBuilding(k) {
  const R = ROOMS[k]; if (!R) return;
  sfx.tap(); await travel(k, R.door + .5, R.bot + .6, 'n');
}
async function leaveBuilding() {
  const k = World.cur, d = bldDoor(k); await travel('town', d[0], d[1] + .55, 's');
}
// called every frame: walking into a door goes in, walking out of the doorway goes out
function checkDoors() {
  if (sleeping || !player) return;
  if (World.cur === 'town') {
    for (const k in ROOMS) {
      const d = ROOMS[k]._door || (ROOMS[k]._door = bldDoor(k)); if (!d) continue;
      if (player.dir === 'n' && Math.abs(player.x - d[0]) < .42 && player.y < d[1] + .35 && player.y > d[1] - .2) { enterBuilding(k); return }
    }
  } else if (isInside()) {
    const R = ROOMS[World.cur]; if (player.y > R.bot + 1.3) leaveBuilding();
  }
}
// tapping the action button at a building: only the door lets you in
function tryBuildingDoor(k) {
  const d = bldDoor(k); if (!d || !ROOMS[k]) return false;
  if (Math.abs(player.x - d[0]) < .7 && player.y < d[1] + 1) { enterBuilding(k); return true }
  say(`The way into the ${ROOMS[k].name.toLowerCase()} is through its front door.`); return true;
}

// ---------- the map ----------
const MAP_COL = { water: '#4a9ad8', dirt: '#d9a066', grass: '#7cc357', tree: '#2f7a3a', bush: '#4c9a3e', pave: '#bdb3a2', soil: '#8b5a34', crop: '#5cae3a', rock: '#9a958c', bld: '#a0532e' };
const ROOF = { synagogue: '#2f6fd0', smithy: '#d9473c', inn: '#9c4fa8', carpenter: '#e2852f', houseA: '#e2852f', houseB: '#2f8fd0', houseC: '#4f9a3a', houseD: '#8ac06a', houseE: '#e35a5a', houseF: '#e35a5a', farmhouse: '#8ac06a', barn: '#d9473c', coop: '#5aa04a', stall_red: '#d9473c', stall_blue: '#3a7ad0', stall_green: '#4f9a3a', well: '#3aa0e0' };
function paintMinimap(g, m, ox, oy, s) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), o = m.objs[i], gr = m.ground[i]; let c = gr === WATER ? MAP_COL.water : gr === DIRT ? MAP_COL.dirt : MAP_COL.grass;
    if (m.pave && m.pave[i]) c = MAP_COL.pave; if (m.soil && m.soil[i]) c = m.soil[i].c ? MAP_COL.crop : MAP_COL.soil;
    if (o) { if (o.t === 'wild' || OBJ[o.t] && OBJ[o.t].tree) c = MAP_COL.tree; else if (o.t === 'bush') c = MAP_COL.bush; else if (o.t === 'rock' || o.t === 'boulder') c = MAP_COL.rock; else if (o.t === 'tent' || o.t === 'bin' || o.t === 'crate') c = '#c9873e'; else if (o.t === 'part' && o.ox >= 0) { const ow = m.objs[idx(o.ox, o.oy)]; c = ow && ow.t === 'bld' ? ROOF[ow.k] || MAP_COL.bld : '#c9873e' } else if (o.t === 'bld') c = ROOF[o.k] || MAP_COL.bld }
    g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, s, s);
  }
}
let mapView = null, mapZoom = false;
// draw a whole area with the real game art (daytime, no people) into a canvas
function renderMapArt(which) {
  const prev = World.cur; useMap(which);
  const c = mkc(W * 16, H * 16), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  drawTerrain(g, -1, -1, W, H, 0); drawPave(g, -1, -1, W, H); drawSoil(g, -1, -1, W, H);
  const D = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = World.objs[idx(x, y)]; if (o && o.t !== 'part') D.push([y + (o.t === 'grass' ? .4 : .9), 0, o, x, y]); const so = World.soil[idx(x, y)]; if (so && so.c) D.push([y + .7, 1, so, x, y]) }
  D.sort((p, q) => p[0] - q[0]);
  for (const d of D) { if (d[1]) drawCrop(g, d[2], d[3], d[4], 0); else { const sh = d[2].shake; d[2].shake = 0; drawObject(g, d[2], d[3], d[4], 0); d[2].shake = sh } }
  useMap(prev); return c;
}
function mapTab(b, which) {
  const here = isInside() ? 'town' : World.cur; which = which || mapView || here; mapView = which;
  b.innerHTML = `<div class="mapbtns"><button class="btn ${which === 'farm' ? '' : 'alt'}" data-mv="farm">${esc(state.look.farm || 'Your farm')}</button><button class="btn ${which === 'town' ? '' : 'alt'}" data-mv="town">Bethlehem</button><button class="btn alt mz" id="mZoom">${mapZoom ? '－' : '＋'}</button></div>
    <div class="mapwrap"><div class="mapinner ${mapZoom ? 'zoom' : ''}"></div></div>
    <div class="mapkey"><span><i class="kd you"></i>You</span><span><i class="kd open"></i>Open now</span><span><i class="kd shut"></i>Closed</span></div>
    <p class="muted" style="margin:4px 2px 0">${which === here ? '' : 'You aren’t in this area right now. '}${which === 'farm' ? 'The road on the right leads to Bethlehem.' : 'The road on the left leads home to your farm. Mount Sinai and the Jordan aren’t open yet.'}</p>`;
  b.querySelectorAll('[data-mv]').forEach(el => el.onclick = () => { sfx.tap(); mapTab(b, el.dataset.mv) });
  $('#mZoom').onclick = () => { sfx.tap(); mapZoom = !mapZoom; mapTab(b, which) };
  const inner = b.querySelector('.mapinner'), art = renderMapArt(which); art.className = 'mapart'; inner.appendChild(art);
  const pos = (x, y) => `left:${x / W * 100}%;top:${y / H * 100}%`;
  const lab = (html, x, y, cls = '') => inner.insertAdjacentHTML('beforeend', `<div class="mlab ${cls}" style="${pos(x, y)}">${html}</div>`);
  const status = k => `<i class="kd ${shopOpen(k) ? 'open' : 'shut'}"></i>`;
  if (which === 'town') {
    const T = World.maps.town;
    const names = { synagogue: ['🕍', 'Synagogue'], smithy: ['⚒️', 'Blacksmith', 'smithy'], inn: ['🍞', 'Inn', 'inn'], carpenter: ['🪚', 'Carpenter', 'carpenter'], stall_blue: ['🧺', 'Market', 'market'], well: ['💧', 'Well'] };
    for (let i = 0; i < W * H; i++) { const o = T.objs[i]; if (o && o.t === 'bld' && names[o.k]) { const x = i % W, y = (i / W) | 0, [ic, n, shop] = names[o.k], sp = AT[BLD[o.k][0]][0]; lab(`${shop ? status(shop) : ''}${ic} ${n}`, x + BLD[o.k][1] / 2, y + 1 - sp.height / 16 - .2) } }
    lab('↑ Mount Sinai <small>(soon)</small>', 25, 2.2, 'road'); lab('↓ The Jordan <small>(soon)</small>', 36, H - 1.2, 'road'); lab('← Your farm', .4, 26.4, 'road left');
  } else {
    const F = World.maps.farm, Tn = World.TENT; let home = ['⛺', 'Tent'], wx = 0, wy = 0, wn = 0;
    for (let i = 0; i < W * H; i++) { const o = F.objs[i], x = i % W, y = (i / W) | 0;
      if (o && o.t === 'bld') { if (o.k === 'farmhouse') home = ['🏠', 'Home']; if (o.k === 'coop') lab('🐔 Coop', x + 1, y - 2.4); if (o.k === 'barn') lab('🐐 Barn', x + 2.5, y - 4) }
      if (o && o.t === 'bin') lab('📦 Bin', x + .5, y + 1.15, 'sm below'); if (o && o.t === 'crate') lab('🗃️ Chest', x + .5, y + 1.15, 'sm below');
      if (F.ground[i] === WATER && x > 3 && y > 3 && x < W - 3 && y < H - 3) { wx += x; wy += y; wn++ } }
    lab(`${home[0]} ${home[1]}`, Tn.x + .5, Tn.y - 1.6); if (wn) lab('🐟 Pond', wx / wn + .5, wy / wn + .5, 'sm');
    lab('Bethlehem →', W - .4, World.EXIT.y - .6, 'road right');
  }
  if (which === here) {
    let mx = player.x, my = player.y; if (isInside()) { const d = bldDoor(World.cur); mx = d[0]; my = d[1] }
    inner.insertAdjacentHTML('beforeend', `<div class="pin" style="${pos(mx, my)}"><b></b><span>${isInside() ? 'You (inside)' : 'You'}</span></div>`);
    if (mapZoom) requestAnimationFrame(() => { const w = b.querySelector('.mapwrap'); w.scrollLeft = mx / W * inner.offsetWidth - w.clientWidth / 2; w.scrollTop = my / H * inner.offsetHeight - w.clientHeight / 2 });
  }
}
// ---------- things to look at inside ----------
function furnitureAction(o) {
  switch (o.k) {
    case 'bimah': visitChurch(); break;
    case 'ark': say('The Ark. Behind its blue curtain rest the Torah scrolls, and on top sit two stone tablets for the Ten Commandments. A small lamp burns in front of it day and night.'); break;
    case 'menorah': say('A golden lampstand with seven branches. Its flames flicker softly.'); break;
    case 'shelf': say('Shelves of scrolls: the Law, the Prophets and the Psalms.'); break;
    case 'pew': say('A long wooden bench, worn smooth by many Sabbaths.'); break;
    case 'lamp': say('An oil lamp on a stand. Someone keeps it filled every evening.'); break;
    case 'plant': say('A potted myrtle. It smells sweet.'); break;
  }
}
