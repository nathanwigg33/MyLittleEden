// ===================== building interiors + the world map =====================
'use strict';
// Each enterable building: where its door is in town (centre, in tiles) and where its room sits on its own map.
// The room is drawn by hand in pixel art (the art pack has no indoor tiles).
const ROOMS = {
  synagogue: {
    name: 'Church', x0: 27, x1: 37, top: 22, bot: 32,   // floor cells (inclusive)
    door: 32,                                               // the doorway cell in the bottom wall (y = bot + 1)
    gen: () => genSynagogue(), draw: (...a) => drawChurchRoom(...a),
  },
  inn: { name: 'The Inn', x0: 26, x1: 38, top: 22, bot: 31, door: 32, shop: 'inn', gen: () => genInn(), draw: (...a) => drawInnRoom(...a) },
  carpenter: { name: 'Carpenter', x0: 28, x1: 36, top: 23, bot: 30, door: 32, shop: 'carpenter', gen: () => genCarp(), draw: (...a) => drawCarpRoom(...a) },
  smithy: { name: 'Blacksmith', x0: 28, x1: 36, top: 23, bot: 30, door: 32, shop: 'smithy', gen: () => genSmithy(), draw: (...a) => drawSmithyRoom(...a) },
};
// door of a building in town, in world tiles: [centre x, the y just in front of it]
function bldDoor(k) {
  for (let i = 0; i < W * H; i++) { const o = World.maps.town.objs[i]; if (o && o.t === 'bld' && o.k === k) { const x = i % W, y = (i / W) | 0, b = BLD[k], s = AT[b[0]][0]; return [(x * 16 + b[1] * 8 - s.width / 2 + DOOR_PX[k]) / 16, y + 1] } }
  return null;
}
const DOOR_PX = { synagogue: 48, smithy: 16, inn: 48, carpenter: 30 };   // door centre, in pixels from the left of the building sprite

// ---------- the synagogue's room ----------
// a blank room: solid everywhere outside the floor, with a gap for the door. Returns a furniture placer.
function roomBase(R) {
  World.ground = new Uint8Array(W * H).fill(GRASS); World.objs = new Array(W * H).fill(null); World.soil = {}; World.pave = null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < R.x0 || x > R.x1 || y < R.top || y > R.bot) World.objs[idx(x, y)] = { t: 'part', ox: -1, oy: -1 };
  World.objs[idx(R.door, R.bot + 1)] = null; World.objs[idx(R.door, R.bot + 2)] = null;
  return (x, y, k, w = 1, extra) => { for (let xx = x; xx < x + w; xx++) World.objs[idx(xx, y)] = { t: 'part', ox: x, oy: y }; World.objs[idx(x, y)] = Object.assign({ t: 'ifurn', k, w }, extra || {}) };
}
function genInn() {
  const put = roomBase(ROOMS.inn);
  put(26, 22, 'hearth', 3); put(29, 22, 'pantry', 2); put(32, 22, 'kegs', 2); put(34, 22, 'dresser', 2); put(37, 22, 'stairs', 2);
  put(29, 25, 'bar', 6);                                    // Miriam serves food across this
  for (const [x, y] of [[26, 27], [36, 27], [26, 30], [36, 30]]) put(x, y, 'table', 3);
  put(38, 25, 'ibarrel'); put(26, 25, 'iplant');
}
function genCarp() {
  const put = roomBase(ROOMS.carpenter);
  put(28, 23, 'lumber', 2); put(30, 23, 'pegboard', 2); put(33, 23, 'models', 2);
  put(29, 26, 'plans', 7);                                  // order buildings from Joseph across this
  put(35, 24, 'sawhorse'); put(28, 28, 'chair'); put(36, 28, 'planks'); put(28, 30, 'sbarrel'); put(36, 30, 'iplant');
}
function genSmithy() {
  const put = roomBase(ROOMS.smithy);
  put(28, 23, 'forge', 2); put(30, 23, 'bellows'); put(31, 24, 'sanvil'); put(33, 23, 'quench'); put(34, 23, 'toolwall', 2); put(36, 23, 'grind');
  put(29, 26, 'counter', 7);                                // Jesse serves you across this
  put(28, 29, 'display', 2); put(35, 29, 'ore'); put(36, 29, 'coal'); put(28, 30, 'sbarrel'); put(36, 30, 'sbarrel');
}
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

// palette: white stone and gold, with royal blue, crimson and walnut wood
const WG = {
  ink: '#3a2414', dark: '#120c08',
  wall: '#f4efe4', wallLine: '#ddd3c0', white: '#fbf8f1', cream: '#ece3cf',
  gold: '#d9ad3c', goldHi: '#f6d878', goldLo: '#9c7020',
  blue: '#2a4a9a', blueHi: '#4a6fc4', blueLo: '#1a2f6a',
  red: '#a3283a', redHi: '#cc4456', redLo: '#6e1626',
  wood: '#7a4a2a', woodHi: '#a06a3e', woodLo: '#52301a',
  tileA: '#efe7d6', tileB: '#d9c9a8', tileEdge: '#c4b08a',
};
// pixel-perfect Star of David (9x9)
const STAR = ['....#....', '...#.#...', '#########', '.#.....#.', '..#...#..', '.#.....#.', '#########', '...#.#...', '....#....'];
// pixel cross (9 wide, 13 tall) with a darker edge
function cross(g, x, y, c, edge) { px(g, edge, x + 3, y, 3, 13); px(g, edge, x, y + 3, 9, 3); px(g, c, x + 4, y + 1, 1, 11); px(g, c, x + 1, y + 4, 7, 1) }
function star(g, x, y, c) { for (let r = 0; r < 9; r++) for (let k = 0; k < 9; k++) if (STAR[r][k] === '#') px(g, c, x + k, y + r) }
// a stained-glass arched window, 12 x 22
function glassWindow(g, x, y) {
  const P = [WG.blueHi, '#e2a93a', WG.redHi, '#5aa86a', WG.blue, '#f0d070'];
  px(g, WG.ink, x, y + 2, 12, 20); px(g, WG.ink, x + 2, y, 8, 2); px(g, WG.ink, x + 1, y + 1, 10, 1);
  px(g, WG.gold, x + 1, y + 3, 10, 18); px(g, WG.gold, x + 2, y + 1, 8, 2);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const yy = y + 3 + r * 4, xx = x + 2 + c * 4; px(g, P[(r * 2 + c + (x >> 4)) % P.length], xx, yy, 4, 3) }
  px(g, WG.redHi, x + 3, y + 2, 6, 1); px(g, '#f0d070', x + 5, y + 1, 2, 1);                // arch top
  px(g, 'rgba(255,255,255,.45)', x + 2, y + 3, 1, 15);                                        // shine
}
function drawInterior(g, x0, y0, x1, y1, t) { ROOMS[World.cur].draw(g, x0, y0, x1, y1, t) }
function drawChurchRoom(g, x0, y0, x1, y1, t) {
  const R = ROOMS[World.cur]; g.fillStyle = WG.dark; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const L = R.x0 * 16, Rr = (R.x1 + 1) * 16, T = R.top * 16, B = (R.bot + 1) * 16, cx = (R.door + .5) * 16;
  // floor: cream and sandstone tiles, a blue border band round the edge
  for (let y = T, r = 0; y < B; y += 8, r++) for (let x = L, c = 0; x < Rr; x += 8, c++) { px(g, (r + c) % 2 ? WG.tileB : WG.tileA, x, y, 8, 8); px(g, WG.tileEdge, x, y + 7, 8, 1); px(g, WG.tileEdge, x + 7, y, 1, 8) }
  px(g, WG.blueLo, L, T, Rr - L, 3); px(g, WG.blue, L, T, Rr - L, 2); px(g, WG.blueLo, L, B - 3, Rr - L, 3); px(g, WG.blue, L, B - 3, Rr - L, 2);
  px(g, WG.blueLo, L, T, 3, B - T); px(g, WG.blue, L, T, 2, B - T); px(g, WG.blueLo, Rr - 3, T, 3, B - T); px(g, WG.blue, Rr - 2, T, 2, B - T);
  for (let x = L + 6; x < Rr - 4; x += 8) { px(g, WG.gold, x, T + 1, 2, 1); px(g, WG.gold, x, B - 2, 2, 1) }
  // crimson rug under the bimah
  const bx = 31 * 16 - 6, by = 25 * 16 + 2, bw = 3 * 16 + 12, bh = 40;
  px(g, WG.ink, bx - 1, by - 1, bw + 2, bh + 2); px(g, WG.gold, bx, by, bw, bh); px(g, WG.red, bx + 2, by + 2, bw - 4, bh - 4); px(g, WG.redLo, bx + 4, by + 4, bw - 8, bh - 8); px(g, WG.red, bx + 5, by + 5, bw - 10, bh - 10);
  for (let x = bx + 8; x < bx + bw - 8; x += 6) { px(g, WG.gold, x, by + 3, 2, 1); px(g, WG.gold, x, by + bh - 4, 2, 1) }
  // royal-blue runner with gold edges from the door to the bimah
  px(g, WG.ink, cx - 8, by + bh, 16, B - by - bh); px(g, WG.gold, cx - 7, by + bh, 14, B - by - bh); px(g, WG.blue, cx - 5, by + bh, 10, B - by - bh);
  for (let y = by + bh + 4; y < B - 4; y += 8) { px(g, WG.goldHi, cx - 1, y, 2, 1); px(g, WG.gold, cx - 2, y + 1, 4, 1); px(g, WG.goldHi, cx - 1, y + 2, 2, 1) }
  // far wall: white stone, gold band, walnut panelling below
  const WT = T - 40; px(g, WG.wall, L, WT, Rr - L, 28);
  for (let y = WT + 3; y < T - 14; y += 6) { px(g, WG.wallLine, L, y + 5, Rr - L, 1); for (let x = L + ((y / 6 | 0) % 2) * 8; x < Rr; x += 16) px(g, WG.wallLine, x, y, 1, 5) }
  px(g, WG.goldLo, L, WT, Rr - L, 3); px(g, WG.gold, L, WT, Rr - L, 2); px(g, WG.goldHi, L, WT, Rr - L, 1);           // cornice
  px(g, WG.woodLo, L, T - 13, Rr - L, 13); px(g, WG.wood, L, T - 12, Rr - L, 11);
  for (let x = L + 3; x < Rr - 10; x += 13) { px(g, WG.woodLo, x, T - 10, 10, 7); px(g, WG.woodHi, x + 1, T - 9, 8, 5); px(g, WG.wood, x + 2, T - 8, 6, 3) }
  px(g, WG.goldLo, L, T - 14, Rr - L, 2); px(g, WG.gold, L, T - 14, Rr - L, 1); px(g, WG.ink, L, T - 1, Rr - L, 1);
  for (let x = L + 22; x < Rr - 20; x += 32) { if (Math.abs(x + 6 - cx) < 44) continue; glassWindow(g, x, WT + 4) }
  // blue banners hanging either side of the ark
  for (const hx of [cx - 46, cx + 38]) { px(g, WG.ink, hx - 1, WT + 3, 10, 22); px(g, WG.blue, hx, WT + 4, 8, 19); px(g, WG.blueHi, hx, WT + 4, 1, 19); px(g, WG.gold, hx, WT + 4, 8, 1); px(g, WG.blue, hx + 1, WT + 23, 2, 2); px(g, WG.blue, hx + 5, WT + 23, 2, 2); px(g, WG.gold, hx, WT + 8, 8, 1); px(g, WG.white, hx, WT + 10, 8, 2); px(g, WG.gold, hx, WT + 13, 8, 1); px(g, WG.gold, hx, WT + 18, 8, 1) }
  // side and front walls: white with gold and an ink outline
  for (const [x, inner] of [[L - 6, L - 1], [Rr, Rr]]) { px(g, WG.ink, x, WT, 6, B - WT + 6); px(g, WG.white, x + 1, WT, 4, B - WT + 5); px(g, WG.gold, inner, WT, 1, B - WT + 1) }
  px(g, WG.ink, L - 6, B, Rr - L + 12, 6); px(g, WG.white, L - 5, B + 1, Rr - L + 10, 4); px(g, WG.gold, L - 1, B, Rr - L + 2, 1);
  // doorway and mat
  const dx = R.door * 16; px(g, WG.dark, dx, B, 16, 6); px(g, WG.gold, dx - 1, B, 1, 6); px(g, WG.gold, dx + 16, B, 1, 6);
  px(g, WG.ink, dx + 1, B - 7, 14, 6); px(g, WG.red, dx + 2, B - 6, 12, 4); px(g, WG.gold, dx + 3, B - 5, 10, 1);
  // warm light through the windows during the day
  const [dark] = dayLight(); if (dark < .3) { g.save(); g.globalAlpha = .06 * (1 - dark * 3); g.fillStyle = '#ffe9b0'; for (let x = L + 22; x < Rr - 20; x += 32) { if (Math.abs(x + 6 - cx) < 44) continue; g.beginPath(); g.moveTo(x, T - 12); g.lineTo(x + 12, T - 12); g.lineTo(x + 24, T + 40); g.lineTo(x + 10, T + 40); g.fill() } g.restore() }
}

