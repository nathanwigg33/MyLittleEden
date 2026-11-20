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

function drawInterior(g, x0, y0, x1, y1, t) {
  const R = ROOMS[World.cur]; g.fillStyle = '#120c08'; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const L = R.x0 * 16, Rr = (R.x1 + 1) * 16, T = R.top * 16, B = (R.bot + 1) * 16;
  // wooden floor
  for (let y = T; y < B; y += 5) {
    const row = (y - T) / 5 | 0; px(g, row % 2 ? '#b98352' : '#b27c4b', L, y, Rr - L, 5); px(g, '#8e5c34', L, y + 4, Rr - L, 1);
    for (let x = L - ((row * 23) % 37); x < Rr; x += 37) if (x > L) { px(g, '#8e5c34', x, y, 1, 4); if (hash(x, y) > .7) px(g, '#9d6a3e', x + 9, y + 2, 2, 1) }
  }
  // blue runner from the door up to the ark
  const cx = (R.door + .5) * 16; px(g, '#c99a3c', cx - 7, T + 52, 14, B - T - 52); px(g, '#2f4c8f', cx - 6, T + 53, 12, B - T - 53);
  for (let y = T + 57; y < B - 2; y += 6) px(g, '#3e5ea6', cx - 4, y, 8, 2);
  // the far wall: limestone blocks over wooden panelling, with arched windows
  const WT = T - 40; px(g, '#e5d6b4', L, WT, Rr - L, 40);
  for (let y = WT; y < T - 12; y += 6) { px(g, '#cdb88f', L, y + 5, Rr - L, 1); for (let x = L + ((y / 6 | 0) % 2) * 7; x < Rr; x += 14) px(g, '#cdb88f', x, y, 1, 5) }
  px(g, '#8a5a33', L, T - 12, Rr - L, 12); px(g, '#a56f42', L, T - 12, Rr - L, 2); px(g, '#6b4426', L, T - 1, Rr - L, 1);
  for (let x = L + 24; x < Rr - 20; x += 32) { if (Math.abs(x + 4 - cx) < 30) continue; px(g, '#a8875a', x - 1, WT + 5, 12, 21); px(g, '#8fc8ea', x, WT + 8, 10, 17); px(g, '#8fc8ea', x + 2, WT + 6, 6, 2); px(g, '#c4e6f6', x + 1, WT + 9, 3, 12); px(g, '#a8875a', x + 4, WT + 8, 1, 17); px(g, '#a8875a', x, WT + 15, 10, 1) }
  // walls round the sides and front
  px(g, '#5e3c22', L - 6, WT, 6, B - WT + 6); px(g, '#7b5131', L - 2, WT, 2, B - WT + 2);
  px(g, '#5e3c22', Rr, WT, 6, B - WT + 6); px(g, '#7b5131', Rr, WT, 2, B - WT + 2);
  px(g, '#5e3c22', L - 6, B, Rr - L + 12, 6); px(g, '#7b5131', L - 2, B, Rr - L + 4, 2);
  // the doorway and its mat
  const dx = R.door * 16; px(g, '#120c08', dx, B, 16, 6); px(g, '#2a1a10', dx - 1, B, 1, 6); px(g, '#2a1a10', dx + 16, B, 1, 6);
  px(g, '#7d5a2a', dx + 2, B - 6, 12, 5); px(g, '#9a7236', dx + 3, B - 5, 10, 3);
  // sunbeams through the windows during the day
  const [dark] = dayLight(); if (dark < .3) { g.save(); g.globalAlpha = .07 * (1 - dark * 3); g.fillStyle = '#fff6d0'; for (let x = L + 24; x < Rr - 20; x += 32) { if (Math.abs(x + 4 - cx) < 30) continue; g.beginPath(); g.moveTo(x, T - 12); g.lineTo(x + 10, T - 12); g.lineTo(x + 22, T + 40); g.lineTo(x + 8, T + 40); g.fill() } g.restore() }
}

