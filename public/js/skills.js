// Skills: Farming, Fishing, Mining, Foraging and Crafting level up from 0 to 10 as you do them.
// Every level makes that work a little cheaper and more rewarding; levels 5 and 10 add a special perk.
// Reaching level 10 in one skill takes about a year of focusing on it (Stardew's XP curve).
'use strict';

const SKILL_XP = [0, 100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];
const SKILLS = {
  farm: { n: 'Farming', icon: 'wheat', col: '#6aa84a', does: 'Harvesting crops',
    perks: l => [`Hoe and watering can use ${l * 3}% less energy`, `Crops sell for ${l * 2}% more`, `${12 + l * 3}% chance to harvest two`],
    m5: 'Tobiah’s seeds cost 10% less', m10: 'Tobiah’s seeds cost 20% less' },
  fish: { n: 'Fishing', icon: 'rod', col: '#3a90d0', does: 'Catching fish',
    perks: l => [`Casting uses ${l * 3}% less energy`, `Fish sell for ${l * 2}% more`, `The green catch zone is ${l * 4}% wider`],
    m5: 'Half the time, bait isn’t used up', m10: '15% chance to catch two fish at once' },
  mine: { n: 'Mining', icon: 'pick', col: '#a08a70', does: 'Breaking rocks and ore',
    perks: l => [`Pickaxe uses ${l * 3}% less energy`, `${l * 3}% chance of an extra ore or gem`, `Ore and gems sell for ${l * 2}% more`],
    m5: 'Ore and gem rocks take one fewer swing', m10: 'Jesse’s smelting fee is half price' },
  forage: { n: 'Foraging', icon: 'axe', col: '#b07a40', does: 'Chopping trees, clearing weeds',
    perks: l => [`Axe uses ${l * 3}% less energy`, `${l * 4}% chance of extra wood from stumps and branches`, `Weeds give fiber ${l * 3}% more often`],
    m5: 'Trees and stumps take one fewer swing', m10: 'Every tree you fell drops 3 extra wood' },
  craft: { n: 'Crafting', icon: 'workbench', col: '#c86a8a', does: 'Crafting and running machines',
    perks: l => [`Machines work ${l * 2}% faster`, `Preserves, juice, smoked fish and cooking sell for ${l * 2}% more`, `${l * 3}% chance the workbench makes one extra`],
    m5: '10% chance a machine gives one extra', m10: '20% chance a machine gives one extra' },
};

const sk = () => state.skills = state.skills || { farm: 0, fish: 0, mine: 0, forage: 0, craft: 0 };
const xpOf = k => (state && sk()[k]) || 0;
const lvl = k => { if (!state) return 0; const x = xpOf(k); let l = 0; while (l < 10 && x >= SKILL_XP[l + 1]) l++; return l };

function gainXP(k, amt) {
  if (!state || !(amt > 0)) return; const before = lvl(k); sk()[k] = xpOf(k) + amt; const after = lvl(k);
  if (after > before) setTimeout(() => skillUp(k, after), 350);
}
function skillUp(k, l) {
  const S = SKILLS[k]; let el = document.getElementById('lvlup');
  if (!el) { el = document.createElement('div'); el.id = 'lvlup'; document.body.appendChild(el); el.onclick = () => el.classList.remove('on') }
  const extra = l === 5 ? S.m5 : l === 10 ? S.m10 : '';
  el.innerHTML = `<div class="lu-card" style="--c:${S.col}"><img src="${iconURL(ITEMS[S.icon] ? ITEMS[S.icon].icon : S.icon)}"><div class="lu-t">${S.n} level ${l}!</div>
    <ul>${S.perks(l).map(p => `<li>${p}</li>`).join('')}${extra ? `<li class="lu-new">New: ${extra}</li>` : ''}</ul><div class="muted">Tap to keep going</div></div>`;
  el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 6500);
  [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'triangle', .05, i * .1)); save();
}

// ---------- XP for each thing you do ----------
const cropXP = id => Math.round(4 + (CROPS[id] ? CROPS[id].sell : 20) * .15);
const fishXP = k => FISH[k].junk ? 2 : Math.min(50, Math.round(5 + FISH[k].price * .15));
const ORE_XP = { stone: 1, coal: 3, copper: 4, iron: 6, silver: 9, gold: 12, amethyst: 15, emerald: 15, ruby: 16, sapphire: 18 };
const BREAK_XP = { oak: 12, olive: 12, stump: 4, twig: 1, weed: 1, rock: 1, boulder: 4 };
function skillBreak(o, cx, cy) {   // called when anything is broken by a tool
  if (o.t === 'node') { gainXP('mine', ORE_XP[o.k] || 1); if (o.k !== 'stone' && Math.random() < lvl('mine') * .03) drop(ORES[o.k].item, 1, cx, cy); return }
  if (o.t === 'rock' || o.t === 'boulder') { gainXP('mine', BREAK_XP[o.t]); return }
  if (BREAK_XP[o.t]) gainXP('forage', BREAK_XP[o.t]);
  if ((o.t === 'stump' || o.t === 'twig') && Math.random() < lvl('forage') * .04) drop('wood', 1, cx, cy);
  if (o.t === 'weed' && Math.random() < lvl('forage') * .03) drop('fiber', 1, cx, cy);
}
const treeWood = () => lvl('forage') >= 10 ? 3 : 0;