function drawFurn(g, o, x, y, t) {
  const X = x * 16, Y = y * 16, B = Y + 16, w = (o.w || 1) * 16;
  if (drawSmithFurn(g, o, X, Y, B, w, t) || drawInnFurn(g, o, X, Y, B, w, t) || drawCarpFurn(g, o, X, Y, B, w, t)) return;
  const shadow = (sx, sw) => px(g, 'rgba(60,35,15,.22)', sx, B - 2, sw, 2);
  switch (o.k) {
    case 'pew': {   // walnut benches, gold caps, crimson cushions
      shadow(X + 2, w - 4);
      px(g, WG.ink, X + 1, Y + 1, w - 2, 15);
      px(g, WG.wood, X + 2, Y + 2, w - 4, 6); px(g, WG.woodHi, X + 2, Y + 2, w - 4, 1); px(g, WG.woodLo, X + 2, Y + 7, w - 4, 1);
      px(g, WG.gold, X + 1, Y + 1, 2, 2); px(g, WG.gold, X + w - 3, Y + 1, 2, 2);
      px(g, WG.redLo, X + 2, Y + 8, w - 4, 4); px(g, WG.red, X + 2, Y + 8, w - 4, 3); px(g, WG.redHi, X + 3, Y + 8, w - 6, 1);
      px(g, WG.woodLo, X + 2, Y + 12, w - 4, 2); for (const lx of [X + 2, X + w - 4, X + w / 2 - 1]) px(g, WG.woodLo, lx, Y + 14, 2, 2);
      break;
    }
    case 'bimah': {
      shadow(X, w);
      px(g, WG.ink, X - 1, Y - 3, w + 2, 19); px(g, WG.wood, X, Y - 2, w, 17); px(g, WG.woodHi, X, Y - 2, w, 2); px(g, WG.woodLo, X, Y + 13, w, 2);
      for (let i = 0; i < 7; i++) { px(g, WG.gold, X + 2 + i * 7, Y + 4, 2, 8); px(g, WG.goldHi, X + 2 + i * 7, Y + 4, 1, 8) }
      px(g, WG.goldLo, X, Y + 3, w, 2); px(g, WG.goldHi, X, Y + 3, w, 1);
      // reading table with a crimson cloth and an open scroll
      px(g, WG.ink, X + 13, Y - 13, 22, 12); px(g, WG.red, X + 14, Y - 12, 20, 10); px(g, WG.redHi, X + 14, Y - 12, 20, 1); px(g, WG.gold, X + 14, Y - 4, 20, 1);
      for (let i = 0; i < 10; i++) px(g, WG.gold, X + 14 + i * 2, Y - 3, 1, 2);
      px(g, WG.ink, X + 16, Y - 17, 16, 6); px(g, '#f8f0d8', X + 18, Y - 16, 12, 4); px(g, WG.woodLo, X + 16, Y - 17, 2, 6); px(g, WG.woodLo, X + 30, Y - 17, 2, 6);
      for (let i = 0; i < 3; i++) px(g, '#9b8a6a', X + 19 + i * 3, Y - 15, 2, 1), px(g, '#9b8a6a', X + 19 + i * 3, Y - 13, 2, 1);
      break;
    }
    case 'ark': {
      const ax = X + w / 2;
      shadow(X + 4, w - 8);
      px(g, WG.ink, X + 3, Y - 27, w - 6, 44); px(g, WG.gold, X + 4, Y - 26, w - 8, 42); px(g, WG.goldHi, X + 4, Y - 26, w - 8, 1); px(g, WG.goldLo, X + 4, Y + 14, w - 8, 2);
      px(g, WG.goldLo, X + 7, Y - 22, w - 14, 34);                                           // recess
      px(g, WG.blueLo, X + 8, Y - 21, w - 16, 33); px(g, WG.blue, X + 9, Y - 21, w - 18, 32);  // royal-blue velvet curtain
      for (let i = 0; i < 4; i++) px(g, WG.blueHi, X + 11 + i * 8, Y - 18, 1, 28);            // folds
      px(g, WG.gold, X + 8, Y - 21, w - 16, 2); px(g, WG.gold, X + 8, Y + 8, w - 16, 1); for (let i = 0; i < w - 16; i += 2) px(g, WG.goldHi, X + 8 + i, Y + 9, 1, 2);
      cross(g, ax - 4, Y - 15, WG.goldHi, WG.goldLo);
      // the two stone tablets on top
      for (const s of [-1, 1]) { const tx = ax + (s < 0 ? -12 : 1); px(g, WG.ink, tx, Y - 41, 11, 15); px(g, '#e9e4d8', tx + 1, Y - 40, 9, 13); px(g, '#cfc8b8', tx + 1, Y - 28, 9, 1); px(g, WG.ink, tx + 1, Y - 41, 1, 1); px(g, WG.ink, tx + 9, Y - 41, 1, 1); for (let i = 0; i < 5; i++) px(g, '#8f877a', tx + 3, Y - 38 + i * 2, 5, 1) }
      // the eternal lamp
      const f = Math.sin(t * 5) > 0 ? WG.redHi : '#ff8a3a'; px(g, WG.goldLo, ax, Y - 54, 1, 8); px(g, WG.ink, ax - 3, Y - 46, 7, 4); px(g, WG.gold, ax - 2, Y - 46, 5, 3); px(g, f, ax - 1, Y - 48, 3, 2);
      break;
    }
    case 'menorah': {
      const c = X + 8; shadow(c - 4, 9);
      px(g, WG.ink, c - 5, B - 4, 11, 3); px(g, WG.goldLo, c - 4, B - 3, 9, 1); px(g, WG.gold, c - 3, B - 4, 7, 1);
      px(g, WG.gold, c, Y - 8, 1, 21); px(g, WG.goldLo, c + 1, Y - 6, 1, 19);
      for (let i = 1; i <= 3; i++) { const top = Y - 8, d = i * 2; px(g, WG.gold, c - d, top, 1, 3 + i * 2); px(g, WG.gold, c + d, top, 1, 3 + i * 2); px(g, WG.gold, c - d, top + 2 + i * 2, d, 1); px(g, WG.gold, c + 1, top + 2 + i * 2, d, 1) }
      for (let i = -3; i <= 3; i++) { const fl = Math.sin(t * 9 + i * 1.7) > .2; px(g, WG.goldLo, c + i * 2, Y - 9, 1, 1); px(g, fl ? '#ffb340' : '#ffd36b', c + i * 2, Y - 11, 1, 2); if (fl) px(g, '#fff4c2', c + i * 2, Y - 12, 1, 1) }
      break;
    }
    case 'shelf': {   // walnut shelves of scrolls in coloured covers
      shadow(X + 3, w - 6);
      px(g, WG.ink, X + 1, Y - 15, w - 2, 31); px(g, WG.wood, X + 2, Y - 14, w - 4, 29); px(g, WG.woodHi, X + 2, Y - 14, w - 4, 1);
      const C = [WG.blue, WG.red, '#3f7a4a', WG.blue, '#c08a2a'];
      for (let r = 0; r < 3; r++) { const yy = Y - 12 + r * 9; px(g, WG.woodLo, X + 3, yy, w - 6, 7); px(g, WG.woodHi, X + 3, yy + 7, w - 6, 1);
        for (let i = 0; i < 5; i++) { const sx = X + 4 + i * 5; px(g, C[(i + r) % 5], sx, yy + 1, 4, 6); px(g, WG.gold, sx, yy + 1, 4, 1); px(g, WG.goldHi, sx + 1, yy, 2, 1) } }
      break;
    }
    case 'plant': { shadow(X + 3, 10); px(g, WG.ink, X + 3, Y + 6, 10, 10); px(g, WG.blue, X + 4, Y + 7, 8, 8); px(g, WG.gold, X + 4, Y + 7, 8, 1); px(g, WG.gold, X + 4, Y + 11, 8, 1); px(g, WG.blueHi, X + 5, Y + 8, 1, 6);
      const leaf = [[6, -3], [9, -2], [3, 0], [11, 1], [7, 1], [4, 3], [10, 4], [7, 4], [2, 4], [12, 3]]; for (const [lx, ly] of leaf) { px(g, '#2f6e2e', X + lx, Y + ly + 1, 3, 2); px(g, '#5aa84a', X + lx, Y + ly, 3, 2); px(g, '#8fd06a', X + lx, Y + ly, 1, 1) } break }
    case 'lamp': {
      shadow(X + 4, 8); px(g, WG.ink, X + 6, Y - 5, 4, 21); px(g, WG.gold, X + 7, Y - 4, 2, 19); px(g, WG.ink, X + 3, B - 3, 10, 3); px(g, WG.gold, X + 4, B - 2, 8, 1);
      px(g, WG.ink, X + 3, Y - 8, 10, 4); px(g, WG.gold, X + 4, Y - 7, 8, 2); px(g, WG.goldHi, X + 4, Y - 7, 8, 1);
      const f = Math.sin(t * 8) > 0; px(g, f ? '#ffb340' : '#ffd36b', X + 7, Y - 11, 2, 3); px(g, '#fff4c2', X + 7, Y - 10, 2, 1);
      break;
    }
  }
}

