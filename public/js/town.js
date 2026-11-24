// Bethlehem's shops: the market, the blacksmith, the inn and the church.
'use strict';
// ---------- food (from the inn) ----------
const FOODS = { bread: { n: 'Bread', cost: 25, e: 30 }, stew: { n: 'Lentil Stew', cost: 55, e: 65 }, figcake: { n: 'Fig Cake', cost: 90, e: 110 } };
function foodIcons() {
  const mk = (k, f) => { const c = mkc(16, 16), g = c.getContext('2d'), R = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h) }; f(R); AT['ic_' + k] = [c] };
  mk('bread', R => { R('#5b2e12', 2, 6, 12, 7); R('#5b2e12', 3, 5, 10, 1); R('#d9963e', 3, 6, 10, 6); R('#f0bd6a', 4, 6, 8, 2); R('#a8642a', 3, 11, 10, 1); R('#fff1c8', 5, 7, 2, 1); R('#a8642a', 6, 9, 1, 1); R('#a8642a', 9, 9, 1, 1) });
  mk('stew', R => { R('#5b2e12', 2, 7, 12, 6); R('#5b2e12', 3, 13, 10, 1); R('#b8673a', 3, 8, 10, 5); R('#8a4524', 3, 11, 10, 2); R('#7a3c18', 3, 7, 10, 1); R('#c7853e', 4, 7, 8, 1); R('#e8b04a', 5, 7, 2, 1); R('#6ea83a', 9, 7, 1, 1); R('rgba(255,255,255,.6)', 7, 3, 1, 3); R('rgba(255,255,255,.6)', 9, 2, 1, 3) });
  mk('figcake', R => { R('#5b2e12', 2, 6, 12, 8); R('#7a3e5a', 3, 7, 10, 6); R('#a65c7e', 3, 7, 10, 2); R('#e8c25a', 3, 9, 10, 1); R('#5a2a40', 3, 12, 10, 1); R('#6ea83a', 7, 4, 2, 2); R('#4a7a2a', 7, 5, 1, 1) });
}
function townItems() {
  const o = {}; for (const k in FOODS) o[k] = { n: FOODS[k].n, icon: 'ic_' + k, food: FOODS[k].e, price: Math.floor(FOODS[k].cost / 2), d: `Restores ${FOODS[k].e} energy. Select it and press the action button to eat.` }; return o;
}
function eat(slot) {
  const s = state.inv[slot], it = ITEMS[s.id]; if (state.energy >= state.maxE) { toast('You’re not hungry right now.'); return }
  state.energy = Math.min(state.maxE, state.energy + it.food); s.n--; if (s.n <= 0) state.inv[slot] = null;
  tone(400, .08, 'square', .03); tone(520, .08, 'square', .03, .1); toast(`Ate ${it.n}. +${it.food} energy`);
}

// ---------- tool upgrades ----------
const TOOL_LV = ['', 'Basic', 'Bronze', 'Iron', 'Gold'];
// each upgrade needs shekels and bars that Jesse smelts from your ore
const UPGRADES = { 2: { money: 600, bar: 'bar_copper', n: 5 }, 3: { money: 2000, bar: 'bar_iron', n: 5 }, 4: { money: 5000, bar: 'bar_gold', n: 5 } };
// smelting: five ore and a lump of coal make one bar
const SMELT = { bar_copper: 'ore_copper', bar_iron: 'ore_iron', bar_silver: 'ore_silver', bar_gold: 'ore_gold' };
const BARS = { bar_copper: ['Copper Bar', 130], bar_iron: ['Iron Bar', 220], bar_silver: ['Silver Bar', 380], bar_gold: ['Gold Bar', 700] };
function barItems() { const o = {}; for (const k in BARS) o[k] = { n: BARS[k][0], icon: k, price: BARS[k][1], d: `Smelted by Jesse from five ${ITEMS[SMELT[k]] ? ITEMS[SMELT[k]].n.toLowerCase() : 'ore'} and a lump of coal. Used for tool upgrades and Bezalel’s crafts.` }; return o }
const UPG_TOOLS = { axe: 'Chops harder: fewer swings per tree.', pick: 'Breaks stone faster: fewer swings per rock.', hoe: 'Digs a longer row with each swing.', can: 'Holds more water and waters a longer row.' };
const toolLv = id => (state.toolLv || {})[id] || 1;
const canMax = () => [0, 40, 70, 100, 130][toolLv('can')];
const rowLen = id => [0, 1, 3, 5, 7][toolLv(id)];
function toolName(id) { const lv = toolLv(id); return (lv > 1 && UPG_TOOLS[id] ? TOOL_LV[lv] + ' ' : '') + ITEMS[id].n }