// ---------- perks ----------
const TOOL_SKILL = { hoe: 'farm', can: 'farm', pick: 'mine', axe: 'forage', scythe: 'forage' };
const skillToolCost = (tool, c) => { const s = TOOL_SKILL[tool]; return s ? +(c * (1 - lvl(s) * .03)).toFixed(2) : c };
const fishCost = () => +(FISH_COST * (1 - lvl('fish') * .03)).toFixed(2);
const fishZone = () => lvl('fish') * .04 * .3;   // 4% wider per level (zone is about 0.3 of the bar)
const keepBait = () => lvl('fish') >= 5 && Math.random() < .5;
const doubleCatch = () => lvl('fish') >= 10 && Math.random() < .15;
const farmDouble = () => .12 + lvl('farm') * .03;
const seedPrice = k => Math.round(CROPS[k].seed * (lvl('farm') >= 10 ? .8 : lvl('farm') >= 5 ? .9 : 1));
const smeltFee = bar => lvl('mine') >= 10 ? Math.ceil(SMELT_FEE[bar] / 2) : SMELT_FEE[bar];
const machSpeed = () => 1 - lvl('craft') * .02;
const machExtra = () => Math.random() < (lvl('craft') >= 10 ? .2 : lvl('craft') >= 5 ? .1 : 0);
const craftExtra = () => Math.random() < lvl('craft') * .03;
const _objHp = objHp;
objHp = function (o) {
  const h = _objHp(o);
  if (o.t === 'node' && o.k !== 'stone' && lvl('mine') >= 5) return Math.max(1, h - 1);
  if ((OBJ[o.t] && OBJ[o.t].tree || o.t === 'stump') && lvl('forage') >= 5) return Math.max(1, h - 1);
  return h;
};

// sell prices: every item keeps its base price, and the skill bonus is added whenever a price is read
function skillOfItem(id) {
  if (CROPS[id]) return 'farm';
  if (id.startsWith('fish_')) return FISH[id.slice(5)] && !FISH[id.slice(5)].junk ? 'fish' : null;
  if (id.startsWith('ore_')) return 'mine';
  if (/^(jar_|juice_|smoked_)/.test(id) || ['flour', 'honey', 'linen'].includes(id)) return 'craft';
  const r = RECIPES.find(q => q.id === id); if (r && r.cat === 'food' && r.sub !== 'Supplies') return 'craft';
  return null;
}
function skillPrices() {
  for (const id in ITEMS) {
    const it = ITEMS[id], s = skillOfItem(id); if (!s || !it.price) continue;
    let base = it.price;
    Object.defineProperty(it, 'price', { get: () => Math.round(base * (1 + lvl(s) * .02)), set: v => { base = v }, enumerable: true, configurable: true });
  }
}

// ---------- the Skills tab ----------
function skillsTab(b) {
  let h = `<p class="muted" style="margin:2px 0 8px">Every skill grows as you do it. Each level makes that work cheaper and more rewarding.</p>`;
  for (const k in SKILLS) {
    const S = SKILLS[k], l = lvl(k), x = xpOf(k), lo = SKILL_XP[l], hi = SKILL_XP[Math.min(10, l + 1)], pct = l >= 10 ? 100 : Math.floor((x - lo) / (hi - lo) * 100);
    const perks = l ? S.perks(l) : [], ms = [[5, S.m5], [10, S.m10]];
    h += `<div class="skrow" style="--c:${S.col}"><div class="sk-top"><img src="${iconURL(ITEMS[S.icon] ? ITEMS[S.icon].icon : S.icon)}"><div class="sk-name"><b>${S.n}</b><span class="muted">${S.does}</span></div><div class="sk-lv">Lv <b>${l}</b></div></div>
      <div class="sk-pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < l ? 'on' : ''} ${i === 4 || i === 9 ? 'big' : ''}"></i>`).join('')}</div>
      <div class="sk-bar"><div style="width:${pct}%"></div><span>${l >= 10 ? 'Mastered!' : `${(x - lo).toLocaleString()} / ${(hi - lo).toLocaleString()} XP to level ${l + 1}`}</span></div>
      <ul class="sk-perks">${perks.map(p => `<li>${p}</li>`).join('')}${ms.map(([m, t]) => `<li class="${l >= m ? 'got' : 'nyet'}">${l >= m ? '★' : `Lv ${m}:`} ${t}</li>`).join('')}</ul></div>`;
  }
  b.innerHTML = h;
}