// ---------- the blacksmith's workshop ----------
const SM = { ink: '#24160e', stoneA: '#8b8174', stoneB: '#7a7064', mortar: '#4f483f', stoneHi: '#a1978a', brick: '#8e3b2a', brickHi: '#b0503a', brickLo: '#5c2216',
  iron: '#6c7884', ironHi: '#a7b3bf', ironLo: '#3b434c', bronze: '#c58a3a', bronzeHi: '#e8b25a', fire: '#ff8a2a', fireHi: '#ffd36b', fireLo: '#d2401c',
  wood: '#6a4426', woodHi: '#8e5e36', woodLo: '#432916', wall: '#5e5148', wallHi: '#776759', wallLo: '#3f3630' };
function drawSmithyRoom(g, x0, y0, x1, y1, t) {
  const R = ROOMS[World.cur]; g.fillStyle = WG.dark; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const L = R.x0 * 16, Rr = (R.x1 + 1) * 16, T = R.top * 16, B = (R.bot + 1) * 16;
  // flagstone floor: rows of uneven stones
  px(g, SM.mortar, L, T, Rr - L, B - T);
  for (let y = T, r = 0; y < B; y += 8, r++) { let x = L - (r % 3) * 5; while (x < Rr) { const w = 9 + (hash(x, y) * 8 | 0), a = Math.max(x, L), b = Math.min(x + w - 1, Rr); if (b > a) { px(g, hash(y, x) > .5 ? SM.stoneA : SM.stoneB, a, y, b - a, 7); px(g, SM.stoneHi, a, y, b - a, 1); if (hash(x + 3, y) > .8) px(g, SM.mortar, a + 3, y + 3, 2, 1) } x += w } }
  // soot and scorch near the forge
  g.fillStyle = 'rgba(30,20,15,.28)'; g.fillRect(L, T, 56, 26); g.fillRect(L, T + 26, 36, 10);
  // back wall: dark stone blocks with a timber beam, a little shuttered window and a hanging lantern
  const WT = T - 40; px(g, SM.wall, L, WT, Rr - L, 40);
  for (let y = WT, r = 0; y < T - 8; y += 7, r++) { px(g, SM.wallLo, L, y + 6, Rr - L, 1); for (let x = L + (r % 2) * 9; x < Rr; x += 18) { px(g, SM.wallLo, x, y, 1, 6); px(g, SM.wallHi, x + 1, y, 16, 1) } }
  px(g, SM.woodLo, L, WT, Rr - L, 5); px(g, SM.wood, L, WT, Rr - L, 4); px(g, SM.woodHi, L, WT, Rr - L, 1);
  px(g, SM.woodLo, L, T - 8, Rr - L, 8); px(g, SM.wood, L, T - 7, Rr - L, 6); px(g, SM.woodHi, L, T - 7, Rr - L, 1); px(g, SM.ink, L, T - 1, Rr - L, 1);
  const wx = 32 * 16; px(g, SM.ink, wx, WT + 9, 16, 16); px(g, '#9fd2ef', wx + 1, WT + 10, 14, 14); px(g, '#d5eefa', wx + 2, WT + 11, 4, 6); px(g, SM.woodLo, wx + 7, WT + 10, 2, 14); px(g, SM.woodLo, wx + 1, WT + 16, 14, 2);
  px(g, SM.wood, wx - 6, WT + 9, 5, 16); px(g, SM.wood, wx + 17, WT + 9, 5, 16); px(g, SM.woodLo, wx - 6, WT + 16, 5, 1); px(g, SM.woodLo, wx + 17, WT + 16, 5, 1);
  // side and front walls
  for (const x of [L - 6, Rr]) { px(g, SM.ink, x, WT, 6, B - WT + 6); px(g, SM.wallHi, x + 1, WT, 4, B - WT + 5); px(g, SM.woodHi, x === L - 6 ? L - 1 : Rr, WT, 1, B - WT + 1) }
  px(g, SM.ink, L - 6, B, Rr - L + 12, 6); px(g, SM.wallHi, L - 5, B + 1, Rr - L + 10, 4);
  const dx = R.door * 16; px(g, WG.dark, dx, B, 16, 6); px(g, SM.woodHi, dx - 1, B, 1, 6); px(g, SM.woodHi, dx + 16, B, 1, 6);
  px(g, SM.ink, dx + 1, B - 7, 14, 6); px(g, '#7d5a2a', dx + 2, B - 6, 12, 4); px(g, '#9a7236', dx + 3, B - 5, 10, 1);
  // wall lantern beside the window
  const lx = 32 * 16 - 9, ly = T - 22; px(g, SM.ink, lx - 1, ly - 2, 4, 2); px(g, SM.ink, lx - 3, ly, 7, 9); px(g, SM.ironLo, lx - 2, ly + 1, 5, 7); px(g, Math.sin(t * 6) > 0 ? SM.fireHi : '#ffe9a0', lx - 1, ly + 2, 3, 5);
}
// ---- workshop furniture ----
function drawSmithFurn(g, o, X, Y, B, w, t) {
  const sh = (sx, sw) => px(g, 'rgba(20,10,5,.3)', sx, B - 2, sw, 2);
  switch (o.k) {
    case 'forge': {
      sh(X, w);
      // stone hood and chimney rising up the wall
      px(g, SM.ink, X + 7, Y - 40, 18, 22); px(g, SM.wallLo, X + 8, Y - 40, 16, 21); px(g, SM.ink, X + 1, Y - 19, 30, 8); px(g, SM.wallHi, X + 2, Y - 18, 28, 6); px(g, SM.wall, X + 2, Y - 14, 28, 2);
      // brick body
      px(g, SM.ink, X, Y - 11, w, 27); px(g, SM.brick, X + 1, Y - 10, w - 2, 25);
      for (let r = 0; r < 6; r++) { const yy = Y - 10 + r * 4; px(g, SM.brickLo, X + 1, yy + 3, w - 2, 1); for (let c = (r % 2) * 4; c < w - 2; c += 8) px(g, SM.brickLo, X + 1 + c, yy, 1, 3); px(g, SM.brickHi, X + 1, yy, w - 2, 1) }
      // the fire
      px(g, SM.ink, X + 5, Y - 6, 22, 13); px(g, '#1a0c06', X + 6, Y - 5, 20, 11);
      for (let i = 0; i < 9; i++) { const fx = X + 7 + i * 2, h = 3 + ((Math.sin(t * 10 + i * 1.9) + 1) * 2.5 | 0); px(g, SM.fireLo, fx, Y + 5 - h, 2, h); px(g, SM.fire, fx, Y + 6 - h, 2, Math.max(1, h - 2)); if (h > 5) px(g, SM.fireHi, fx, Y + 4 - Math.min(h, 4), 1, 2) }
      px(g, SM.fireHi, X + 9, Y + 3, 14, 2); px(g, '#fff2c0', X + 12, Y + 3, 8, 1);
      // sparks
      for (let i = 0; i < 3; i++) { const k = (t * 1.3 + i / 3) % 1; px(g, k < .5 ? SM.fireHi : SM.fire, X + 10 + i * 5 + Math.sin(t * 3 + i) * 2 | 0, Y - 6 - k * 14 | 0, 1, 1) }
      break;
    }
    case 'bellows': { sh(X + 2, 12); px(g, SM.ink, X + 1, Y - 2, 14, 12); px(g, SM.woodHi, X + 2, Y - 1, 12, 2); px(g, '#7a4a2e', X + 2, Y + 1, 12, 6); px(g, '#946040', X + 3, Y + 2, 10, 1); px(g, SM.woodHi, X + 2, Y + 7, 12, 2); px(g, SM.ironLo, X - 3, Y + 3, 5, 2); px(g, SM.wood, X + 13, Y - 6, 2, 6); break }
    case 'sanvil': {
      sh(X, 16);
      px(g, SM.ink, X + 3, Y + 6, 10, 10); px(g, SM.woodHi, X + 4, Y + 7, 8, 8); px(g, SM.wood, X + 4, Y + 9, 8, 1); px(g, SM.wood, X + 6, Y + 12, 5, 1);       // stump
      px(g, SM.ink, X - 2, Y - 2, 19, 6); px(g, SM.iron, X - 1, Y - 1, 17, 4); px(g, SM.ironHi, X - 1, Y - 1, 17, 1); px(g, SM.ink, X + 4, Y + 3, 8, 4); px(g, SM.ironLo, X + 5, Y + 3, 6, 3);   // anvil
      px(g, SM.ink, X - 4, Y, 3, 2); px(g, SM.iron, X - 3, Y, 2, 1);                                                                                        // horn
      const hot = (Math.sin(t * 2) + 1) / 2; px(g, hot > .5 ? SM.fireHi : SM.fire, X + 2, Y - 3, 9, 2); px(g, SM.fireLo, X + 2, Y - 2, 9, 1);              // glowing bar
      px(g, SM.ink, X + 11, Y - 9, 3, 7); px(g, SM.ironLo, X + 9, Y - 11, 7, 3); px(g, SM.iron, X + 10, Y - 11, 5, 1);                                       // hammer resting
      break;
    }
    case 'quench': {
      sh(X + 1, 14); px(g, SM.ink, X + 1, Y - 2, 14, 18); px(g, SM.wood, X + 2, Y - 1, 12, 16); px(g, SM.woodHi, X + 3, Y - 1, 2, 16); px(g, SM.ironLo, X + 2, Y + 2, 12, 1); px(g, SM.ironLo, X + 2, Y + 11, 12, 1);
      px(g, '#3f6f8f', X + 3, Y - 2, 10, 3); px(g, '#6fa3c4', X + 4, Y - 2, 4, 1);
      for (let i = 0; i < 2; i++) { const k = (t * .7 + i * .5) % 1; g.fillStyle = `rgba(230,230,230,${.5 * (1 - k)})`; g.fillRect(X + 5 + i * 4 + Math.sin(t * 2 + i) * 2 | 0, Y - 5 - k * 12 | 0, 3, 2) }
      break;
    }
    case 'toolwall': {
      px(g, SM.ink, X + 1, Y - 30, w - 2, 22); px(g, SM.woodHi, X + 2, Y - 29, w - 4, 20); px(g, SM.wood, X + 2, Y - 21, w - 4, 1);
      const hang = (hx, kind) => { px(g, SM.ink, hx, Y - 28, 1, 1); if (kind === 0) { px(g, SM.woodLo, hx, Y - 27, 1, 14); px(g, SM.ironLo, hx - 2, Y - 27, 5, 3) } else if (kind === 1) { px(g, SM.ironLo, hx - 1, Y - 27, 1, 14); px(g, SM.ironLo, hx + 1, Y - 27, 1, 14); px(g, SM.iron, hx - 1, Y - 14, 3, 1) } else { px(g, SM.woodLo, hx, Y - 27, 1, 12); px(g, SM.iron, hx - 1, Y - 16, 3, 4) } };
      [0, 1, 2, 0, 1, 2].forEach((k, i) => hang(X + 5 + i * 4, k));
      // shelf below with buckets of nails
      px(g, SM.ink, X + 1, Y + 4, w - 2, 12); px(g, SM.wood, X + 2, Y + 5, w - 4, 10); px(g, SM.woodHi, X + 2, Y + 5, w - 4, 1); px(g, SM.ironLo, X + 5, Y + 1, 6, 4); px(g, SM.ironLo, X + 18, Y + 1, 7, 4); px(g, SM.iron, X + 6, Y + 1, 4, 1); px(g, SM.iron, X + 19, Y + 1, 5, 1);
      break;
    }
    case 'grind': {
      sh(X + 2, 12); px(g, SM.ink, X + 2, Y + 4, 2, 12); px(g, SM.ink, X + 12, Y + 4, 2, 12); px(g, SM.wood, X + 2, Y + 8, 12, 2);
      const c = X + 8, cy = Y + 3, a = t * 4; g.fillStyle = SM.ink; g.beginPath(); g.arc(c, cy, 7, 0, 7); g.fill(); g.fillStyle = '#9a948a'; g.beginPath(); g.arc(c, cy, 6, 0, 7); g.fill(); px(g, '#7a746a', c - 1 + Math.round(Math.cos(a) * 4), cy - 1 + Math.round(Math.sin(a) * 4), 2, 2); px(g, SM.ink, c - 1, cy - 1, 2, 2);
      break;
    }
    case 'counter': {
      sh(X, w);
      px(g, SM.ink, X, Y - 4, w, 20); px(g, SM.woodHi, X + 1, Y - 3, w - 2, 4); px(g, '#b07848', X + 1, Y - 3, w - 2, 1);
      px(g, SM.wood, X + 1, Y + 1, w - 2, 14); for (let i = 0; i < w - 2; i += 16) { px(g, SM.woodLo, X + 3 + i, Y + 3, 12, 10); px(g, SM.wood, X + 4 + i, Y + 4, 10, 8) }
      // ledger, bell, a coin pile and a pair of horseshoes on top
      const cx = X + 48; px(g, SM.ink, cx, Y - 8, 12, 5); px(g, '#f2e6c4', cx + 1, Y - 7, 10, 3); px(g, '#7a2a2a', cx + 5, Y - 7, 1, 3);
      px(g, SM.ink, X + 72, Y - 9, 7, 6); px(g, SM.bronzeHi, X + 73, Y - 8, 5, 4); px(g, SM.ink, X + 75, Y - 10, 1, 1);
      px(g, SM.ink, X + 20, Y - 7, 7, 4); px(g, '#f2c94c', X + 21, Y - 6, 5, 2); px(g, SM.ink, X + 92, Y - 8, 7, 5); px(g, SM.iron, X + 93, Y - 7, 5, 3); px(g, SM.ink, X + 95, Y - 6, 1, 2);
      break;
    }
    case 'display': {
      sh(X + 2, w - 4); px(g, SM.ink, X + 2, Y - 14, w - 4, 30); px(g, SM.woodHi, X + 3, Y - 13, w - 6, 28); px(g, SM.wood, X + 3, Y + 4, w - 6, 11);
      // bronze axe and iron pickaxe crossed
      for (let i = 0; i < 18; i++) { px(g, SM.woodLo, X + 7 + i, Y - 10 + i, 1, 1); px(g, SM.woodLo, X + 25 - i, Y - 10 + i, 1, 1) }
      px(g, SM.ink, X + 4, Y - 13, 7, 7); px(g, SM.bronze, X + 5, Y - 12, 5, 5); px(g, SM.bronzeHi, X + 5, Y - 12, 2, 5);
      px(g, SM.ink, X + 20, Y - 13, 10, 4); px(g, SM.iron, X + 21, Y - 12, 8, 2); px(g, SM.ironHi, X + 21, Y - 12, 8, 1);
      px(g, SM.ink, X + 8, Y + 6, 16, 6); px(g, '#e9dcc0', X + 9, Y + 7, 14, 4);                                                  // little price card
      break;
    }
    case 'ore': { sh(X + 1, 14); px(g, SM.ink, X + 1, Y + 2, 14, 14); px(g, SM.woodHi, X + 2, Y + 3, 12, 12); px(g, SM.wood, X + 2, Y + 8, 12, 1); px(g, SM.wood, X + 7, Y + 3, 1, 12);
      for (const [ox, oy, c] of [[3, -1, '#c8743a'], [7, -2, '#8a8f96'], [10, 0, '#c8743a'], [5, 1, '#a35a3a'], [11, -3, '#8a8f96']]) { px(g, SM.ink, X + ox - 1, Y + oy - 1, 5, 4); px(g, c, X + ox, Y + oy, 3, 3); px(g, '#ffffff55', X + ox, Y + oy, 1, 1) } break }
    case 'coal': { sh(X + 1, 14); for (const [ox, oy, s] of [[2, 9, 5], [7, 8, 6], [4, 5, 5], [9, 4, 4], [6, 2, 4], [11, 10, 4]]) { px(g, '#0e0c0c', X + ox - 1, Y + oy - 1, s + 2, s + 1); px(g, '#2a2626', X + ox, Y + oy, s, s - 1); px(g, '#4e4846', X + ox, Y + oy, 1, 1) } break }
    case 'sbarrel': { sh(X + 2, 12); px(g, SM.ink, X + 2, Y - 1, 12, 17); px(g, SM.wood, X + 3, Y, 10, 15); px(g, SM.woodHi, X + 4, Y, 2, 15); px(g, SM.ironLo, X + 3, Y + 3, 10, 1); px(g, SM.ironLo, X + 3, Y + 11, 10, 1); px(g, SM.ironLo, X + 4, Y - 1, 8, 2); px(g, SM.iron, X + 5, Y - 1, 2, 1); break }
    default: return false;
  }
  return true;
}