// ---------- opening hours ----------
const HOURS = { market: [8, 18, 'Market'], smithy: [9, 17, 'Blacksmith'], inn: [8, 24, 'Inn'], carpenter: [9, 17, 'Carpenter'], tackle: [7, 19, 'Tackle shop'], workshop: [7, 19, 'Bezalel’s workshop'] };
function shopOpen(k) { const [a, b] = HOURS[k]; if (k !== 'inn' && isSabbath()) return false; return state.time >= a * 60 && state.time < b * 60 }
function closedMsg(k) { const [a, b, n] = HOURS[k]; return isSabbath() && k !== 'inn' ? `The ${n.toLowerCase()} is closed for the Sabbath. Come back tomorrow.` : `The ${n.toLowerCase()} is closed. Open ${a % 12 || 12}${a < 12 ? ' am' : ' pm'} to ${b % 12 || 12}${b < 12 || b === 24 ? (b === 24 ? ' midnight' : ' am') : ' pm'}.` }
function openShopModal(title, render) { menuOpen = true; boxMode = 'town'; $('#binM .ttl').textContent = title; $('#binM').classList.add('on'); sfx.tap(); townRender = render; render() }
let townRender = null, marketTab = 'buy';
// backpacks: you start with 2 rows, and Tobiah sells bigger ones
const BAGS = [{ n: 'Small Satchel', slots: 12 }, { n: 'Large Satchel', slots: 18, price: 1000 }, { n: 'Traveler’s Pack', slots: 24, price: 4000 }, { n: 'Merchant’s Pack', slots: 30, price: 12000 }];
const bagLv = () => state.bag || 0;
function buyBag(k) {
  const B = BAGS[k]; if (k !== bagLv() + 1 || state.money < B.price) return;
  state.money -= B.price; state.bag = k; while (state.inv.length < B.slots) state.inv.push(null);
  sfx.pick(); tone(660, .1, 'triangle', .04); tone(990, .14, 'triangle', .04, .1); toast(`Your new ${B.n} holds ${B.slots / 6} rows!`); updateHUD(); save(); renderMarket();
}
// older saves had a 4-row bag: shrink it to the bag you own, moving anything extra into the storage chest
function fitBag() {
  if (state.bag === undefined) state.bag = 0;
  const size = BAGS[bagLv()].slots; if (state.inv.length <= size) { while (state.inv.length < size) state.inv.push(null); return 0 }
  let moved = 0; const extra = state.inv.splice(size).filter(Boolean);
  for (const s of extra) {
    const here = !ITEMS[s.id].tool && state.inv.find(q => q && q.id === s.id && q.n + s.n <= 99); if (here) { here.n += s.n; continue }
    const e = state.inv.indexOf(null); if (e >= 0) { state.inv[e] = s; continue }
    const c = !ITEMS[s.id].tool && state.chest.find(q => q && q.id === s.id && q.n + s.n <= 99); if (c) { c.n += s.n; moved++; continue }
    const ce = state.chest.indexOf(null); if (ce >= 0) state.chest[ce] = s; else state.chest.push(s); moved++;
  }
  return moved;
}
const money = () => `<b>₪ ${state.money.toLocaleString()}</b>`;
const tabsHTML = (cur, list) => `<div class="stabs">${list.map(([k, l]) => `<button class="stab ${k === cur ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;

