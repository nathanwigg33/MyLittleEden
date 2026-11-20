// The farm map: ground, objects, terrain drawing.
'use strict';
const W = 64, H = 54;
const WATER = 0, DIRT = 1, GRASS = 2;
const idx = (x, y) => y * W + x, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
// object types: hp = hits to clear, tool = which tool clears it, solid = blocks walking
const OBJ = {
  oak: { tool: 'axe', hp: 6, solid: 1, tree: 1 }, olive: { tool: 'axe', hp: 6, solid: 1, tree: 1 },
  stump: { tool: 'axe', hp: 3, solid: 1 }, twig: { tool: 'axe', hp: 1, solid: 1 },
  rock: { tool: 'pick', hp: 2, solid: 1 }, boulder: { tool: 'pick', hp: 5, solid: 1 },
  weed: { tool: 'scythe', hp: 1, solid: 1 }, grass: { tool: 'scythe', hp: 1, solid: 0 },
  wild: { solid: 1 }, bush: { solid: 1 }, tent: { solid: 1 }, part: { solid: 1 }, campfire: { solid: 1 }, sign: { solid: 1 }, crate: { solid: 1 }, bin: { solid: 1 }, cart: { solid: 1 }, bld: { solid: 1 }, forge: { solid: 1 }, dock: { solid: 0 }, bridge: { solid: 0 }, node: { tool: 'pick', hp: 3, solid: 1 }, ladder: { solid: 1 }, ladder_up: { solid: 1 }, minecart: { solid: 1 }, shell: { solid: 0 }, wreck: { solid: 1 }, lighthouse: { solid: 1 }, deck: { solid: 0 }, fboat: { solid: 1 }, mast: { solid: 1 }, helm: { solid: 1 }, coracle: { solid: 1 }, duck: { solid: 0 }, deco: { solid: 0 }, ifurn: { solid: 1 }, anvil: { solid: 1 }, torch: { solid: 1 }, barrel: { solid: 1 },
};
const World = {
  ground: null, objs: null, seed: 1,
  TENT: { x: 20, y: 12 }, EXIT: { x: 63, y: 27 },
  get(x, y) { return inb(x, y) ? this.objs[idx(x, y)] : null },
  // the object at a cell (follows multi-cell parts back to their owner)
  owner(x, y) { const o = this.get(x, y); if (o && o.t === 'part') { if (o.ox < 0) return null; const ow = this.objs[idx(o.ox, o.oy)]; return ow ? { o: ow, x: o.ox, y: o.oy } : null } return o ? { o, x, y } : null },
  solid(x, y) { if (!inb(x, y)) return true; const o = this.objs[idx(x, y)]; if (this.ground[idx(x, y)] === WATER) return !(o && (o.t === 'dock' || o.t === 'bridge' || o.t === 'deck')); return !!(o && OBJ[o.t] && OBJ[o.t].solid) },
  place(x, y, o) { this.objs[idx(x, y)] = o },
  footprint(x, y, w, h, o) { for (let yy = y - h + 1; yy <= y; yy++) for (let xx = x - Math.floor(w / 2); xx <= x + Math.floor(w / 2); xx++) this.objs[idx(xx, yy)] = (xx === x && yy === y) ? o : { t: 'part', ox: x, oy: y } },
};