// ---------- the inn ----------
const IN = { ink: '#2e1a0e', plaster: '#ead6ae', plasterLo: '#d7bd8e', beam: '#6a4426', beamHi: '#8e5e36', beamLo: '#432916',
  floorA: '#c08850', floorB: '#b47c47', floorLine: '#8e5c34', stone: '#9b9288', stoneLo: '#6c645b', stoneHi: '#bdb4a8',
  rug: '#8e3a2e', rugHi: '#b85a3e', rugLo: '#5e2218', teal: '#3f8a8a', tealHi: '#62b0aa' };
function drawInnRoom(g, x0, y0, x1, y1, t) {
  const R = ROOMS[World.cur]; g.fillStyle = WG.dark; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const L = R.x0 * 16, Rr = (R.x1 + 1) * 16, T = R.top * 16, B = (R.bot + 1) * 16, cx = (R.door + .5) * 16;
  // honey-coloured plank floor
  for (let y = T, r = 0; y < B; y += 6, r++) { px(g, r % 2 ? IN.floorA : IN.floorB, L, y, Rr - L, 6); px(g, IN.floorLine, L, y + 5, Rr - L, 1); for (let x = L + ((r * 29) % 41); x < Rr; x += 41) px(g, IN.floorLine, x, y, 1, 5) }
  // woven rug in the middle
  const rx = cx - 40, ry = T + 66, rw = 80, rh = B - ry - 10;
  px(g, IN.ink, rx - 1, ry - 1, rw + 2, rh + 2); px(g, IN.rugLo, rx, ry, rw, rh); px(g, IN.rug, rx + 2, ry + 2, rw - 4, rh - 4); px(g, IN.rugHi, rx + 5, ry + 5, rw - 10, 1); px(g, IN.rugHi, rx + 5, ry + rh - 6, rw - 10, 1);
  for (let x = rx + 9; x < rx + rw - 8; x += 10) for (let y = ry + 10; y < ry + rh - 10; y += 10) { px(g, '#e2b04a', x, y + 1, 3, 1); px(g, '#e2b04a', x + 1, y, 1, 3) }
  for (let x = rx; x < rx + rw; x += 3) { px(g, '#d9c08a', x, ry - 2, 1, 1); px(g, '#d9c08a', x, ry + rh + 1, 1, 1) }
  // back wall: plaster between timber posts, beams, hanging herbs
  const WT = T - 40; px(g, IN.plaster, L, WT, Rr - L, 40);
  for (let i = 0; i < 40; i++) px(g, IN.plasterLo, L + (hash(i, 7) * (Rr - L) | 0), WT + 6 + (hash(7, i) * 24 | 0), 2, 1);
  for (let x = L; x <= Rr - 4; x += 48) { px(g, IN.beamLo, x, WT, 5, 40); px(g, IN.beam, x + 1, WT, 3, 40); px(g, IN.beamHi, x + 1, WT, 1, 40) }
  px(g, IN.beamLo, L, WT, Rr - L, 6); px(g, IN.beam, L, WT, Rr - L, 5); px(g, IN.beamHi, L, WT, Rr - L, 1);
  px(g, IN.beamLo, L, T - 6, Rr - L, 6); px(g, IN.beam, L, T - 5, Rr - L, 4); px(g, IN.beamHi, L, T - 5, Rr - L, 1); px(g, IN.ink, L, T - 1, Rr - L, 1);
  for (let x = L + 66; x < Rr - 40; x += 22) { px(g, IN.ink, x, WT + 5, 1, 4); const c = hash(x, 1) > .5 ? ['#5f8f3a', '#86b04e'] : ['#e9e1c8', '#c8bfa4']; for (let k = 0; k < 4; k++) { px(g, c[0], x - 2 + (k % 2) * 3, WT + 9 + k * 2, 2, 3); px(g, c[1], x - 2 + (k % 2) * 3, WT + 9 + k * 2, 1, 1) } }
  // side and front walls
  for (const x of [L - 6, Rr]) { px(g, IN.ink, x, WT, 6, B - WT + 6); px(g, IN.beamHi, x + 1, WT, 4, B - WT + 5); px(g, IN.beam, x + 2, WT, 2, B - WT + 5) }
  px(g, IN.ink, L - 6, B, Rr - L + 12, 6); px(g, IN.beamHi, L - 5, B + 1, Rr - L + 10, 4); px(g, IN.beam, L - 5, B + 2, Rr - L + 10, 2);
  const dx = R.door * 16; px(g, WG.dark, dx, B, 16, 6); px(g, IN.beamHi, dx - 1, B, 1, 6); px(g, IN.beamHi, dx + 16, B, 1, 6);
  px(g, IN.ink, dx + 1, B - 7, 14, 6); px(g, IN.teal, dx + 2, B - 6, 12, 4); px(g, IN.tealHi, dx + 3, B - 5, 10, 1);
}
function drawInnFurn(g, o, X, Y, B, w, t) {
  const sh = (sx, sw) => px(g, 'rgba(40,20,8,.25)', sx, B - 2, sw, 2);
  switch (o.k) {
    case 'hearth': {
      sh(X, w);
      px(g, IN.ink, X + 2, Y - 38, w - 4, 28); px(g, IN.stone, X + 3, Y - 37, w - 6, 27);
      for (let r = 0; r < 4; r++) for (let c = (r % 2) * 6; c < w - 6; c += 12) { px(g, IN.stoneLo, X + 3 + c, Y - 37 + r * 7, 1, 6); px(g, IN.stoneHi, X + 4 + c, Y - 37 + r * 7, 10, 1) }
      px(g, IN.ink, X, Y - 12, w, 28); px(g, IN.stone, X + 1, Y - 11, w - 2, 26); px(g, IN.beam, X, Y - 13, w, 4); px(g, IN.beamHi, X, Y - 13, w, 1);
      px(g, IN.ink, X + 8, Y - 6, w - 16, 20); px(g, '#1a0c06', X + 9, Y - 5, w - 18, 19);
      for (let i = 0; i < 13; i++) { const fx = X + 11 + i * 2, h = 3 + ((Math.sin(t * 9 + i * 2.1) + 1) * 2.6 | 0); px(g, SM.fireLo, fx, Y + 12 - h, 2, h); px(g, SM.fire, fx, Y + 13 - h, 2, Math.max(1, h - 2)); if (h > 5) px(g, SM.fireHi, fx, Y + 11 - Math.min(h, 4), 1, 2) }
      px(g, IN.beamLo, X + 13, Y + 12, 22, 2);
      const pc = X + w / 2; px(g, IN.ink, pc, Y - 5, 1, 4); px(g, IN.ink, pc - 7, Y - 1, 15, 9); px(g, '#3b3633', pc - 6, Y, 13, 7); px(g, '#5a524c', pc - 6, Y, 13, 1); px(g, '#a0602e', pc - 5, Y - 1, 11, 1);
      for (let i = 0; i < 2; i++) { const k = (t * .6 + i * .5) % 1; g.fillStyle = `rgba(240,240,240,${.45 * (1 - k)})`; g.fillRect(pc - 3 + i * 4 + Math.sin(t * 2 + i) * 2 | 0, Y - 3 - k * 10 | 0, 3, 2) }
      px(g, IN.ink, X + 6, Y - 17, 4, 4); px(g, '#c8763a', X + 7, Y - 16, 2, 3); px(g, IN.ink, X + w - 10, Y - 17, 4, 4); px(g, IN.teal, X + w - 9, Y - 16, 2, 3);
      break;
    }
    case 'pantry': {
      sh(X + 2, w - 4); px(g, IN.ink, X + 1, Y - 18, w - 2, 34); px(g, IN.beam, X + 2, Y - 17, w - 4, 32); px(g, IN.beamHi, X + 2, Y - 17, w - 4, 1);
      for (let r = 0; r < 3; r++) { const yy = Y - 15 + r * 10; px(g, IN.beamLo, X + 3, yy, w - 6, 8); px(g, IN.beamHi, X + 3, yy + 8, w - 6, 1);
        if (r === 0) for (let i = 0; i < 3; i++) { px(g, IN.ink, X + 4 + i * 8, yy + 3, 7, 5); px(g, '#d9a050', X + 5 + i * 8, yy + 3, 5, 4); px(g, '#f0c070', X + 5 + i * 8, yy + 3, 5, 1) }
        if (r === 1) for (let i = 0; i < 4; i++) { px(g, IN.ink, X + 4 + i * 6, yy + 1, 5, 7); px(g, '#e2a52e', X + 5 + i * 6, yy + 2, 3, 5); px(g, '#f6d070', X + 5 + i * 6, yy + 2, 1, 2) }
        if (r === 2) for (let i = 0; i < 5; i++) { px(g, IN.ink, X + 4 + i * 5, yy + 4, 5, 4); px(g, '#7a4a6a', X + 5 + i * 5, yy + 5, 3, 2) } }
      break;
    }
    case 'kegs': {
      sh(X + 1, w - 2);
      for (let i = 0; i < 3; i++) { const jx = X + 2 + i * 10, jy = Y - 6; px(g, IN.ink, jx, jy, 9, 21); px(g, i === 1 ? '#b0623a' : '#c47a46', jx + 1, jy + 1, 7, 19); px(g, '#e0a070', jx + 2, jy + 2, 1, 15); px(g, IN.ink, jx + 2, jy - 2, 5, 3); px(g, '#e8dcc0', jx + 3, jy - 2, 3, 2); px(g, '#7a3a20', jx + 1, jy + 8, 7, 1) }
      break;
    }
    case 'dresser': {
      sh(X + 1, w - 2); px(g, IN.ink, X + 1, Y - 20, w - 2, 36); px(g, IN.beam, X + 2, Y - 19, w - 4, 34); px(g, IN.beamHi, X + 2, Y - 19, w - 4, 1);
      for (let r = 0; r < 2; r++) { const yy = Y - 17 + r * 9; px(g, IN.beamLo, X + 3, yy, w - 6, 7); for (let i = 0; i < 3; i++) { const c = X + 7 + i * 9; px(g, IN.ink, c - 3, yy + 1, 7, 6); px(g, '#f0ece2', c - 2, yy + 2, 5, 4); px(g, '#3a6ab0', c - 1, yy + 3, 3, 2) } }
      px(g, IN.beamLo, X + 3, Y + 2, w - 6, 12); px(g, IN.beam, X + 4, Y + 3, 11, 10); px(g, IN.beam, X + 17, Y + 3, 11, 10); px(g, '#e2b04a', X + 13, Y + 8, 2, 1); px(g, '#e2b04a', X + 18, Y + 8, 2, 1);
      break;
    }
    case 'stairs': {
      px(g, IN.ink, X + 1, Y - 40, w - 2, 56); px(g, IN.beamLo, X + 2, Y - 39, w - 4, 54);
      for (let i = 0; i < 9; i++) { const yy = Y + 10 - i * 6; px(g, IN.beamHi, X + 4, yy, w - 8, 2); px(g, IN.beam, X + 4, yy + 2, w - 8, 3); px(g, IN.ink, X + 4, yy + 5, w - 8, 1) }
      px(g, IN.beamHi, X + 2, Y - 39, 2, 54); px(g, IN.beamHi, X + w - 4, Y - 39, 2, 54);
      break;
    }
    case 'bar': {
      sh(X, w);
      px(g, IN.ink, X, Y - 5, w, 21); px(g, IN.beamHi, X + 1, Y - 4, w - 2, 4); px(g, '#b07848', X + 1, Y - 4, w - 2, 1);
      px(g, IN.beam, X + 1, Y, w - 2, 15); for (let i = 0; i < w - 2; i += 12) px(g, IN.beamLo, X + 2 + i, Y + 2, 1, 12); px(g, IN.teal, X + 1, Y + 6, w - 2, 2); px(g, IN.tealHi, X + 1, Y + 6, w - 2, 1);
      px(g, IN.ink, X + 10, Y - 9, 12, 6); px(g, '#d9a050', X + 11, Y - 8, 10, 4); px(g, '#f0c070', X + 12, Y - 8, 8, 1);
      px(g, IN.ink, X + 34, Y - 12, 7, 9); px(g, '#c47a46', X + 35, Y - 11, 5, 7); px(g, '#e0a070', X + 35, Y - 11, 1, 6);
      for (const bx of [X + 52, X + 62]) { px(g, IN.ink, bx, Y - 7, 8, 4); px(g, '#f0ece2', bx + 1, Y - 7, 6, 2); px(g, '#8a5a2a', bx + 2, Y - 7, 4, 1) }
      px(g, IN.ink, X + 80, Y - 9, 7, 6); px(g, '#e2b04a', X + 81, Y - 8, 5, 4); px(g, IN.ink, X + 83, Y - 10, 1, 1);
      break;
    }
    case 'table': {
      sh(X + 2, w - 4);
      for (const bx of [X + 1, X + w - 9]) { px(g, IN.ink, bx, Y + 2, 8, 12); px(g, IN.beam, bx + 1, Y + 3, 6, 9); px(g, IN.beamHi, bx + 1, Y + 3, 6, 1) }
      px(g, IN.ink, X + 10, Y - 2, w - 20, 17); px(g, IN.beamHi, X + 11, Y - 1, w - 22, 11); px(g, '#b07848', X + 11, Y - 1, w - 22, 1); px(g, IN.beam, X + 11, Y + 10, w - 22, 4);
      const c = X + w / 2; px(g, IN.ink, c - 9, Y + 1, 7, 4); px(g, '#f0ece2', c - 8, Y + 1, 5, 2); px(g, '#a0602e', c - 7, Y + 1, 3, 1);
      px(g, IN.ink, c + 2, Y + 3, 7, 4); px(g, '#d9a050', c + 3, Y + 3, 5, 3);
      px(g, IN.ink, c - 1, Y - 3, 4, 3); px(g, '#c47a46', c, Y - 2, 2, 2); px(g, Math.sin(t * 7 + X) > 0 ? '#ffd36b' : '#ffb340', c, Y - 5, 2, 2);
      break;
    }
    case 'ibarrel': { sh(X + 2, 12); px(g, IN.ink, X + 2, Y - 1, 12, 17); px(g, IN.beam, X + 3, Y, 10, 15); px(g, IN.beamHi, X + 4, Y, 2, 15); px(g, '#4a4440', X + 3, Y + 3, 10, 1); px(g, '#4a4440', X + 3, Y + 11, 10, 1); px(g, '#3f6f8f', X + 4, Y - 1, 8, 2); break }
    case 'iplant': { sh(X + 3, 10); px(g, IN.ink, X + 3, Y + 6, 10, 10); px(g, '#b0623a', X + 4, Y + 7, 8, 8); px(g, '#d08050', X + 4, Y + 7, 8, 1); px(g, IN.beamLo, X + 7, Y - 4, 2, 11);
      for (const [lx, ly] of [[3, -8], [8, -10], [11, -6], [4, -3], [10, -1], [6, -6]]) { px(g, '#5a7a3a', X + lx, Y + ly, 3, 2); px(g, '#8aa860', X + lx, Y + ly, 2, 1) } break }
    default: return false;
  }
  return true;
}