function openMarket() {
  if (!shopOpen('market')) { say(closedMsg('market')); return }
  marketTab = 'buy'; openShopModal('Bethlehem Market', renderMarket);
}
function renderMarket() {
  const b = $('#binM .mbody');
  let h = `<div class="binhead"><span>Tobiah’s stalls</span>${money()}</div>` + tabsHTML(marketTab, [['buy', 'Buy seeds'], ['bags', 'Bags'], ['sell', 'Sell']]);
  if (marketTab === 'buy') {
    const order = Object.keys(CROPS).sort((p, q) => (CROPS[q].seasons.includes(state.season) - CROPS[p].seasons.includes(state.season)) || CROPS[p].seed - CROPS[q].seed);
    for (const k of order) {
      const c = CROPS[k], inS = c.seasons.includes(state.season), id = 'seed_' + k;
      h += `<div class="shoprow ${inS ? '' : 'off'}"><img src="${iconURL(id)}"><div class="si"><b>${ITEMS[id].n}</b><div class="muted">${c.days} days · ${c.seasons.map(s => SEASONS[s]).join(', ')} · sells ₪ ${c.sell}</div></div><div class="sb"><span class="pr">₪ ${c.seed}</span><button class="btn alt" data-buy="${k}" data-n="1" ${inS && state.money >= c.seed ? '' : 'disabled'}>+1</button><button class="btn" data-buy="${k}" data-n="5" ${inS && state.money >= c.seed * 5 ? '' : 'disabled'}>+5</button></div></div>`;
    }
  } else if (marketTab === 'bags') {
    const cur = BAGS[bagLv()];
    h += `<p class="muted" style="margin:2px 2px 8px">Your bag: <b>${cur.n}</b>, ${cur.slots} slots (${cur.slots / 6} rows). A bigger bag lets you carry more from the fields, the river and the mines.</p>`;
    BAGS.forEach((B, k) => {
      if (k === 0) return; const owned = k <= bagLv(), next = k === bagLv() + 1;
      h += `<div class="shoprow ${owned || next ? '' : 'off'}"><img class="bimg" src="${iconURL('ic_bag' + k)}"><div class="si"><b>${B.n}</b><div class="muted">${B.slots} slots · ${B.slots / 6} rows${owned || next ? '' : `<br>Buy the ${BAGS[k - 1].n} first`}</div></div>
        <div class="sb">${owned ? '<span class="pr">Owned</span>' : next ? `<span class="pr">₪ ${B.price.toLocaleString()}</span><button class="btn" data-bag="${k}" ${state.money < B.price ? 'disabled' : ''}>Buy</button>` : `<span class="pr">₪ ${B.price.toLocaleString()}</span>`}</div></div>`;
    });
  } else {
    const rows = state.inv.map((s, i) => [s, i]).filter(([s]) => s && ITEMS[s.id].price && !ITEMS[s.id].tool);
    if (!rows.length) h += '<p class="muted">Nothing to sell. Tobiah buys crops, wood, stone and fiber at the same price as your shipping bin, but pays right away.</p>';
    for (const [s, i] of rows) h += `<div class="shoprow"><img src="${iconURL(ITEMS[s.id].icon)}"><div class="si"><b>${ITEMS[s.id].n} ×${s.n}</b><div class="muted">₪ ${ITEMS[s.id].price} each</div></div><div class="sb"><button class="btn alt" data-sell="${i}" data-n="1">Sell 1</button><button class="btn" data-sell="${i}" data-n="999">All ₪${ITEMS[s.id].price * s.n}</button></div></div>`;
  }
  b.innerHTML = h;
  b.querySelectorAll('.stab').forEach(el => el.onclick = () => { marketTab = el.dataset.tab; sfx.tap(); renderMarket() });
  b.querySelectorAll('[data-bag]').forEach(el => el.onclick = () => buyBag(+el.dataset.bag));
  b.querySelectorAll('[data-buy]').forEach(el => el.onclick = () => { const k = el.dataset.buy, n = +el.dataset.n, cost = CROPS[k].seed * n; if (state.money < cost) return; if (addItem('seed_' + k, n)) { toast('Your bag is full.'); return } state.money -= cost; sfx.pick(); renderMarket() });
  b.querySelectorAll('[data-sell]').forEach(el => el.onclick = () => { const i = +el.dataset.sell, s = state.inv[i]; if (!s) return; const n = Math.min(+el.dataset.n, s.n); state.money += n * ITEMS[s.id].price; state.stats.earned = (state.stats.earned || 0) + n * ITEMS[s.id].price; s.n -= n; if (s.n <= 0) state.inv[i] = null; tone(988, .06, 'square', .025); tone(1318, .08, 'square', .02, .06); renderMarket() });
}
function openSmithy() { if (!shopOpen('smithy')) { say(closedMsg('smithy')); return } openShopModal("Jesse’s Forge", renderSmithy) }
let smithTab = 'upgrade';
function renderSmithy() {
  const b = $('#binM .mbody');
  let h = `<div class="binhead"><span>${smithTab === 'upgrade' ? 'Tool upgrades' : 'Smelting'}</span>${money()}</div>` + tabsHTML(smithTab, [['upgrade', 'Upgrade tools'], ['smelt', 'Smelt ore']]);
  if (smithTab === 'upgrade') {
    h += `<p class="muted" style="margin:2px 0 8px">“Bring me bars and I’ll make your tools stronger. Bronze needs copper bars, iron needs iron bars, and gold needs gold bars.”</p>`;
    for (const id in UPG_TOOLS) {
      const lv = toolLv(id), nx = UPGRADES[lv + 1];
      const ok = nx && state.money >= nx.money && count(nx.bar) >= nx.n;
      h += `<div class="shoprow"><img src="${iconURL(ITEMS[id].icon)}"><div class="si"><b>${toolName(id)}</b><div class="muted">${UPG_TOOLS[id]}</div>${nx ? `<div class="req">Next: ${TOOL_LV[lv + 1]} · <span class="${state.money >= nx.money ? 'ok' : 'no'}">₪ ${nx.money.toLocaleString()}</span> · <span class="${count(nx.bar) >= nx.n ? 'ok' : 'no'}">${nx.n} ${ITEMS[nx.bar].n.toLowerCase()}s (${count(nx.bar)})</span></div>` : '<div class="req ok">Fully upgraded ✓</div>'}</div>${nx ? `<div class="sb"><button class="btn" data-up="${id}" ${ok ? '' : 'disabled'}>Upgrade</button></div>` : ''}</div>`;
    }
  } else {
    h += `<p class="muted" style="margin:2px 0 8px">“Five ore and one lump of coal make a bar. Bring me what you dig up on Mount Sinai.” You have ${count('ore_coal')} coal.</p>`;
    for (const bar in SMELT) {
      const ore = SMELT[bar], have = count(ore), can = Math.min(Math.floor(have / 5), count('ore_coal'));
      h += `<div class="shoprow"><img src="${iconURL(bar)}"><div class="si"><b>${ITEMS[bar].n}</b><div class="req"><span class="${have >= 5 ? 'ok' : 'no'}">5 ${ITEMS[ore].n.toLowerCase()} (${have})</span> · <span class="${count('ore_coal') >= 1 ? 'ok' : 'no'}">1 coal</span></div><div class="muted">Sells for ₪${ITEMS[bar].price}</div></div><div class="sb"><button class="btn" data-smelt="${bar}" data-n="1" ${can >= 1 ? '' : 'disabled'}>Smelt</button>${can > 1 ? `<button class="btn alt" data-smelt="${bar}" data-n="${can}">All (${can})</button>` : ''}</div></div>`;
    }
  }
  b.innerHTML = h;
  b.querySelectorAll('.stab').forEach(el => el.onclick = () => { smithTab = el.dataset.tab; sfx.tap(); renderSmithy() });
  b.querySelectorAll('[data-up]').forEach(el => el.onclick = () => {
    const id = el.dataset.up, nx = UPGRADES[toolLv(id) + 1]; if (!nx || state.money < nx.money || count(nx.bar) < nx.n) return;
    state.money -= nx.money; takeItem(nx.bar, nx.n);
    (state.toolLv = state.toolLv || {})[id] = toolLv(id) + 1; if (id === 'can') state.can = canMax();
    sfx.rock(); setTimeout(() => sfx.rock(), 180); setTimeout(() => { sfx.pick(); toast(`Your ${toolName(id)} is ready!`) }, 380); renderSmithy(); updateHUD(); save();
  });
  b.querySelectorAll('[data-smelt]').forEach(el => el.onclick = () => {
    const bar = el.dataset.smelt, ore = SMELT[bar], n = Math.min(+el.dataset.n, Math.floor(count(ore) / 5), count('ore_coal')); if (n < 1) return;
    takeItem(ore, n * 5); takeItem('ore_coal', n); const left = addItem(bar, n); if (left) drop(bar, left, player.x, player.y + .5);
    sfx.rock(); setTimeout(() => sfx.splash(), 200); setTimeout(() => { sfx.pick(); toast(`Jesse smelted ${n} ${ITEMS[bar].n.toLowerCase()}${n > 1 ? 's' : ''}!`) }, 420); renderSmithy(); updateHUD(); save();
  });
}
function takeItem(id, n) { for (let i = 0; i < state.inv.length && n > 0; i++) { const s = state.inv[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) state.inv[i] = null } } }
function openInn() { if (!shopOpen('inn')) { say(closedMsg('inn')); return } openShopModal("Miriam’s Inn", renderInn) }
function renderInn() {
  const b = $('#binM .mbody'); let h = `<div class="binhead"><span>Hot food</span>${money()}</div><p class="muted" style="margin:2px 0 8px">Buy food here and eat it whenever you need energy: select it on your toolbar and press the action button.</p>`;
  for (const k in FOODS) { const f = FOODS[k]; h += `<div class="shoprow"><img src="${iconURL('ic_' + k)}"><div class="si"><b>${f.n}</b><div class="muted">+${f.e} energy</div></div><div class="sb"><span class="pr">₪ ${f.cost}</span><button class="btn" data-food="${k}" ${state.money >= f.cost ? '' : 'disabled'}>Buy</button></div></div>` }
  b.innerHTML = h;
  b.querySelectorAll('[data-food]').forEach(el => el.onclick = () => { const k = el.dataset.food; if (state.money < FOODS[k].cost) return; if (addItem(k, 1)) { toast('Your bag is full.'); return } state.money -= FOODS[k].cost; sfx.pick(); renderInn() });
}
// ---------- the carpenter ----------
const CARP = [
  { id: 'farmhouse', n: 'Farmhouse', d: 'Replace your tent with a cozy wooden house. Sleeping there gives +30 max energy.', money: 3000, wood: 150, stone: 50 },
  { id: 'coop', n: 'Chicken Coop', d: 'A home for chickens, west of your tent. Chickens are coming soon.', money: 1500, wood: 100, stone: 30 },
  { id: 'barn', n: 'Barn', d: 'A home for goats, sheep and cattle, east of your tent. Animals are coming soon.', money: 3500, wood: 200, stone: 100 },
];
function openCarpenter() { if (!shopOpen('carpenter')) { say(closedMsg('carpenter')); return } openShopModal("Joseph’s Workshop", renderCarpenter) }
function renderCarpenter() {
  const b = $('#binM .mbody'); let h = `<div class="binhead"><span>Build on your farm</span>${money()}</div><p class="muted" style="margin:2px 0 8px">“Bring me timber and stone and I’ll have it standing on your farm by the time you get home.”</p>`;
  for (const c of CARP) {
    const done = (state.built || {})[c.id], ok = state.money >= c.money && count('wood') >= c.wood && count('stone') >= c.stone;
    h += `<div class="shoprow"><img class="bimg" src="${bldIcon(c.id)}"><div class="si"><b>${c.n}</b><div class="muted">${c.d}</div>${done ? '<div class="req ok">Built ✓</div>' : `<div class="req"><span class="${state.money >= c.money ? 'ok' : 'no'}">₪ ${c.money.toLocaleString()}</span> · <span class="${count('wood') >= c.wood ? 'ok' : 'no'}">${c.wood} wood</span> · <span class="${count('stone') >= c.stone ? 'ok' : 'no'}">${c.stone} stone</span></div>`}</div>${done ? '' : `<div class="sb"><button class="btn" data-build="${c.id}" ${ok ? '' : 'disabled'}>Build</button></div>`}</div>`;
  }
  b.innerHTML = h;
  b.querySelectorAll('[data-build]').forEach(el => el.onclick = () => {
    const c = CARP.find(q => q.id === el.dataset.build); if ((state.built || {})[c.id] || state.money < c.money || count('wood') < c.wood || count('stone') < c.stone) return;
    state.money -= c.money; takeItem('wood', c.wood); takeItem('stone', c.stone); (state.built = state.built || {})[c.id] = 1; farmBuild(c.id);
    if (c.id === 'farmhouse') { state.maxE += 30; state.energy += 30 }
    sfx.chop(); setTimeout(() => sfx.chop(), 160); setTimeout(() => { sfx.pick(); toast(`Your ${c.n.toLowerCase()} is built on your farm!`) }, 340); renderCarpenter(); save();
  });
}
const bldIconCache = {};
function bldIcon(id) { if (bldIconCache[id]) return bldIconCache[id]; const s = AT['bld_' + id][0], c = mkc(40, 40), g = c.getContext('2d'), k = Math.min(40 / s.width, 40 / s.height); g.imageSmoothingEnabled = false; g.drawImage(s, (40 - s.width * k) / 2, 40 - s.height * k, s.width * k, s.height * k); return bldIconCache[id] = c.toDataURL() }
// put a building on the farm map (works from town too), clearing whatever was in the way
function farmBuild(id) {
  const prev = World.cur; useMap('farm'); const T = World.TENT;
  const clear = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) { const o = World.objs[idx(x, y)]; if (o && !['bin', 'crate', 'campfire'].includes(o.t)) World.objs[idx(x, y)] = null; delete World.soil[idx(x, y)]; if (World.ground[idx(x, y)] === WATER) World.ground[idx(x, y)] = DIRT } };
  if (id === 'farmhouse') { clear(T.x - 1, T.y - 1, T.x + 1, T.y); placeBld(T.x - 1, T.y, 'farmhouse') }
  if (id === 'coop') { clear(T.x - 10, T.y - 1, T.x - 7, T.y + 3); placeBld(T.x - 9, T.y + 1, 'coop') }
  if (id === 'barn') { clear(T.x + 5, T.y - 2, T.x + 11, T.y + 3); placeBld(T.x + 6, T.y + 1, 'barn') }
  useMap(prev);
}
const VERSES = [['The LORD is my shepherd; I shall not want.', 'Psalm 23:1'], ['Whatsoever a man soweth, that shall he also reap.', 'Galatians 6:7'], ['He that tilleth his land shall have plenty of bread.', 'Proverbs 12:11'], ['While the earth remaineth, seedtime and harvest… shall not cease.', 'Genesis 8:22'], ['Consider the lilies of the field, how they grow; they toil not, neither do they spin.', 'Matthew 6:28'], ['I have planted, Apollos watered; but God gave the increase.', '1 Corinthians 3:6'], ['Come unto me, all ye that labour and are heavy laden, and I will give you rest.', 'Matthew 11:28']];
async function visitChurch() {
  const v = VERSES[(state.totalDay - 1) % VERSES.length];
  if (isSabbath() && state.time >= 9 * 60 && state.time < 13 * 60 && state.sabbathDay !== state.totalDay) {
    const go = await say(`The villagers are gathering for the Sabbath service. Join them?`, [['Join', 1], ['Not now', 0]]);
    if (!go) return; state.sabbathDay = state.totalDay; await fadeOut();
    state.time = Math.max(state.time, 12 * 60); state.energy = state.maxE;
    for (const x of VILLAGERS) { const f = (state.friends = state.friends || {})[x.id] || (state.friends[x.id] = { pts: 0, last: 0, met: 0 }); f.met = 1; f.pts = Math.min(200, f.pts + 10) }
    $('#fade').classList.remove('on'); sfx.sleep();
    await say(`You worshipped with the whole town. Elder Simeon read: “${v[0]}” (${v[1]}). You feel completely rested, and everyone is glad you came.`);
    return;
  }
  await say(`You stand at the pulpit and read the verse for today: “${v[0]}” (${v[1]})`);
}