// ---------- new farm ----------
function genFarm(seed) {
  const R = mulberry(seed); World.seed = seed; World.pave = null;
  const g = World.ground = new Uint8Array(W * H).fill(GRASS), o = World.objs = new Array(W * H).fill(null);
  const noise = (x, y, s) => { // smooth value noise
    const fx = x / s, fy = y / s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sm = t => t * t * (3 - 2 * t);
    const h = (a, b) => hash(a * 13 + seed, b * 7 - seed);
    return lerp(lerp(h(x0, y0), h(x0 + 1, y0), sm(tx)), lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), sm(tx)), sm(ty));
  };
  // pond (south-east)
  const P = { x: 47, y: 41 };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - P.x) / 1.25, y - P.y) + noise(x, y, 3) * 2.2; if (d < 5.2) g[idx(x, y)] = WATER }
  // dirt patches across the field
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) if (g[idx(x, y)] === GRASS && noise(x + 50, y + 20, 5) > .72) g[idx(x, y)] = DIRT;
  // yard in front of the tent and the road to town
  const T = World.TENT;
  for (let y = T.y - 3; y <= T.y + 5; y++) for (let x = T.x - 6; x <= T.x + 6; x++) if (Math.hypot((x - T.x) / 6, (y - T.y - 1) / 4) < 1) g[idx(x, y)] = DIRT;
  let px = T.x, py = T.y + 3;
  const road = [];
  const ry = Math.floor(H / 2);
  while (py < ry) { road.push([px, py]); py++ }
  while (px < W) { road.push([px, py]); if (R() < .12 && py < ry + 2) py++; else if (R() < .1 && py > ry - 1) py--; px++ }
  for (const [x, y] of road) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (inb(x + dx, y + dy)) g[idx(x + dx, y + dy)] = DIRT;
  const roadSet = new Set(road.flatMap(([x, y]) => [idx(x, y), idx(x + 1, y), idx(x, y + 1), idx(x + 1, y + 1), idx(x, y - 1), idx(x - 1, y), idx(x + 2, y), idx(x, y + 2)]));
  World.EXIT = { x: W - 1, y: road[road.length - 1][1] };
  // tent + campfire + a crate of starter supplies
  World.footprint(T.x, T.y, 3, 2, { t: 'tent' });
  World.place(T.x + 3, T.y + 1, { t: 'campfire' });
  World.place(T.x - 3, T.y, { t: 'crate' });
  World.place(T.x + 3, T.y - 1, { t: 'bin' });
  const keep = (x, y) => Math.hypot((x - T.x) / 5.5, (y - T.y - 1) / 4) < 1 || roadSet.has(idx(x, y));
  // forest border (cannot be cleared)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y) + noise(x, y, 2) * 1.6;
    if (edge < 2.4 && !roadSet.has(idx(x, y)) && g[idx(x, y)] !== WATER) o[idx(x, y)] = { t: 'wild', k: pick(['oak', 'oak', 'pine', 'tree2']), v: ri(0, 3) };
    else if (edge < 3.2 && !roadSet.has(idx(x, y)) && g[idx(x, y)] !== WATER) o[idx(x, y)] = { t: R() < .5 ? 'bush' : 'wild', k: pick(['oak', 'tree2']), v: ri(0, 1) };
  }
  fillBorder(R);
  placeRoadSign(W - 6, World.EXIT.y - 1, FARM_SIGN);
  // overgrowth
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    const i = idx(x, y); if (o[i] || g[i] === WATER || keep(x, y)) continue;
    let nearWater = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g[idx(x + dx, y + dy)] === WATER) nearWater = true;
    const woods = noise(x + 9, y + 3, 6), r = R();
    if ((woods > .56 && r < .42 || r > .975) && !nearWater) o[i] = { t: R() < .55 ? 'oak' : 'olive', hp: 6, v: ri(0, 3) };
    else if (r < .06) o[i] = { t: 'rock', hp: 2, v: ri(0, 1) };
    else if (r < .08 && !nearWater) o[i] = { t: 'boulder', hp: 5 };
    else if (r < .12) o[i] = { t: 'twig', hp: 1 };
    else if (r < .145) o[i] = { t: 'stump', hp: 3 };
    else if (r < .38) o[i] = { t: 'weed', hp: 1, v: ri(0, 3) };
    else if (r < .55 && g[i] === GRASS) o[i] = { t: 'grass', hp: 1, v: ri(0, 3) };
  }
  // a few trees right by the tent for shade
  World.place(T.x - 5, T.y - 2, { t: 'olive', hp: 6, v: 1 }); World.place(T.x + 5, T.y - 3, { t: 'oak', hp: 6, v: 2 });
}