// ---------- the carpenter's workshop ----------
const CP = { ink: '#2e1a0e', wallA: '#b8875a', wallB: '#a77a50', wallLine: '#7e5634', post: '#6a4426', postHi: '#8e5e36', postLo: '#432916',
  floorA: '#d0a46e', floorB: '#c4986a', floorLine: '#9a7048', dust: '#ead2a0', dustLo: '#d6b880', plank: '#d9a868', plankHi: '#f0c890', plankLo: '#a8784a',
  paper: '#f2e8cc', blue: '#3a6ab0', iron: '#6c7884', ironHi: '#a7b3bf' };
function drawCarpRoom(g, x0, y0, x1, y1, t) {
  const R = ROOMS[World.cur]; g.fillStyle = WG.dark; g.fillRect(x0 * 16, y0 * 16, (x1 - x0 + 1) * 16, (y1 - y0 + 1) * 16);
  const L = R.x0 * 16, Rr = (R.x1 + 1) * 16, T = R.top * 16, B = (R.bot + 1) * 16;
  // wide pale floorboards running front to back, sprinkled with sawdust
  for (let x = L, c = 0; x < Rr; x += 9, c++) { px(g, c % 2 ? CP.floorA : CP.floorB, x, T, 9, B - T); px(g, CP.floorLine, x + 8, T, 1, B - T); for (let y = T + ((c * 37) % 50); y < B; y += 50) px(g, CP.floorLine, x, y, 8, 1) }
  for (let i = 0; i < 70; i++) { const sx = L + (hash(i, 3) * (Rr - L) | 0), sy = T + (hash(3, i) * (B - T) | 0); px(g, i % 3 ? CP.dust : CP.dustLo, sx, sy, i % 4 ? 1 : 2, 1) }
  for (const [cx, cy, r] of [[L + 120, T + 30, 9], [L + 30, T + 74, 7], [Rr - 22, T + 60, 6]]) for (let i = 0; i < 26; i++) { const a = hash(i, cx) * 6.28, d = hash(cx, i) * r; px(g, i % 2 ? CP.dust : CP.dustLo, cx + Math.cos(a) * d | 0, cy + Math.sin(a) * d * .5 | 0, 2, 1) }
  // back wall: horizontal timber boards with posts and a window
  const WT = T - 40;
  for (let y = WT, r = 0; y < T; y += 5, r++) { px(g, r % 2 ? CP.wallA : CP.wallB, L, y, Rr - L, 5); px(g, CP.wallLine, L, y + 4, Rr - L, 1) }
  for (let x = L; x <= Rr - 4; x += 48) { px(g, CP.postLo, x, WT, 5, 40); px(g, CP.post, x + 1, WT, 3, 40); px(g, CP.postHi, x + 1, WT, 1, 40) }
  px(g, CP.postLo, L, WT, Rr - L, 5); px(g, CP.post, L, WT, Rr - L, 4); px(g, CP.postHi, L, WT, Rr - L, 1); px(g, CP.ink, L, T - 1, Rr - L, 1);
  const wx = 35 * 16 + 2; px(g, CP.ink, wx, WT + 9, 16, 16); px(g, '#9fd2ef', wx + 1, WT + 10, 14, 14); px(g, '#d5eefa', wx + 2, WT + 11, 4, 6); px(g, CP.post, wx + 7, WT + 10, 2, 14); px(g, CP.post, wx + 1, WT + 16, 14, 2); px(g, CP.postHi, wx - 1, WT + 25, 18, 2);
  // a saw and a coil of rope hanging on the wall
  px(g, CP.ink, L + 104, WT + 8, 1, 3); px(g, CP.iron, L + 98, WT + 11, 14, 4); px(g, CP.ironHi, L + 98, WT + 11, 14, 1); for (let i = 0; i < 7; i++) px(g, CP.ink, L + 98 + i * 2, WT + 15, 1, 1); px(g, CP.post, L + 110, WT + 10, 5, 6);
  // side and front walls
  for (const x of [L - 6, Rr]) { px(g, CP.ink, x, WT, 6, B - WT + 6); px(g, CP.postHi, x + 1, WT, 4, B - WT + 5); px(g, CP.post, x + 2, WT, 2, B - WT + 5) }
  px(g, CP.ink, L - 6, B, Rr - L + 12, 6); px(g, CP.postHi, L - 5, B + 1, Rr - L + 10, 4); px(g, CP.post, L - 5, B + 2, Rr - L + 10, 2);
  const dx = R.door * 16; px(g, WG.dark, dx, B, 16, 6); px(g, CP.postHi, dx - 1, B, 1, 6); px(g, CP.postHi, dx + 16, B, 1, 6);
  px(g, CP.ink, dx + 1, B - 7, 14, 6); px(g, '#6a8a3a', dx + 2, B - 6, 12, 4); px(g, '#8aaa52', dx + 3, B - 5, 10, 1);
}
function drawCarpFurn(g, o, X, Y, B, w, t) {
  const sh = (sx, sw) => px(g, 'rgba(60,35,15,.25)', sx, B - 2, sw, 2);
  const plank = (x, y, len, vert) => { if (vert) { px(g, CP.ink, x, y, 5, len); px(g, CP.plank, x + 1, y + 1, 3, len - 2); px(g, CP.plankHi, x + 1, y + 1, 1, len - 2) } else { px(g, CP.ink, x, y, len, 5); px(g, CP.plank, x + 1, y + 1, len - 2, 3); px(g, CP.plankHi, x + 1, y + 1, len - 2, 1) } };
  switch (o.k) {
    case 'lumber': {   // upright boards leaning in a rack
      sh(X, w); px(g, CP.ink, X + 1, Y - 30, w - 2, 46); px(g, CP.postLo, X + 2, Y - 29, w - 4, 44);
      for (let i = 0; i < 5; i++) plank(X + 3 + i * 5, Y - 28 + (i % 2) * 3, 42 - (i % 2) * 3, true);
      px(g, CP.post, X + 1, Y - 8, w - 2, 3); px(g, CP.postHi, X + 1, Y - 8, w - 2, 1);
      break;
    }
    case 'pegboard': {
      px(g, CP.ink, X + 1, Y - 32, w - 2, 22); px(g, CP.plankLo, X + 2, Y - 31, w - 4, 20);
      for (let yy = Y - 29; yy < Y - 12; yy += 4) for (let xx = X + 4; xx < X + w - 3; xx += 4) px(g, CP.postLo, xx, yy, 1, 1);
      px(g, CP.post, X + 5, Y - 27, 2, 12); px(g, CP.postLo, X + 3, Y - 28, 6, 4);                                  // mallet
      px(g, CP.iron, X + 12, Y - 28, 2, 10); px(g, CP.post, X + 12, Y - 18, 2, 4);                                  // chisel
      px(g, CP.iron, X + 16, Y - 28, 2, 8); px(g, CP.post, X + 16, Y - 20, 2, 5);                                   // chisel
      px(g, CP.ink, X + 21, Y - 28, 8, 7); px(g, CP.iron, X + 22, Y - 27, 6, 5); px(g, CP.post, X + 22, Y - 21, 2, 6);   // hand plane / square
      // workbench under it
      sh(X, w); px(g, CP.ink, X, Y - 2, w, 18); px(g, CP.plankHi, X + 1, Y - 1, w - 2, 3); px(g, CP.plank, X + 1, Y + 2, w - 2, 2); px(g, CP.post, X + 2, Y + 4, 3, 11); px(g, CP.post, X + w - 5, Y + 4, 3, 11); px(g, CP.postLo, X + 5, Y + 9, w - 10, 2);
      px(g, CP.ink, X + 8, Y - 5, 8, 4); px(g, CP.iron, X + 9, Y - 4, 6, 2); px(g, CP.dust, X + 18, Y - 3, 6, 1); px(g, CP.dustLo, X + 20, Y - 4, 3, 1);
      break;
    }
    case 'models': {   // shelf of little model buildings
      sh(X + 1, w - 2); px(g, CP.ink, X + 1, Y - 22, w - 2, 38); px(g, CP.post, X + 2, Y - 21, w - 4, 36); px(g, CP.postHi, X + 2, Y - 21, w - 4, 1);
      for (let r = 0; r < 2; r++) px(g, CP.postLo, X + 3, Y - 19 + r * 14, w - 6, 12);
      const house = (hx, hy, roof, wd) => { px(g, CP.ink, hx, hy - 9, wd, 10); px(g, '#e8d2a8', hx + 1, hy - 5, wd - 2, 5); px(g, roof, hx + 1, hy - 8, wd - 2, 3); px(g, CP.ink, hx + (wd >> 1) - 1, hy - 3, 2, 3) };
      house(X + 4, Y - 8, '#6aa04a', 10); house(X + 17, Y - 8, '#c0503a', 12);                                     // farmhouse, barn
      house(X + 6, Y + 6, '#d9a04a', 8); px(g, CP.ink, X + 18, Y + 1, 9, 5); px(g, CP.paper, X + 19, Y + 2, 7, 3); px(g, CP.blue, X + 20, Y + 3, 5, 1);   // coop, rolled plan
      px(g, CP.ink, X + 2, Y + 11, w - 4, 5); px(g, CP.post, X + 3, Y + 12, w - 6, 3);
      break;
    }
    case 'plans': {    // the big planning table you order buildings across
      sh(X, w); px(g, CP.ink, X, Y - 4, w, 20); px(g, CP.plankHi, X + 1, Y - 3, w - 2, 4); px(g, CP.plank, X + 1, Y + 1, w - 2, 14);
      for (let i = 0; i < w - 2; i += 14) { px(g, CP.plankLo, X + 2 + i, Y + 3, 12, 10); px(g, CP.plank, X + 3 + i, Y + 4, 10, 8) }
      // a big blueprint, a pencil, a ruler and a small hand bell
      const px0 = X + 22; px(g, CP.ink, px0, Y - 11, 40, 9); px(g, CP.blue, px0 + 1, Y - 10, 38, 7);
      for (const [a, b, c, d] of [[4, 2, 14, 1], [4, 2, 1, 4], [17, 2, 1, 4], [4, 5, 14, 1], [10, 0, 1, 2], [8, 0, 5, 1], [22, 2, 12, 1], [22, 2, 1, 4], [33, 2, 1, 4], [22, 5, 12, 1], [26, 4, 3, 2]]) px(g, '#d6e4f6', px0 + 1 + a, Y - 10 + b, c, d);
      px(g, CP.ink, X + 70, Y - 7, 14, 3); px(g, '#e0c050', X + 71, Y - 6, 12, 1);
      px(g, CP.ink, X + 8, Y - 8, 3, 5); px(g, '#f2c94c', X + 9, Y - 7, 1, 3);
      px(g, CP.ink, X + 92, Y - 9, 7, 6); px(g, '#e2b04a', X + 93, Y - 8, 5, 4); px(g, CP.ink, X + 95, Y - 10, 1, 1);
      break;
    }
    case 'sawhorse': {
      sh(X - 2, 20); px(g, CP.ink, X + 1, Y + 2, 2, 14); px(g, CP.ink, X + 13, Y + 2, 2, 14); px(g, CP.post, X + 2, Y + 3, 1, 12); px(g, CP.post, X + 13, Y + 3, 1, 12);
      px(g, CP.ink, X - 3, Y - 3, 22, 7); px(g, '#8a5a32', X - 2, Y - 2, 20, 5); px(g, '#a8784a', X - 2, Y - 2, 20, 1); px(g, CP.ink, X + 17, Y - 2, 2, 5); px(g, '#e0b880', X + 17, Y - 1, 1, 3);   // a log
      px(g, CP.iron, X + 6, Y - 9, 2, 7); px(g, CP.ironHi, X + 6, Y - 9, 1, 7); px(g, CP.post, X + 5, Y - 12, 4, 4);   // saw stuck in it
      px(g, CP.dust, X + 5, B - 3, 6, 1); px(g, CP.dustLo, X + 7, B - 4, 3, 1);
      break;
    }
    case 'chair': {    // a half-built chair
      sh(X + 2, 12); px(g, CP.ink, X + 3, Y - 6, 10, 22); px(g, CP.plank, X + 4, Y - 5, 2, 20); px(g, CP.plank, X + 10, Y - 5, 2, 20); px(g, CP.plankHi, X + 4, Y - 5, 8, 2); px(g, CP.plankHi, X + 4, Y, 8, 1);
      px(g, CP.ink, X + 2, Y + 4, 12, 4); px(g, CP.plank, X + 3, Y + 5, 10, 2); px(g, 'rgba(46,26,14,0)', 0, 0, 0, 0);
      break;
    }
    case 'planks': { sh(X, 16); for (let i = 0; i < 4; i++) plank(X + 1 - (i % 2), Y + 10 - i * 4, 15, false); break }
    default: return false;
  }
  return true;
}