function drawFurn(g, o, x, y, t) {
  const X = x * 16, Y = y * 16, B = Y + 16, w = (o.w || 1) * 16;
  const shadow = (cx, wd) => { g.fillStyle = 'rgba(40,20,5,.25)'; g.beginPath(); g.ellipse(cx, B - 1, wd, 3, 0, 0, 7); g.fill() };
  switch (o.k) {
    case 'pew': {
      shadow(X + w / 2, w / 2);
      px(g, '#5a361c', X + 1, Y + 2, w - 2, 7); px(g, '#7c4d29', X + 2, Y + 3, w - 4, 5); px(g, '#94603a', X + 2, Y + 3, w - 4, 1);      // backrest
      px(g, '#5a361c', X + 1, Y + 9, w - 2, 5); px(g, '#a16b3f', X + 2, Y + 9, w - 4, 3); px(g, '#b97e4b', X + 2, Y + 9, w - 4, 1);       // seat
      px(g, '#4a2c16', X + 2, Y + 14, 2, 2); px(g, '#4a2c16', X + w - 4, Y + 14, 2, 2); px(g, '#4a2c16', X + w / 2 - 1, Y + 14, 2, 2);
      break;
    }
    case 'bimah': {
      shadow(X + w / 2, w / 2 + 2);
      px(g, '#5a361c', X, Y - 2, w, 18); px(g, '#9a653b', X + 1, Y - 1, w - 2, 16); px(g, '#b27a4a', X + 1, Y - 1, w - 2, 2);       // raised platform
      for (let i = 0; i < 6; i++) px(g, '#7c4d29', X + 4 + i * 7, Y + 5, 2, 9);                                                     // rail posts
      px(g, '#6b4021', X + 2, Y + 4, w - 4, 2);
      px(g, '#4a2c16', X + 14, Y - 12, 20, 10); px(g, '#7c4d29', X + 15, Y - 11, 18, 8);                                           // reading table
      px(g, '#efe2c0', X + 17, Y - 15, 14, 5); px(g, '#d9c79c', X + 17, Y - 11, 14, 1); px(g, '#a6824a', X + 15, Y - 16, 3, 7); px(g, '#a6824a', X + 30, Y - 16, 3, 7);   // open scroll
      for (let i = 0; i < 3; i++) px(g, '#9b8a6a', X + 19 + i * 3, Y - 14, 2, 1);
      break;
    }
    case 'ark': {
      const cx = X + w / 2; shadow(cx, 20);
      px(g, '#4a2c16', X + 4, Y - 26, w - 8, 42); px(g, '#7c4d29', X + 5, Y - 25, w - 10, 40); px(g, '#94603a', X + 5, Y - 25, w - 10, 2);
      px(g, '#2c3f86', X + 9, Y - 19, w - 18, 31); px(g, '#3b52a3', X + 10, Y - 19, 6, 31); px(g, '#3b52a3', X + w - 16, Y - 19, 6, 31); // curtain
      px(g, '#d8b04a', X + 9, Y - 19, w - 18, 2); for (let i = 0; i < w - 18; i += 2) px(g, '#d8b04a', X + 9 + i, Y + 12, 1, 2);     // gold trim, fringe
      { const sy = Y - 6; g.strokeStyle = '#e6c25a'; g.lineWidth = 1; for (const d of [1, -1]) { g.beginPath(); g.moveTo(cx, sy - 5 * d); g.lineTo(cx + 4.5, sy + 2.5 * d); g.lineTo(cx - 4.5, sy + 2.5 * d); g.closePath(); g.stroke() } }   // Star of David
      // the two stone tablets on top
      for (const s of [-1, 1]) { const tx = cx + (s < 0 ? -11 : 1); px(g, '#7d7a72', tx, Y - 38, 10, 13); px(g, '#cfcabe', tx + 1, Y - 37, 8, 11); px(g, '#cfcabe', tx + 2, Y - 39, 6, 1); for (let i = 0; i < 4; i++) px(g, '#8f8a7e', tx + 2, Y - 35 + i * 2, 6, 1) }
      // the eternal lamp hanging in front
      const f = .6 + Math.sin(t * 5) * .15; px(g, '#6b4426', cx, Y - 50, 1, 8); px(g, '#d8b04a', cx - 2, Y - 42, 5, 3); g.fillStyle = `rgba(255,90,40,${f})`; g.fillRect(cx - 1, Y - 44, 3, 2);
      break;
    }
    case 'menorah': {
      const cx = X + 8; shadow(cx, 6);
      px(g, '#8a6418', cx - 4, B - 3, 9, 2); px(g, '#b8902e', cx - 3, B - 4, 7, 1); px(g, '#d8b04a', cx, Y - 10, 1, 24);
      for (let i = 1; i <= 3; i++) { px(g, '#d8b04a', cx - i * 2, Y - 10 + (4 - i) * 2 + 4, 1, 12 - (4 - i) * 2); px(g, '#d8b04a', cx + i * 2, Y - 10 + (4 - i) * 2 + 4, 1, 12 - (4 - i) * 2) }
      px(g, '#d8b04a', cx - 6, Y + 8 - 2, 13, 1);
      for (let i = -3; i <= 3; i++) { const fl = Math.sin(t * 9 + i * 1.7) > .2 ? 2 : 1; px(g, '#ffd36b', cx + i * 2, Y - 13 - fl + 1, 1, fl + 1); px(g, '#fff4c2', cx + i * 2, Y - 12, 1, 1) }
      break;
    }
    case 'shelf': {
      shadow(X + w / 2, w / 2 - 2);
      px(g, '#4a2c16', X + 2, Y - 14, w - 4, 30); px(g, '#7c4d29', X + 3, Y - 13, w - 6, 28);
      for (let r = 0; r < 3; r++) { const yy = Y - 11 + r * 9; px(g, '#4a2c16', X + 3, yy + 7, w - 6, 1); for (let i = 0; i < 5; i++) { const sx = X + 5 + i * 5; px(g, '#a6824a', sx, yy + 2, 4, 5); px(g, '#efe2c0', sx + 1, yy + 2, 2, 5) } }
      break;
    }
    case 'plant': { shadow(X + 8, 6); px(g, '#8e4e2e', X + 4, Y + 7, 8, 8); px(g, '#b0663c', X + 4, Y + 7, 8, 2); const leaf = ['#3f8a3a', '#5aa84a', '#2f6e2e']; for (let i = 0; i < 9; i++) px(g, leaf[i % 3], X + 2 + (i * 5) % 12, Y - 2 + (i * 7) % 9, 3, 2); break }
    case 'lamp': {
      shadow(X + 8, 4); px(g, '#4a2c16', X + 7, Y - 4, 2, 19); px(g, '#4a2c16', X + 4, B - 2, 8, 2);
      px(g, '#b8902e', X + 4, Y - 7, 8, 3); const f = Math.sin(t * 8) > 0 ? 3 : 2; px(g, '#ffd36b', X + 7, Y - 7 - f, 2, f); px(g, '#fff4c2', X + 7, Y - 8, 2, 1);
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
let mapView = null;
function mapTab(b, which) {
  const here = isInside() ? 'town' : World.cur; which = which || mapView || here; mapView = which;
  const s = 5, top = 4, cw = W * s, ch = H * s + top * 2;
  b.innerHTML = `<div class="mapbtns"><button class="btn ${which === 'farm' ? '' : 'alt'}" data-mv="farm">${esc(state.look.farm || 'Your farm')}</button><button class="btn ${which === 'town' ? '' : 'alt'}" data-mv="town">Bethlehem</button></div><div class="mapwrap"><canvas id="mapC" width="${cw * 2}" height="${ch * 2}"></canvas></div><p class="muted" style="margin:6px 2px 0">${which === here ? 'The red marker shows where you are.' : 'You aren’t here right now.'} ${which === 'farm' ? 'The road on the right leads to Bethlehem.' : 'The road on the left leads home to your farm. Mount Sinai and the Jordan aren’t open yet.'}</p>`;
  b.querySelectorAll('[data-mv]').forEach(el => el.onclick = () => { sfx.tap(); mapTab(b, el.dataset.mv) });
  const c = $('#mapC'), g = c.getContext('2d'); g.scale(2, 2); g.imageSmoothingEnabled = false;
  g.fillStyle = '#2b5a2a'; g.fillRect(0, 0, cw, ch); paintMinimap(g, World.maps[which], 0, top, s);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const label = (txt, x, y, col = '#fff7e2', fs = 10) => { g.font = `700 ${fs}px 'Pixelify Sans', monospace`; const w = g.measureText(txt).width + 8; x = clamp(x, w / 2 + 2, cw - w / 2 - 2); y = clamp(y, 9, ch - 9); g.fillStyle = 'rgba(40,22,10,.78)'; g.fillRect(Math.round(x - w / 2), Math.round(y - 7), Math.round(w), 14); g.fillStyle = col; g.fillText(txt, x, y + .5) };
  if (which === 'town') {
    const names = { synagogue: 'Synagogue', smithy: 'Blacksmith', inn: 'Inn', carpenter: 'Carpenter', stall_blue: 'Market', well: 'Well' }, T = World.maps.town;
    for (let i = 0; i < W * H; i++) { const o = T.objs[i]; if (o && o.t === 'bld' && names[o.k]) { const x = i % W, y = (i / W) | 0; label(names[o.k], (x + BLD[o.k][1] / 2) * s, top + (y - BLD[o.k][2] - .6) * s) } }
    label('↑ Mount Sinai', 25 * s, top + 3 * s, '#e8dcc0', 9); label('↓ The Jordan', 36 * s, top + (H - 3) * s, '#e8dcc0', 9); label('← Your farm', 5 * s, top + 25 * s, '#e8dcc0', 9);
  } else {
    const F = World.maps.farm, Tn = World.TENT; let home = 'Tent'; for (let i = 0; i < W * H; i++) { const o = F.objs[i]; if (o && o.t === 'bld' && o.k === 'farmhouse') home = 'Home' }
    label(home, (Tn.x + .5) * s, top + (Tn.y - 2.5) * s); label('Bethlehem →', (W - 6) * s, top + (World.EXIT.y - 1.5) * s, '#e8dcc0', 9);
  }
  if (which !== here) return;
  let mx = player.x, my = player.y; if (isInside()) { const d = bldDoor(World.cur); mx = d[0]; my = d[1] }
  const bx = mx * s, by = top + my * s;
  g.beginPath(); g.arc(bx, by, 5, 0, 7); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.arc(bx, by, 3.8, 0, 7); g.fillStyle = '#e8392a'; g.fill();
  label(isInside() ? 'You (inside)' : 'You', bx, by + 13, '#ffd9cf', 10);
  const pin = document.createElement('div'); pin.className = 'pin'; pin.style.left = (bx / cw * 100) + '%'; pin.style.top = (by / ch * 100) + '%'; c.parentNode.appendChild(pin);
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