// ---------- terrain drawing (dual grid: smooth, diagonal edges like the art pack) ----------
const TB = { land: [], grass: [] };
function bakeTerrain() {
  const grassTex = AT.grass.slice(0, 2).map(c => tintCanvas(c, [1.03, .98, .86], [8, 4, 0]));
  const grassTex2 = AT.grass.slice(2, 4).map(c => tintCanvas(c, [1.03, .98, .86], [8, 4, 0]));
  const dirtTex = AT.dirt.map(c => tintCanvas(c, [1.02, 1, .96], [4, 2, 0]));
  const px = (c) => c.getContext('2d').getImageData(0, 0, 16, 16).data;
  const gT = [...grassTex, ...grassTex2].map(px), dT = dirtTex.map(px);
  const f = (c, u, v) => (c[0] * (1 - u) + c[1] * u) * (1 - v) + (c[2] * (1 - u) + c[3] * u) * v;
  for (let m = 0; m < 16; m++) {
    const c = [m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1];
    const on = (i, j) => f(c, (i + .5) / 16, (j + .5) / 16) >= .5;
    // land over water: dirt, cliff face below, foam ring
    TB.land[m] = [0, 1].map(frame => dT.map(tex => {
      const cv = mkc(16, 16), g = cv.getContext('2d'), d = g.createImageData(16, 16), a = d.data;
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const k = (j * 16 + i) * 4, s = (((j + 8) & 15) * 16 + ((i + 8) & 15)) * 4; let col = null, al = 255;
        if (on(i, j)) { col = [tex[s], tex[s + 1], tex[s + 2]]; if (!on(i, j + 1)) col = [col[0] * .82, col[1] * .8, col[2] * .78] }
        else if (on(i, j - 1)) col = [139, 92, 62];
        else if (on(i, j - 2)) col = [112, 70, 48];
        else if (on(i, j - 3)) col = [86, 54, 40];
        else { let near = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (on(i + dx, j + dy)) near = 1; if (!near) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, 4], [0, 5]]) if (on(i + dx, j + dy)) near = 2;
          if (near === 1 && frame === 0 || near === 2 && frame === 1) { col = [235, 248, 255]; al = 200 } }
        if (col) { a[k] = col[0]; a[k + 1] = col[1]; a[k + 2] = col[2]; a[k + 3] = al }
      }
      g.putImageData(d, 0, 0); return cv;
    }));
    // grass over dirt: dark rim, soft shadow under the edge
    TB.grass[m] = gT.map(tex => {
      const cv = mkc(16, 16), g = cv.getContext('2d'), d = g.createImageData(16, 16), a = d.data;
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const k = (j * 16 + i) * 4, s = (((j + 8) & 15) * 16 + ((i + 8) & 15)) * 4;
        if (on(i, j)) {
          let rim = !on(i + 1, j) || !on(i - 1, j) || !on(i, j - 1), bot = !on(i, j + 1);
          a[k] = tex[s]; a[k + 1] = tex[s + 1]; a[k + 2] = tex[s + 2]; a[k + 3] = 255;
          if (bot) { a[k] = 74; a[k + 1] = 128; a[k + 2] = 52 } else if (rim) { a[k] = 112; a[k + 1] = 178; a[k + 2] = 70 }
        } else if (on(i, j - 1)) { a[k] = 0; a[k + 1] = 0; a[k + 2] = 0; a[k + 3] = 46 }
      }
      g.putImageData(d, 0, 0); return cv;
    });
  }
}
// how many hits something takes with a basic tool: the bigger the rock, the more hits, everywhere in the game
function objHp(o) {
  if (o.t === 'rock') return o.v ? 3 : 2;            // small stone / medium rock
  if (o.t === 'boulder') return 6;
  if (o.t === 'node') return (ORES[o.k] || ORES.stone).hp;
  return (OBJ[o.t] && OBJ[o.t].hp) || 1;
}
function groundAt(x, y) { x = clamp(x, 0, W - 1); y = clamp(y, 0, H - 1); return World.ground[idx(x, y)] }
function drawTerrain(g, x0, y0, x1, y1, t) {
  // water everywhere underneath
  const wf = Math.floor(t * 1.2) % 2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    g.drawImage(AT.water[(Math.floor(hash(x, y) * 4) + wf) % AT.water.length], x * 16, y * 16);
    if (hash(x + 3, y + 7) < .1) { g.fillStyle = `rgba(255,255,255,${.25 + .25 * Math.sin(t * 1.6 + x)})`; g.fillRect(x * 16 + 4 + Math.round(Math.sin(t + y) * 2), y * 16 + 9, 5, 1) }
  }
  const foam = Math.floor(t * 1.5) % 2;
  for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) {
    const L = (a, b) => groundAt(a, b) !== WATER ? 1 : 0, Gr = (a, b) => groundAt(a, b) === GRASS ? 1 : 0;
    const ml = L(x, y) | (L(x + 1, y) << 1) | (L(x, y + 1) << 2) | (L(x + 1, y + 1) << 3);
    const v = Math.floor(hash(x * 3, y * 5) * 4);
    if (ml) g.drawImage(TB.land[ml][foam][v % TB.land[ml][foam].length], x * 16 + 8, y * 16 + 8);
    const mg = Gr(x, y) | (Gr(x + 1, y) << 1) | (Gr(x, y + 1) << 2) | (Gr(x + 1, y + 1) << 3);
    if (mg) g.drawImage(TB.grass[mg][hash(x * 7, y * 3) < .7 ? v % 2 : 2 + v % 2], x * 16 + 8, y * 16 + 8);
  }
  // flat ground decoration (flowers, little plants)
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    if (World.ground[idx(x, y)] !== GRASS || World.objs[idx(x, y)]) continue; const h = hash(x * 11 + 5, y * 17 + 3);
    if (h < .05) { const s = AT.flower[Math.floor(h * 60) % AT.flower.length]; g.drawImage(s, x * 16 + 4 + Math.floor(h * 100) % 6, y * 16 + 4) }
    else if (h < .09) { const s = AT.tuft[Math.floor(h * 99) % AT.tuft.length]; g.drawImage(s, x * 16 + 8 - s.width / 2, y * 16 + 8 - s.height / 2) }
  }
}