// ---------- going in and out ----------
async function enterBuilding(k) {
  const R = ROOMS[k]; if (!R) return;
  if (R.shop && !shopOpen(R.shop)) { if (!enterBuilding.told) { enterBuilding.told = 1; await say(`The door is locked. ${closedMsg(R.shop)}`); setTimeout(() => enterBuilding.told = 0, 1500) } return }
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
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = World.objs[idx(x, y)]; if (o && (o.t === 'dock' || o.t === 'bridge' || o.t === 'deck')) drawFloorObj(g, o, x, y) }
  if (which === 'sea') drawSeaWater(g, 0, 0, W - 1, H - 1, 0);
  const D = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = World.objs[idx(x, y)]; if (o && o.t !== 'part') D.push([y + (o.t === 'grass' ? .4 : .9), 0, o, x, y]); const so = World.soil[idx(x, y)]; if (so && so.c) D.push([y + .7, 1, so, x, y]) }
  D.sort((p, q) => p[0] - q[0]);
  for (const d of D) { if (d[1]) drawCrop(g, d[2], d[3], d[4], 0); else { const sh = d[2].shake; d[2].shake = 0; drawObject(g, d[2], d[3], d[4], 0); d[2].shake = sh } }
  useMap(prev); return c;
}
function mapTab(b, which) {
  const here = isInside() ? 'town' : World.cur; which = which || mapView || here; mapView = which;
  b.innerHTML = `<div class="mapbtns"><button class="btn ${which === 'farm' ? '' : 'alt'}" data-mv="farm">${esc(state.look.farm || 'Your farm')}</button><button class="btn ${which === 'town' ? '' : 'alt'}" data-mv="town">Bethlehem</button><button class="btn ${which === 'jordan' ? '' : 'alt'}" data-mv="jordan">Jordan</button><button class="btn ${which === 'sea' ? '' : 'alt'}" data-mv="sea">Sea</button><button class="btn alt mz" id="mZoom">${mapZoom ? '－' : '＋'}</button></div>
    <div class="mapwrap"><div class="mapinner ${mapZoom ? 'zoom' : ''}"></div></div>
    <div class="mapkey"><span><i class="kd you"></i>You</span><span><i class="kd open"></i>Open now</span><span><i class="kd shut"></i>Closed</span></div>
    <p class="muted" style="margin:4px 2px 0">${which === here ? '' : 'You aren’t in this area right now. '}${which === 'farm' ? 'The road on the right leads to Bethlehem.' : which === 'jordan' ? 'River fish in the Jordan, shore fish from the beach and dock. Row the boat south to reach the open sea.' : which === 'sea' ? 'Light water is offshore fishing. The dark water is the deep sea, where the biggest fish live (you need a Sturdy Rod there).' : 'The road on the left leads home to your farm, and the road south goes to the Jordan. Mount Sinai isn’t open yet.'}</p>`;
  b.querySelectorAll('[data-mv]').forEach(el => el.onclick = () => { sfx.tap(); mapTab(b, el.dataset.mv) });
  $('#mZoom').onclick = () => { sfx.tap(); mapZoom = !mapZoom; mapTab(b, which) };
  const inner = b.querySelector('.mapinner'), art = renderMapArt(which); art.className = 'mapart'; inner.appendChild(art);
  const pos = (x, y) => `left:${x / W * 100}%;top:${y / H * 100}%`;
  const lab = (html, x, y, cls = '') => inner.insertAdjacentHTML('beforeend', `<div class="mlab ${cls}" style="${pos(x, y)}">${html}</div>`);
  const status = k => `<i class="kd ${shopOpen(k) ? 'open' : 'shut'}"></i>`;
  if (which === 'town') {
    const T = World.maps.town;
    const names = { synagogue: ['⛪', 'Church'], smithy: ['⚒️', 'Blacksmith', 'smithy'], inn: ['🍞', 'Inn', 'inn'], carpenter: ['🪚', 'Carpenter', 'carpenter'], stall_blue: ['🧺', 'Market', 'market'], well: ['💧', 'Well'] };
    for (let i = 0; i < W * H; i++) { const o = T.objs[i]; if (o && o.t === 'bld' && names[o.k]) { const x = i % W, y = (i / W) | 0, [ic, n, shop] = names[o.k], sp = AT[BLD[o.k][0]][0]; lab(`${shop ? status(shop) : ''}${ic} ${n}`, x + BLD[o.k][1] / 2, y + 1 - sp.height / 16 - .2) } }
    lab('↑ Mount Sinai <small>(soon)</small>', 25, 2.2, 'road'); lab('↓ The Jordan', 34.5, H - .4, 'road'); lab('← Your farm', .4, 26.4, 'road left');
  } else if (which === 'jordan') {
    lab('↑ Bethlehem', 34.5, 2.6, 'road'); lab('🌊 Jordan River', 26, 9.6); lab('Creek', 57, 9.8, 'sm'); lab('🐟 Galilee Bay', 50, 48);
    lab('⚓ Dock', 30.5, 46.6); lab('↓ Open sea', 34, H - .4, 'road'); lab('🏠 Peter’s hut', JORDAN.hut[0], JORDAN.hut[1] - 3.4, 'sm');
  } else if (which === 'sea') {
    lab('↑ Galilee Bay', 34, 2.4, 'road'); lab('🐟 Offshore', 40, 12, 'sm'); lab('🌊 The Deep Sea', 33, 33); lab('🏝️ Gull Island', 14, 8.6); lab('Lighthouse', 51, 38.4, 'sm');
  } else {
    const F = World.maps.farm, Tn = World.TENT; let home = ['⛺', 'Tent'], wx = 0, wy = 0, wn = 0;
    for (let i = 0; i < W * H; i++) { const o = F.objs[i], x = i % W, y = (i / W) | 0;
      if (o && o.t === 'bld') { if (o.k === 'farmhouse') home = ['🏠', 'Home']; if (o.k === 'coop') lab('🐔 Coop', x + 1, y - 2.4); if (o.k === 'barn') lab('🐐 Barn', x + 2.5, y - 4) }
      if (o && o.t === 'bin') lab('📦 Bin', x + .5, y + 1.15, 'sm below'); if (o && o.t === 'crate') lab('🗃️ Chest', x + .5, y + 1.15, 'sm below');
      if (F.ground[i] === WATER && x > 3 && y > 3 && x < W - 3 && y < H - 3) { wx += x; wy += y; wn++ } }
    lab(`${home[0]} ${home[1]}`, Tn.x + .5, Tn.y - 1.6); if (wn) lab('🐟 Pond', wx / wn + .5, wy / wn + .5, 'sm');
    lab('Bethlehem →', W - .4, World.EXIT.y - .6, 'road right');
  }
  const B = boat(); if (B.map === which && !state.inBoat) lab('⛵ Your boat', B.x, B.y - .7, 'sm');
  if (which === here) {
    let mx = player.x, my = player.y; if (isInside()) { const d = bldDoor(World.cur); mx = d[0]; my = d[1] }
    inner.insertAdjacentHTML('beforeend', `<div class="pin" style="${pos(mx, my)}"><b></b><span>${isInside() ? 'You (inside)' : state.inBoat ? 'You (in the boat)' : 'You'}</span></div>`);
    if (mapZoom) requestAnimationFrame(() => { const w = b.querySelector('.mapwrap'); w.scrollLeft = mx / W * inner.offsetWidth - w.clientWidth / 2; w.scrollTop = my / H * inner.offsetHeight - w.clientHeight / 2 });
  }
}
// ---------- things to look at inside ----------
function furnitureAction(o) {
  switch (o.k) {
    case 'bimah': visitChurch(); break;
    case 'bar': { const m = npcs.find(n => n.v.id === 'miriam' && n.map === World.cur); if (m && shopOpen('inn')) talkTo(m); else say(closedMsg('inn')); break }
    case 'hearth': say('A big stone hearth. A pot of lentil stew bubbles over the fire and smells wonderful.'); break;
    case 'pantry': say('Shelves of fresh loaves, honey jars and dried figs.'); break;
    case 'kegs': say('Clay jars of olive oil and wine, sealed with wax.'); break;
    case 'dresser': say('Miriam’s best plates and bowls, painted blue and white.'); break;
    case 'stairs': say('Stairs up to the guest rooms. Miriam says they’re being freshened up. (Coming soon!)'); break;
    case 'table': say(pick(['A sturdy table, scrubbed clean. Someone left a few crumbs of bread.', 'A wooden table with a little oil lamp on it.', 'The table wobbles a little. Cozy anyway.'])); break;
    case 'ibarrel': say('A barrel of water for the kitchen.'); break;
    case 'iplant': say('A potted olive sapling.'); break;
    case 'plans': { const j = npcs.find(n => n.v.id === 'joseph' && n.map === World.cur); if (j && shopOpen('carpenter')) talkTo(j); else say(closedMsg('carpenter')); break }
    case 'lumber': say('Cedar, cypress and olive wood, stacked to dry. Joseph says cedar smells the best.'); break;
    case 'pegboard': say('Joseph’s workbench. Mallets, chisels and a hand plane hang neatly above it.'); break;
    case 'models': say('Little wooden models: a farmhouse, a barn and a chicken coop. Joseph builds these before the real thing.'); break;
    case 'sawhorse': say('A log half sawn through. The sawdust smells sweet.'); break;
    case 'chair': say('A chair Joseph is making. It still needs a seat.'); break;
    case 'planks': say('A stack of smooth, sanded planks.'); break;
    case 'counter': { const j = npcs.find(n => n.v.id === 'jesse' && n.map === World.cur); if (j && shopOpen('smithy')) talkTo(j); else say(closedMsg('smithy')); break }
    case 'forge': say('The forge roars. The coals glow white-hot in the middle.'); break;
    case 'bellows': say('A big leather bellows for blowing air into the forge.'); break;
    case 'sanvil': say('Jesse’s main anvil, worn shiny on top from years of hammering.'); break;
    case 'quench': say('A barrel of water for cooling hot metal. It hisses and steams.'); break;
    case 'toolwall': say('Hammers, tongs and chisels, each hanging in its own place.'); break;
    case 'grind': say('A grinding wheel for sharpening blades.'); break;
    case 'display': say('Jesse’s finest work: a bronze axe and an iron pickaxe, polished to a shine. Ask him about upgrades at the counter.'); break;
    case 'ore': say('A crate of copper and iron ore, waiting to be smelted.'); break;
    case 'coal': say('A pile of charcoal for the forge.'); break;
    case 'sbarrel': say('A barrel of iron nails and odd bits of metal.'); break;
    case 'ark': say('The altar, hung with a blue curtain and a golden cross. On top sit two stone tablets for the Ten Commandments, and a small lamp burns before it day and night.'); break;
    case 'menorah': say('A golden lampstand with seven branches. Its flames flicker softly.'); break;
    case 'shelf': say('Shelves of scrolls: the Law, the Prophets and the Psalms.'); break;
    case 'pew': say('A long wooden bench, worn smooth by many Sabbaths.'); break;
    case 'lamp': say('An oil lamp on a stand. Someone keeps it filled every evening.'); break;
    case 'plant': say('A potted myrtle. It smells sweet.'); break;
  }
}