// ---------- object sprites ----------
// make sure an older farm gets a shipping bin beside the tent
function ensureBin() {
  if (World.objs.some(o => o && o.t === 'bin')) return; const T = World.TENT;
  for (const [dx, dy] of [[3, -1], [2, 1], [-2, 1], [4, 0], [-4, 1], [3, 2], [-3, 2], [0, 3]]) { const x = T.x + dx, y = T.y + dy; if (inb(x, y) && !World.objs[idx(x, y)] && World.ground[idx(x, y)] !== WATER) { World.place(x, y, { t: 'bin' }); return } }
}
// shipping bin: a wide wooden crate (same wood and palette as the crate by the tent) with its lid propped open
const BIN = (() => {
  const c = mkc(24, 24), g = c.getContext('2d'), R = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h) };
  const D = 'rgb(115,62,57)', M = 'rgb(184,111,80)', M2 = 'rgb(194,133,105)', L = 'rgb(228,166,114)', C = 'rgb(234,212,170)', IN = 'rgb(58,32,36)', SH = 'rgba(24,20,37,.53)';
  // shadow
  R(SH, 1, 20, 22, 3); R(SH, 2, 23, 20, 1);
  // lid, tipped back
  R(D, 2, 0, 20, 7); R(L, 3, 1, 18, 5); [7, 12, 16].forEach(x => R(M2, x, 1, 1, 5)); R(C, 3, 1, 2, 1); R(C, 19, 1, 2, 1); R(C, 3, 5, 2, 1); R(C, 19, 5, 2, 1); R(M, 3, 6, 18, 1);
  // box top: rim around a dark opening with goods inside
  R(D, 0, 7, 24, 6); R(M, 1, 8, 22, 4); R(IN, 3, 9, 18, 2);
  R('rgb(160,96,58)', 5, 9, 3, 1); R('rgb(122,70,44)', 5, 10, 3, 1);            // a log
  R('rgb(232,196,92)', 10, 9, 2, 1); R('rgb(200,160,64)', 10, 10, 2, 1); R('rgb(232,196,92)', 13, 9, 1, 1); // wheat
  R('rgb(150,150,160)', 16, 9, 2, 1); R('rgb(110,110,124)', 16, 10, 2, 1);     // a stone
  R(L, 1, 11, 22, 1); R(C, 1, 11, 2, 1); R(C, 21, 11, 2, 1);
  // front planks
  R(D, 0, 12, 24, 8); R(M, 1, 12, 22, 7); R(M2, 2, 13, 20, 1); R(M2, 2, 17, 20, 1); R(M2, 2, 13, 1, 5); R(M2, 21, 13, 1, 5); R(D, 1, 19, 22, 1);
  // little brass coin plate in the middle
  R(D, 8, 14, 8, 4); R(C, 9, 14, 6, 3); R('rgb(242,201,76)', 10, 15, 4, 1); R('rgb(196,140,40)', 11, 15, 2, 1);
  return c;
})();
const SIGN = (() => { const c = mkc(16, 18), g = c.getContext('2d'); g.fillStyle = '#24141e'; g.fillRect(6, 8, 4, 10); g.fillRect(0, 0, 16, 11); g.fillStyle = '#8a5a34'; g.fillRect(7, 9, 2, 9); g.fillStyle = '#c99256'; g.fillRect(1, 1, 14, 9); g.fillStyle = '#a8703e'; g.fillRect(1, 8, 14, 2); g.fillStyle = '#6a4024'; g.fillRect(3, 3, 10, 1); g.fillRect(3, 5, 7, 1); return c })();
function treeSprite(o, t, x, y) {
  const set = o.t === 'olive' || (o.t === 'wild' && o.k === 'olive') ? AT.olive : (o.k === 'tree2' || o.k === 'pine' ? AT.tree2 : AT.oak);
  if (set.length === 1) return set[0];
  return set[Math.floor(t * 1.4 + hash(x, y) * 4) % set.length];
}
function drawObject(g, o, x, y, t) {
  const cx = x * 16 + 8, by = y * 16 + 16;
  let sh = o.shake ? Math.round(Math.sin(t * 60) * o.shake * 6) : 0;
  const spr = (s, dy = 0, dx = 0) => g.drawImage(s, Math.round(cx - s.width / 2 + sh + dx), Math.round(by - s.height + dy));
  const shadow = (w, dy = -2) => { g.fillStyle = 'rgba(30,20,10,.22)'; g.beginPath(); g.ellipse(cx, by + dy, w, Math.max(2, w * .38), 0, 0, 7); g.fill() };
  switch (o.t) {
    case 'oak': case 'olive': shadow(10, -1); spr(treeSprite(o, t, x, y), 3); break;
    case 'wild': { const s = treeSprite(o, t, x, y); shadow(10, -1); g.drawImage(s, Math.round(cx - s.width / 2 + (hash(x, y) - .5) * 6), Math.round(by - s.height + 3 + (hash(y, x) - .5) * 4)); break }
    case 'stump': shadow(7); spr(AT.stump[0], 1); break;
    case 'twig': spr(AT.ic_wood[0], -2); break;
    case 'rock': shadow(6); spr(o.v ? AT.rock_m[0] : AT.stone[0], -1); break;
    case 'boulder': shadow(9); spr(AT.boulder[0], 0); break;
    case 'weed': spr([AT.weed, AT.weed2, AT.weed3, AT.weed4][o.v || 0][0], -1); break;
    case 'grass': case 'deco': spr(AT.leafy[(o.v || 0) % AT.leafy.length], -2); break;
    case 'bush': shadow(10); spr(AT.bush[0], 3); break;
    case 'tent': g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(cx, by - 2, 26, 6, 0, 0, 7); g.fill(); spr(AT.tent[0], 2); break;
    case 'campfire': shadow(7); spr(AT.campfire[0], 0); if (AT.fire) { const f = AT.fire[Math.floor(t * 9) % AT.fire.length]; g.drawImage(f, Math.round(cx - f.width / 2), Math.round(by - f.height - 5)) } break;
    case 'crate': shadow(7); spr(AT.crate[0], 0); break;
    case 'bin': spr(BIN, 4); break;
    case 'bld': { const b = BLD[o.k], s = AT[b[0]][0], bx0 = x * 16 + b[1] * 8; if (o.k === 'well') { g.fillStyle = '#6e6a66'; g.beginPath(); g.ellipse(bx0, by - 5, 21, 10, 0, 0, 7); g.fill(); g.fillStyle = '#a19a91'; g.beginPath(); g.ellipse(bx0, by - 6, 19, 8.5, 0, 0, 7); g.fill(); g.fillStyle = '#8a837b'; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; g.fillRect(Math.round(bx0 + Math.cos(a) * 16) - 1, Math.round(by - 6 + Math.sin(a) * 6.5), 3, 1) } if (AT.bucket) g.drawImage(AT.bucket[0], bx0 + 10, by - 12) } g.fillStyle = 'rgba(30,20,10,.22)'; g.fillRect(Math.round(bx0 - s.width / 2) + 2, by - 3, s.width - 2, 4); g.drawImage(s, Math.round(bx0 - s.width / 2), by - s.height + 1); if (o.k === 'synagogue') roofCross(g, Math.round(bx0), by - s.height + 3); break }
    case 'anvil': shadow(6); spr(AT.anvil[0], 0); break;
    case 'ifurn': drawFurn(g, o, x, y, t); break;
    case 'coracle': case 'duck': drawWaterObj(g, o, x, y, t); break;
    case 'shell': case 'wreck': case 'lighthouse': drawSeaObj(g, o, x, y, t); break;
    case 'node': case 'ladder': case 'ladder_up': case 'minecart': drawMineObj(g, o, x, y, t); break;
    case 'dock': case 'bridge': case 'deck': break;
    case 'forge': shadow(7); spr(AT.campfire[0], 0); { const f = AT.fire[Math.floor(t * 10) % AT.fire.length]; g.drawImage(f, Math.round(cx - f.width / 2), Math.round(by - f.height - 5)); g.drawImage(f, Math.round(cx - f.width / 2) + 3, Math.round(by - f.height - 7)) } break;
    case 'barrel': shadow(6); spr(AT.barrel[0], 0); break;
    case 'torch': spr(AT.torch[0], 0); if (AT.fire) { const f = AT.fire[Math.floor(t * 9 + x) % AT.fire.length]; g.drawImage(f, Math.round(cx - f.width / 2), Math.round(by - 22 - f.height + 6)) } break;
    case 'cart': spr(CART, 2); break;
    case 'sign': shadow(6); spr(SIGN, 0); break;
  }
  if (o.shake) o.shake = Math.max(0, o.shake - 1 / 60);
}

// ================= maps: the farm and the town share one size and swap in and out =================
World.maps = {}; World.cur = 'farm'; World.pave = null;
function useMap(name) { const m = World.maps[name]; World.ground = m.ground; World.objs = m.objs; World.soil = m.soil; World.pave = m.pave || null; World.cur = name }
function storeMap(name) { World.maps[name] = { ground: World.ground, objs: World.objs, soil: World.soil || {}, pave: World.pave } }

// ---------- Bethlehem ----------
const TOWN = { entry: { x: 1, y: 27 }, plaza: { x: 34, y: 28 } };
const BLD = { // sprite, width in tiles, depth in tiles (solid rows)
  synagogue: ['bld_synagogue', 6, 3], smithy: ['bld_smithy', 4, 2], inn: ['bld_inn', 5, 3], carpenter: ['bld_carpenter', 5, 2],
  houseA: ['bld_houseA', 4, 2], houseB: ['bld_houseB', 4, 2], houseC: ['bld_houseC', 4, 3], houseD: ['bld_houseD', 3, 2], houseE: ['bld_houseE', 3, 2], houseF: ['bld_houseF', 3, 2],
  farmhouse: ['bld_farmhouse', 3, 2], barn: ['bld_barn', 5, 3], coop: ['bld_coop', 2, 2],
  stall_red: ['stall_red', 3, 1], stall_blue: ['stall_blue', 3, 1], stall_green: ['stall_green', 3, 1], well: ['well_pack', 2, 1],
};
// place a building with its bottom-left cell at (x, y)
function placeBld(x, y, k, extra) {
  const [, w, d] = BLD[k];
  for (let yy = y - d + 1; yy <= y; yy++) for (let xx = x; xx < x + w; xx++) World.objs[idx(xx, yy)] = { t: 'part', ox: x, oy: y };
  World.objs[idx(x, y)] = Object.assign({ t: 'bld', k }, extra || {});
}
// fill the outer ring of a map so nobody can slip between the trees at the edge
function fillBorder(R) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), e = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (e > 2 || World.objs[i] || World.ground[i] === WATER || World.ground[i] === DIRT) continue;
    World.objs[i] = e < 2 ? { t: 'wild', k: pick(['oak', 'tree2', 'oak']), v: ri(0, 3) } : { t: 'bush', v: 0 };
  }
}
function genTown() {
  const g = World.ground = new Uint8Array(W * H).fill(GRASS), o = World.objs = new Array(W * H).fill(null), pv = World.pave = new Uint8Array(W * H); World.soil = {};
  const R = mulberry(777), seed = 777;
  const noise = (x, y, s) => { const fx = x / s, fy = y / s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sm = t => t * t * (3 - 2 * t), h = (a, b) => hash(a * 13 + seed, b * 7 - seed); return lerp(lerp(h(x0, y0), h(x0 + 1, y0), sm(tx)), lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), sm(tx)), sm(ty)) };
  const dirt = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) g[idx(x, y)] = DIRT };
  const P = TOWN.plaza;
  // streets
  dirt(0, 27, P.x, 28);                        // road in from the farm
  dirt(P.x, 12, P.x + 1, H - 1);               // north-south, out to the Jordan
  dirt(P.x, 27, 58, 28);                       // east street
  dirt(16, 17, 30, 25);                        // market square
  dirt(24, 0, 25, 17);                         // the road north to Mount Sinai
  // paved plaza
  for (let y = P.y - 7; y <= P.y + 7; y++) for (let x = P.x - 10; x <= P.x + 10; x++) if (inb(x, y) && Math.hypot((x - P.x) / 8, (y - P.y) / 5.2) < 1) { pv[idx(x, y)] = 1; g[idx(x, y)] = DIRT }
  // buildings (bottom-left cell) and the little paths to their doors
  const B = [['synagogue', 31, 19], ['smithy', 44, 23], ['inn', 43, 38], ['carpenter', 13, 34],
             ['houseA', 21, 38], ['houseB', 26, 43], ['houseC', 51, 33], ['houseD', 12, 20], ['houseE', 38, 44], ['houseF', 54, 42]];
  for (const [k, x, y] of B) { const w = BLD[k][1]; dirt(x - 1, y + 1, x + w, y + 2) }
  dirt(15, 29, 16, 35); dirt(22, 37, 33, 40); dirt(28, 42, 33, 45); dirt(36, 41, 37, 46); dirt(42, 39, 42, 41); dirt(36, 40, 43, 41);
  dirt(46, 25, 47, 26); dirt(52, 29, 53, 34); dirt(55, 29, 56, 44); dirt(13, 21, 15, 23);
  placeBld(17, 22, 'stall_red', { shop: 'market' }); placeBld(21, 22, 'stall_blue', { shop: 'market' }); placeBld(25, 22, 'stall_green', { shop: 'market' });
  for (const [k, x, y] of B) placeBld(x, y, k);
  World.place(49, 24, { t: 'anvil' }); World.place(51, 24, { t: 'forge' }); World.place(51, 22, { t: 'barrel' });
  placeBld(33, 28, 'well');
  for (const [x, y] of [[26, 24], [42, 24], [26, 32], [42, 32], [30, 20], [38, 20], [42, 39], [49, 39], [16, 25], [12, 35]]) World.place(x, y, { t: 'torch' });
  World.place(26, 7, { t: 'sign', text: 'North: the road to Mount Sinai and the Sinai Mines.' });
  World.place(36, 47, { t: 'sign', text: 'South: the Jordan River and Galilee Bay. Good fishing!' });
  for (const [x, y, k] of [[43, 22, 'crate'], [41, 37, 'barrel'], [48, 37, 'barrel'], [16, 21, 'crate'], [29, 21, 'barrel'], [19, 33, 'crate'], [12, 33, 'barrel'], [20, 33, 'crate']]) World.place(x, y, { t: k });
  for (const [x, y] of [[14, 25], [20, 30], [29, 35], [39, 34], [47, 30], [55, 25], [39, 15], [20, 14], [31, 47], [58, 37], [10, 30], [45, 46], [28, 10], [40, 10], [10, 15], [57, 20]]) if (!o[idx(x, y)]) World.place(x, y, { t: 'wild', k: 'olive', v: ri(0, 3) });
  // forest edge and a few bushes
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y); if (o[i] || g[i] === DIRT) continue;
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y) + noise(x, y, 2) * 1.6, inTown = x > 7 && x < 60 && y > 5 && y < 50;
    if (edge < 2.4 || (!inTown && R() < .55)) o[i] = { t: 'wild', k: pick(['oak', 'oak', 'tree2', 'olive']), v: ri(0, 3) };
    else if (R() < .05) o[i] = { t: 'bush', v: 0 };
    else if (R() < .12) o[i] = { t: 'deco', v: ri(0, 7) };
  }
  fillBorder(R);
  placeRoadSign(4, 26, 'Bethlehem — “house of bread”. Your farm is back down the road to the west.');
}
const FARM_SIGN = 'East: the road to Bethlehem. Follow it to the market, the blacksmith, the inn, the carpenter and the church.';
// put a sign beside a road and clear the trees around it so it can be seen
function placeRoadSign(x, y, text) { for (let yy = y - 2; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) { const o = World.get(xx, yy); if (o && ['wild', 'bush', 'deco', 'grass', 'sign'].includes(o.t)) World.place(xx, yy, null) } World.place(x, y, { t: 'sign', text }) }
// cobbled plaza
const PAVE = (() => {
  const out = []; for (let v = 0; v < 4; v++) {
    const c = mkc(16, 16), g = c.getContext('2d'), r = mulberry(91 + v); g.fillStyle = '#b8a582'; g.fillRect(0, 0, 16, 16);
    const rows = [[0, 5], [5, 5], [10, 6]];
    rows.forEach(([y, h], ri) => { let x = -((ri + v) % 3) * 2; while (x < 16) { const w = 4 + Math.floor(r() * 3); const t = r(); g.fillStyle = t < .3 ? '#d9c8a2' : t < .7 ? '#cdbb94' : '#c2ae86'; g.fillRect(x + 1, y + 1, w - 1, h - 1); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + 1, y + 1, w - 1, 1); x += w } });
    out.push(c);
  } return out;
})();
function drawPave(g, x0, y0, x1, y1) {
  if (!World.pave) return;
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    if (!World.pave[idx(x, y)]) continue; g.drawImage(PAVE[Math.floor(hash(x, y) * 4)], x * 16, y * 16);
    const p = (a, b) => inb(a, b) && World.pave[idx(a, b)]; g.fillStyle = '#9a8662';
    if (!p(x, y - 1)) g.fillRect(x * 16, y * 16, 16, 1); if (!p(x - 1, y)) g.fillRect(x * 16, y * 16, 1, 16); if (!p(x + 1, y)) g.fillRect(x * 16 + 15, y * 16, 1, 16);
    if (!p(x, y + 1)) { g.fillStyle = 'rgba(60,40,20,.35)'; g.fillRect(x * 16, y * 16 + 15, 16, 1) }
  }
}

// a gold cross standing on the church roof (base at x, y)
function roofCross(g, x, y) {
  const r = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h) };
  r('#3a2414', -3, -21, 6, 22); r('#3a2414', -7, -16, 14, 6);          // outline
  r('#d9ad3c', -2, -20, 4, 20); r('#d9ad3c', -6, -15, 12, 4);          // gold
  r('#f6d878', -2, -20, 1, 20); r('#f6d878', -6, -15, 12, 1);          // highlight
  r('#9c7020', 1, -20, 1, 20); r('#9c7020', -6, -12, 12, 1);           // shade
}
