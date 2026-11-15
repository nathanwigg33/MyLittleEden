(()=>{
'use strict';
// ================= CONSTANTS & UTILS =================
const TS=16,W=50,H=72;
const G=0,TALL=1,WATER=2,SAND=3,STONE=4,DRY=5,DARK=6,GROVE=7,TILLED=8,PATH=9,HEDGE=10,BRIDGE=11,FLOW=12;
const KEY='eden_island_v1';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(x,y){let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
const rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const idx=(x,y)=>y*W+x,inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Math.floor(n).toLocaleString();
const now=()=>Date.now()/1000;
const isNight=()=>false;

// ================= ITEMS =================
const ITEMS={
 wood:{n:'Wood',p:3},fiber:{n:'Fiber',p:2},stone:{n:'Stone',p:3},clay:{n:'Clay',p:8},
 gold:{n:'Gold',p:60},onyx:{n:'Onyx',p:110},bdellium:{n:'Bdellium',p:45},
 berries:{n:'Wild Berries',p:6,food:6},mushroom:{n:'Mushroom',p:12,food:8},apple:{n:'Apple',p:14,food:10},fig:{n:'Fig',p:16,food:12},olive:{n:'Olives',p:16,food:6},pomegranate:{n:'Pomegranate',p:30,food:14},date:{n:'Dates',p:22,food:14},grapes:{n:'Grapes',p:20,food:10},honey:{n:'Honey',p:40,food:20},
 wheat:{n:'Wheat',p:8},barley:{n:'Barley',p:12},cucumber:{n:'Cucumber',p:18,food:8},lentils:{n:'Lentils',p:22},onion:{n:'Onion',p:26,food:8},leeks:{n:'Leeks',p:30,food:10},flax:{n:'Flax',p:40},garlic:{n:'Garlic',p:40},melon:{n:'Melon',p:70,food:30},
 egg:{n:'Egg',p:18},milk:{n:'Milk',p:28,food:14},wool:{n:'Wool',p:40},
 minnow:{n:'Minnow',p:15,col:'#b9c9d6',diff:.45},tilapia:{n:'Tilapia',p:35,col:'#7fa08c',diff:.7},catfish:{n:'Catfish',p:55,col:'#6b5a48',diff:.95},barbel:{n:'Barbel',p:45,col:'#98a6b3',diff:.85},carp:{n:'Golden Carp',p:80,col:'#f2b632',diff:1.05},glimmer:{n:'Glimmerfin',p:260,col:'#a78bff',diff:1.45},
 bread:{n:'Bread',p:40,food:30},barleyloaf:{n:'Barley Loaf',p:55,food:40},figcake:{n:'Fig Cake',p:90,food:45},raisins:{n:'Raisin Cakes',p:80,food:40},stew:{n:'Lentil Stew',p:110,food:60},oil:{n:'Olive Oil',p:90},linen:{n:'Linen',p:160},honeycake:{n:'Honey Cake',p:130,food:55},
 axe:{n:'Axe',tool:1},pick:{n:'Pickaxe',tool:1},rod:{n:'Fishing Rod',tool:1},basket:{n:'Basket',tool:1},sandals:{n:'Sandals',tool:1},up_e:{n:'Blessing of Strength',tool:1},
};
const DISCOVER=Object.keys(ITEMS).filter(k=>!ITEMS[k].tool);
const CROPV={wheat:['grain','#e0bd5c'],barley:['grain','#d6c98a'],lentils:['bush','#c47a3a'],onion:['bulb','#d9a55b'],cucumber:['vine','#5a9a3a'],melon:['big','#8fbf5a'],flax:['flower','#6f9fe8'],leeks:['tall','#eef4d8'],garlic:['bulb','#f2ede0']};
const GROW={wheat:30,barley:45,cucumber:60,onion:80,lentils:90,leeks:100,garlic:120,flax:140,melon:180};
const CROPS=GROW; // compat for sprite code
const SEEDS=[];
const PROD={chicken:['egg',40],duck:['egg',55],sheep:['wool',120],cow:['milk',90],goat:['milk',80]};
const SPC={dog:['Dog'],rabbit:['Hare'],butterfly:['Butterfly'],chicken:['Fowl'],duck:['Duck'],deer:['Deer'],fox:['Fox'],squirrel:['Squirrel'],owl:['Owl'],dove:['Dove'],peacock:['Peacock'],sheep:['Sheep'],cow:['Cattle'],goat:['Goat'],horse:['Horse'],ram:['Ram'],hedgehog:['Hedgehog'],lion:['Lion'],eagle:['Eagle'],camel:['Camel'],frog:['Frog'],tortoise:['Tortoise'],hippo:['Behemoth'],elephant:['Elephant'],giraffe:['Giraffe'],monkey:['Ape'],leopard:['Leopard'],bear:['Bear']};
const NANIM=Object.keys(SPC).length;
const TOOLS=[
 {id:'axe',n:'Axe',d:'Chop trees faster.',lv:[null,null,[300,{}],[1200,{gold:2}]]},
 {id:'pick',n:'Pickaxe',d:'Lv 2 breaks gold veins, Lv 3 breaks onyx.',lv:[null,null,[400,{}],[1500,{gold:3}]]},
 {id:'rod',n:'Fishing Rod',d:'Walk into water to cast.',lv:[null,[150,{}]]},
 {id:'basket',n:'Basket',d:'Gather twice the fruit.',lv:[null,[400,{}]]},
 {id:'sandals',n:'Sandals',d:'Walk faster.',lv:[null,[500,{}]]},
 {id:'up_e',n:'Blessing of Strength',d:'+15 max energy.',lv:[null,[300,{}],[800,{}],[1600,{}],[3000,{}]]}];
const COOK=[{id:'bread',need:{wheat:3}},{id:'barleyloaf',need:{barley:3}},{id:'raisins',need:{grapes:4}},{id:'oil',need:{olive:5}},{id:'figcake',need:{fig:3,honey:1}},{id:'stew',need:{lentils:3,onion:1}},{id:'honeycake',need:{wheat:2,honey:1,egg:1}},{id:'linen',need:{flax:3}}];
const BUILD=[
 {id:'path',n:'Stone Path',need:{stone:1}},{id:'fence',n:'Fence',need:{wood:1}},{id:'wall',n:'Stone Wall',need:{stone:2}},
 {id:'flowerbed',n:'Flower Bed',need:{fiber:3},bless:10},{id:'flowerpot',n:'Flower Pot',need:{clay:2}},{id:'bench',n:'Bench',need:{wood:8}},{id:'barrel',n:'Barrel',need:{wood:6}},{id:'campfire',n:'Campfire',need:{wood:5,stone:5}},
 {id:'lamp',n:'Stone Lamp',need:{stone:6},bless:50},{id:'trough',n:'Trough',need:{wood:10}},{id:'crate',n:'Crate',need:{wood:4}}];
const SOLID={tree:1,stump:1,fruit:1,bush:1,vine:1,hive:1,resin:1,rock:1,gold:1,onyx:1,home:1,house:1,life:1,block:1,fence:1,wall:1,bench:1,barrel:1,campfire:1,lamp:1,well:1,trough:1,beehive:1,flowerpot:1,board:1,anvil:1,crate:1};

// ================= THE ISLAND =================
// Each location: a rectangle of land. Locked ones are overgrown until you pay to clear them.
// Ghosts ("see-through" things) are bought to develop the area. At 80% you can build the area's house.
const AREAS=[null,{n:'Edge of Eden',house:'Cottage'},{n:'The River Lands',house:'Stone House'},{n:'Midst of the Garden',house:'Garden Temple'}];
const LOCS=[
 // ---- Area 1 ----
 {id:'home',a:1,n:'Home',r:[19,52,12,9],c:0,fauna:['dog'],
  g:[{t:'house',x:28,y:54,c:1200,need:{wood:40,stone:30},spr:'hut_red'},{t:'bed',k:'wheat',x:25,y:58,w:3,h:2,c:60},{t:'bench',x:26,y:53,c:40,need:{wood:4}},{t:'lamp',x:20,y:57,c:80,need:{stone:5}},{t:'flowerpot',x:29,y:59,c:30},{t:'well',x:20,y:59,c:150,need:{stone:10}}]},
 {id:'field',a:1,n:'Tending Field',r:[31,52,9,9],c:120,fauna:['butterfly'],
  g:[{t:'bed',k:'wheat',x:32,y:53,w:3,h:2,c:80},{t:'bed',k:'barley',x:36,y:53,w:3,h:2,c:150},{t:'bed',k:'cucumber',x:32,y:57,w:3,h:2,c:240},{t:'bed',k:'onion',x:36,y:57,w:3,h:2,c:380},{t:'barrel',x:35,y:60,c:40,need:{wood:4}}]},
 {id:'orchard',a:1,n:'Orchard',r:[9,52,10,9],c:200,fauna:['rabbit'],
  g:[{t:'tree',k:'fig',x:11,y:55,c:150},{t:'tree',k:'apple',x:15,y:55,c:150},{t:'tree',k:'olive',x:11,y:59,c:240},{t:'bush',x:15,y:59,c:60},{t:'bush',x:17,y:59,c:60},{t:'beehive',x:17,y:53,c:280,need:{wood:10}}]},
 {id:'wood',a:1,n:'Cedar Wood',r:[9,61,10,8],c:250,fauna:['deer','fox','squirrel'],
  g:[{t:'campfire',x:13,y:65,c:120,need:{wood:5}},{t:'bench',x:15,y:65,c:50,need:{wood:6}}]},
 {id:'ranch',a:1,n:'Green Pasture',r:[19,61,12,8],c:350,fauna:[],
  g:[{t:'pen',x:20,y:62,w:9,h:5,c:180,need:{wood:12}},{t:'animal',k:'chicken',x:22,y:64,c:150},{t:'animal',k:'chicken',x:24,y:63,c:150},{t:'animal',k:'sheep',x:26,y:64,c:380},{t:'trough',x:29,y:63,c:80,need:{wood:6}}]},
 {id:'pond',a:1,n:'Still Waters',r:[31,61,9,8],c:450,fauna:['frog'],pond:[35,64.2,2.3],
  g:[{t:'dock',x:35,y:66,c:100,tiles:[[35,66],[35,67]]},{t:'animal',k:'duck',x:32,y:62,c:200},{t:'sandbar',x:39,y:64,c:600,tiles:[[40,63],[41,63],[41,64],[40,64],[41,65]]}],flower:[38,62]},
 {id:'islet1',a:1,n:'Sandbar Isle',r:[43,62,4,4],c:300,fauna:['tortoise'],secret:1,g:[]},
 // ---- Area 2 ----
 {id:'bank',a:2,n:'Riverbank',r:[19,40,12,9],c:0,fauna:[],
  g:[{t:'house',x:24,y:42,c:4000,need:{wood:80,stone:60,gold:3},spr:'hut_purple'},{t:'bed',k:'lentils',x:20,y:46,w:3,h:2,c:400},{t:'lamp',x:28,y:46,c:100,need:{stone:6}},{t:'bench',x:28,y:42,c:60,need:{wood:6}}]},
 {id:'quarry',a:2,n:'Stone Hills',r:[9,40,10,9],c:900,fauna:['ram','hedgehog'],
  g:[{t:'anvil',x:13,y:44,c:250,need:{stone:20}},{t:'crate',x:16,y:46,c:60,need:{wood:4}}]},
 {id:'vineyard',a:2,n:'Vineyard',r:[31,40,9,9],c:1100,fauna:['peacock'],
  g:[{t:'vine',x:32,y:42,c:200},{t:'vine',x:34,y:42,c:200},{t:'vine',x:36,y:42,c:200},{t:'beehive',x:38,y:46,c:300,need:{wood:10}},{t:'bed',k:'leeks',x:32,y:46,w:3,h:2,c:500}]},
 {id:'meadow',a:2,n:'Wide Meadow',r:[19,31,12,9],c:1600,fauna:['horse'],
  g:[{t:'pen',x:20,y:32,w:9,h:5,c:300,need:{wood:20}},{t:'animal',k:'cow',x:22,y:34,c:600},{t:'animal',k:'goat',x:25,y:34,c:500},{t:'animal',k:'sheep',x:27,y:33,c:400},{t:'trough',x:29,y:36,c:100,need:{wood:8}}]},
 {id:'havilah',a:2,n:'Land of Havilah',r:[9,31,10,9],c:2200,fauna:['camel','eagle'],flower:[10,33],
  g:[{t:'sandbar',x:8,y:35,c:1500,tiles:[[7,35],[7,36],[6,35]]}]},
 {id:'river',a:2,n:'River Pishon',r:[31,31,9,9],c:1900,fauna:['hippo'],river:1,
  g:[{t:'bed',k:'garlic',x:32,y:32,w:3,h:2,c:600},{t:'dock',x:37,y:34,c:150,tiles:[[37,35]]}]},
 {id:'islet2',a:2,n:'Onyx Isle',r:[2,34,4,4],c:800,fauna:[],secret:1,g:[]},
 // ---- Area 3 ----
 {id:'midst',a:3,n:'Midst of the Garden',r:[19,19,12,9],c:0,fauna:[],
  g:[{t:'house',x:22,y:25,c:12000,need:{wood:150,stone:120,gold:10,onyx:5},spr:'tower'},{t:'lamp',x:20,y:20,c:200,need:{stone:8}},{t:'lamp',x:29,y:20,c:200,need:{stone:8}},{t:'flowerpot',x:28,y:26,c:80}]},
 {id:'wild',a:3,n:'Wild Wood',r:[9,19,10,9],c:4500,fauna:['elephant','giraffe','monkey','leopard'],
  g:[{t:'tree',k:'date',x:13,y:24,c:600}]},
 {id:'spring',a:3,n:'The Spring',r:[31,19,9,9],c:5000,fauna:['dove'],pond:[35,22.5,2.2],
  g:[{t:'dock',x:35,y:25,c:300,tiles:[[35,24],[35,25]]},{t:'animal',k:'duck',x:32,y:20,c:400}]},
 {id:'grove',a:3,n:'Pomegranate Grove',r:[19,10,12,9],c:6500,fauna:['owl'],
  g:[{t:'tree',k:'pomegranate',x:21,y:13,c:800},{t:'tree',k:'pomegranate',x:25,y:13,c:800},{t:'bed',k:'flax',x:21,y:16,w:3,h:2,c:1000},{t:'bed',k:'melon',x:26,y:16,w:3,h:2,c:1500}]},
 {id:'hills',a:3,n:'Golden Hills',r:[9,10,10,9],c:6000,fauna:['lion','bear'],g:[]},
 {id:'lea',a:3,n:'Quiet Lea',r:[31,10,9,9],c:5500,fauna:[],
  g:[{t:'pen',x:32,y:11,w:7,h:5,c:400,need:{wood:20}},{t:'animal',k:'cow',x:34,y:13,c:600},{t:'animal',k:'goat',x:36,y:13,c:500}]},
];
const NAT={home:[['twig',3],['pebble',2],['weed',3]],field:[['weed',4],['pebble',1]],orchard:[['weed',3],['twig',2]],wood:[['tree',9],['twig',3],['mushroom',2]],ranch:[['weed',3]],pond:[['weed',2],['pebble',2]],islet1:[['gold',1],['rock',1]],
 bank:[['twig',2],['weed',2],['tree',2]],quarry:[['rock',7],['gold',2],['pebble',2]],vineyard:[['weed',3]],meadow:[['weed',3],['bush',2]],havilah:[['gold',3],['onyx',1],['resin',2],['rock',2]],river:[['pebble',2],['clay',2]],islet2:[['onyx',2],['gold',1]],
 midst:[],wild:[['tree:jungle',8],['mushroom',3],['bush',2]],spring:[['weed',3]],grove:[['weed',2]],hills:[['rock',5],['onyx',3],['gold',2]],lea:[['weed',4]]};
const LITTER={twig:1,pebble:1,weed:1,mushroom:1,clay:1};
const LOC_TILE={wood:[[TALL,.2],[DARK,1]],wild:[[TALL,.3],[DARK,1]],orchard:[[FLOW,.25],[G,1]],field:[[G,1]],quarry:[[STONE,.55],[DRY,1]],hills:[[STONE,.6],[DRY,1]],havilah:[[STONE,.6],[DRY,1]],meadow:[[TALL,.25],[FLOW,.45],[G,1]],midst:[[FLOW,.25],[GROVE,1]],grove:[[FLOW,.2],[G,1]],islet1:[[SAND,.3],[G,1]],islet2:[[STONE,.5],[DRY,1]]};
const FISHP={pond:[['minnow',.45],['tilapia',.3],['catfish',.23],['glimmer',.02]],river:[['minnow',.3],['barbel',.35],['carp',.3],['glimmer',.05]],spring:[['carp',.5],['tilapia',.3],['glimmer',.2]],islet1:[['barbel',.45],['carp',.4],['glimmer',.15]],islet2:[['carp',.5],['glimmer',.5]],sea:[['minnow',.55],['barbel',.35],['tilapia',.1]]};
const VERSE={orchard:['Behold, I have given you every tree, in the which is the fruit of a tree yielding seed.','Genesis 1:29'],wood:['And out of the ground made the LORD God to grow every tree that is pleasant to the sight.','Genesis 2:9'],pond:['Let the waters bring forth abundantly the moving creature that hath life.','Genesis 1:20'],ranch:['And God made the beast of the earth after his kind, and cattle after their kind.','Genesis 1:25'],field:['And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it.','Genesis 2:15'],bank:['And a river went out of Eden to water the garden.','Genesis 2:10'],havilah:['…the land of Havilah, where there is gold; and the gold of that land is good.','Genesis 2:11–12'],midst:['The tree of life also in the midst of the garden.','Genesis 2:9'],wild:['And God saw every thing that he had made, and, behold, it was very good.','Genesis 1:31'],meadow:['Let the earth bring forth grass, the herb yielding seed.','Genesis 1:11']};
LOCS.forEach((l,i)=>{l.i=i;l.g.forEach((g,j)=>{g.key=l.id+':'+j;g.loc=l;if(!g.n)g.n=ghostName(g)})});
const LOCI={};LOCS.forEach(l=>LOCI[l.id]=l);
const GHOSTS=LOCS.flatMap(l=>l.g);
function ghostName(g){const N={bench:'Bench',lamp:'Stone Lamp',flowerpot:'Flower Pot',well:'Well',barrel:'Barrel',beehive:'Beehive',campfire:'Campfire',pen:'Animal Pen',trough:'Trough',dock:'Fishing Dock',sandbar:'Sandbar',anvil:'Anvil',crate:'Crate',vine:'Grapevine',bush:'Berry Bush'};
 if(g.t==='house')return'';if(g.t==='bed')return ITEMS[g.k].n+' Bed';if(g.t==='tree')return({fig:'Fig',apple:'Apple',olive:'Olive',date:'Date Palm',pomegranate:'Pomegranate'}[g.k])+(g.k==='date'?'':' Tree');if(g.t==='animal')return SPC[g.k][0];return N[g.t]||g.t}
LOCS.forEach(l=>l.g.forEach(g=>{if(g.t==='house')g.n=AREAS[l.a].house}));
const GUIDE=[['Push into a tree or rock to gather wood and stone',s=>(s.got.wood||0)>=3&&(s.got.stone||0)>=1],['Walk through the golden wheat to harvest it',s=>s.harvested>=1],['Fill a request at the board beside Shamar',s=>s.reqDone>=1],['Walk up to something see-through and buy it',s=>s.ghosts>=1],['Walk into an overgrown place and clear it',s=>s.lands>=2],['Walk up to a creature with a ? and name it',s=>s.named>=1],['Reach 80% in this area, then build the Cottage',s=>s.houses>=1],['Explore the River Lands across the bridge',s=>s.houses>=2],['Reach the Midst of the Garden and build the Temple',s=>s.houses>=3]];

// ================= STATE =================
let tiles,objs,locOf,state,player,animals=[],parts=[],floats=[],HOME,MIDST;
const NPCS=[{id:'shamar',name:'Shamar',x:27.6,y:57.2}];
let GT=0,fish=null,fishHold=false,modalOpen=false,titleOpen=true,sleeping=false,buildSel=null,workT=0,toolSeen={};
function freshState(){return{v:1,day:1,inv:{},tools:{axe:1,pick:1,rod:0,basket:0,sandals:0,up_e:0},tier:{},bless:50,energy:60,area:1,open:{home:1},bought:{},houses:{},names:{},pn:{},pets:[],seen:{},reqs:[],rushAt:0,lifeDay:0,verse:{},stock:{},tips:{},sound:true,music:true,px:0,py:0,fxp:0,
 stats:{got:{},reqDone:0,harvested:0,chopped:0,lands:1,named:0,built:0,fish:0,ghosts:0,houses:0}}}
const st=()=>state.stats;
const nHouses=()=>Object.keys(state.houses).length;
const maxE=()=>60+nHouses()*25+state.tools.up_e*15;
const cnt=id=>state.inv[id]||0;
const itemName=id=>ITEMS[id].n;
const LOC=(x,y)=>inb(x,y)?locOf[idx(x,y)]:-1;
const locAt=(x,y)=>{const i=LOC(x,y);return i>=0?LOCS[i]:null};
const isOpenLoc=l=>!!state.open[l.id];
function tileOpen(x,y){if(!inb(x,y))return false;const li=locOf[idx(x,y)];if(li>=0)return !!state.open[LOCS[li].id];const t=tiles[idx(x,y)];if(t!==SAND&&t!==BRIDGE&&t!==PATH)return false;let any=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const l=LOC(x+dx,y+dy);if(l>=0){any=true;if(state.open[LOCS[l].id])return true}}return !any}
const fishLv=()=>Math.floor(Math.sqrt(state.fxp/25))+1;
function areaUnits(a){let n=0,d=0;for(const l of LOCS){if(l.a!==a)continue;d++;if(isOpenLoc(l))n++;for(const g of l.g){if(g.t==='house')continue;d++;if(state.bought[g.key])n++}}return[n,d]}
const areaPct=a=>{const [n,d]=areaUnits(a);return Math.floor(n/d*100)};
function explore(){let n=0,d=0;for(const l of LOCS){d++;if(isOpenLoc(l))n++;for(const g of l.g){d++;if(state.bought[g.key])n++}}
 n+=DISCOVER.filter(k=>state.seen[k]).length+Object.keys(state.names).length;d+=DISCOVER.length+NANIM;return Math.floor(n/d*100)}
const curArea=()=>{const l=locAt(Math.floor(player.x),Math.floor(player.y));return l?l.a:(player.y>50?1:player.y>29?2:3)};

// ================= WORLD =================
function foot(x,y,w,h,main){const hw=Math.floor(w/2);for(let yy=y-h+1;yy<=y;yy++)for(let xx=x-hw;xx<=x+hw;xx++)objs[idx(xx,yy)]=(xx===x&&yy===y)?main:{t:'block',mx:x,my:y}}
let reserved;
function ghostCells(g){const out=[];if(g.t==='bed'||g.t==='pen'){for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++)out.push([x,y])}else if(g.t==='house'){for(let y=g.y-1;y<=g.y+1;y++)for(let x=g.x-1;x<=g.x+1;x++)out.push([x,y])}else if(g.tiles)g.tiles.forEach(t=>out.push(t));else out.push([g.x,g.y]);return out}
function genWorld(){tiles=new Uint8Array(W*H).fill(WATER);objs=new Array(W*H).fill(null);locOf=new Int8Array(W*H).fill(-1);reserved=new Uint8Array(W*H);
 for(const l of LOCS){const [x0,y0,w,h]=l.r;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){locOf[idx(x,y)]=l.i;const hh=hash(x*7+3,y*13+1);let tl=hh<.1?FLOW:G;const spec=LOC_TILE[l.id];if(spec)for(const [t,p] of spec){if(hh<p){tl=t;break}}tiles[idx(x,y)]=tl}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(locOf[idx(x,y)]>=0)continue;let near=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(LOC(x+dx,y+dy)>=0)near=true;if(near)tiles[idx(x,y)]=SAND}
 for(const l of LOCS){if(l.pond){const [cx,cy,r]=l.pond,[x0,y0,w,h]=l.r;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const d=Math.hypot(x+.5-cx,(y+.5-cy)*1.15);if(d<r)tiles[idx(x,y)]=WATER;else if(d<r+.9)tiles[idx(x,y)]=SAND}}
  if(l.river){const [x0,y0,w]=l.r;for(let x=x0;x<x0+w;x++){[y0+3,y0+6].forEach(y=>tiles[idx(x,y)]=SAND);tiles[idx(x,y0+4)]=tiles[idx(x,y0+5)]=x===x0+2?BRIDGE:WATER}}
  for(const g of l.g)ghostCells(g).forEach(([x,y])=>reserved[idx(x,y)]=1)}
 // home
 HOME={x:22,y:55};foot(HOME.x,HOME.y,3,2,{t:'home'});[[22,56],[22,57]].forEach(([x,y])=>tiles[idx(x,y)]=PATH);
 objs[idx(26,56)]={t:'board'};for(let x=21;x<=23;x++)for(let y=58;y<=59;y++){tiles[idx(x,y)]=TILLED;objs[idx(x,y)]={t:'crop',c:'wheat',pl:0}}
 for(let y=52;y<=60;y++)for(let x=20;x<=28;x++)reserved[idx(x,y)]=1;
 // tree of life
 MIDST={x:25,y:22};foot(MIDST.x,MIDST.y,3,2,{t:'life'});for(let y=20;y<=24;y++)for(let x=23;x<=27;x++)reserved[idx(x,y)]=1;
 for(const l of LOCS)if(l.flower){objs[idx(l.flower[0],l.flower[1])]={t:'bflower'};reserved[idx(l.flower[0],l.flower[1])]=1}
 // natural nodes
 for(const l of LOCS){const rr=mulberry(l.i*977+13);for(const [spec,n] of NAT[l.id]||[]){const [b,k]=spec.split(':');for(let j=0;j<n;j++){const i=freeSpot(l,rr);if(i<0)break;objs[i]=mkNode(b,k)}}}}
function mkNode(b,k){if(b==='tree')return{t:'tree',k:k||(Math.random()<.4?'cedar':'oak'),hp:3};if(b==='rock')return{t:'rock',hp:3};if(b==='gold')return{t:'gold',hp:4};if(b==='onyx')return{t:'onyx',hp:5};if(b==='bush')return{t:'bush',n:2};if(b==='resin')return{t:'resin',n:1};return{t:b}}
function freeSpot(l,rr){rr=rr||Math.random;const [x0,y0,w,h]=l.r;for(let k=0;k<80;k++){const x=x0+Math.floor(rr()*w),y=y0+Math.floor(rr()*h),i=idx(x,y),t=tiles[i];if(objs[i]||reserved[i]||t===WATER||t===SAND||t===TILLED||t===PATH||t===BRIDGE)continue;if(objs[idx(x,y+1)]&&objs[idx(x,y+1)].t==='tree')continue;if(player&&Math.hypot(x+.5-player.x,y+.5-player.y)<1.5)continue;if(NPCS.some(n=>Math.hypot(x+.5-n.x,y+.5-n.y)<1.3))continue;return i}return -1}
function litter(l){const have={};const [x0,y0,w,h]=l.r;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const o=objs[idx(x,y)];if(o&&LITTER[o.t])have[o.t]=(have[o.t]||0)+1}
 for(const [b,n] of NAT[l.id]||[])if(LITTER[b]&&(have[b]||0)<n){const i=freeSpot(l);if(i>=0)objs[i]={t:b};return}}
function applyGhost(g,fresh){const T=now();
 switch(g.t){
  case'bed':for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++){tiles[idx(x,y)]=TILLED;objs[idx(x,y)]={t:'crop',c:g.k,pl:fresh?T-GROW[g.k]*.6:0}}break;
  case'tree':objs[idx(g.x,g.y)]={t:'fruit',k:g.k,n:2};break;
  case'bush':objs[idx(g.x,g.y)]={t:'bush',n:2};break;
  case'vine':objs[idx(g.x,g.y)]={t:'vine',n:2};break;
  case'beehive':objs[idx(g.x,g.y)]={t:'beehive',n:1};break;
  case'pen':{const gx=g.x+Math.floor(g.w/2);for(let x=g.x;x<g.x+g.w;x++)for(let y=g.y;y<g.y+g.h;y++){const edge=x===g.x||x===g.x+g.w-1||y===g.y||y===g.y+g.h-1;if(edge&&!(y===g.y+g.h-1&&x===gx))objs[idx(x,y)]={t:'fence'}}break}
  case'dock':case'sandbar':g.tiles.forEach(([x,y])=>tiles[idx(x,y)]=g.t==='dock'?BRIDGE:SAND);break;
  case'animal':if(fresh){const pen=g.loc.g.find(q=>q.t==='pen');const rect=pen?[pen.x+1,pen.y+1,pen.w-2,pen.h-2]:g.loc.r;state.pets.push({k:g.key,id:g.k,x:g.x+.5,y:g.y+.6,rect,rd:T+10})}break;
  case'house':foot(g.x,g.y,3,2,{t:'house',a:g.loc.a,spr:g.spr});break;
  default:objs[idx(g.x,g.y)]={t:g.t}}}
function spawnAnimals(){animals=[];for(const l of LOCS){(l.fauna||[]).forEach((id,j)=>{const rr=mulberry(l.i*97+j*7);const [x0,y0,w,h]=l.r;let x,y,g=0;do{x=x0+1+rr()*(w-2);y=y0+1+rr()*(h-2)}while((solidRaw(Math.floor(x),Math.floor(y))||reserved[idx(Math.floor(x),Math.floor(y))])&&g++<40);animals.push({id,x,y,loc:l,rect:l.r,vx:0,vy:0,t:rr()*3,bob:rr()*6,face:false})})}
 for(const p of state.pets)animals.push(Object.assign(p,{pet:1,loc:locAt(Math.floor(p.x),Math.floor(p.y))||LOCI.ranch,vx:0,vy:0,t:1,bob:Math.random()*6,face:false}))}
function residents(){NPCS.length=1;LOCS.forEach(l=>l.g.forEach(g=>{if(g.t==='house'&&state.houses[l.a])NPCS.push({id:['','gabriel','michael','gabriel'][l.a],name:['','Gabriel','Michael','Gabriel'][l.a],x:g.x+2.2,y:g.y+.9,res:l.a,ht:0})}))}

// ================= COLLISION =================
function solidRaw(x,y){if(!inb(x,y))return true;const i=idx(x,y),t=tiles[i];if(t===WATER||t===HEDGE)return true;const o=objs[i];return !!(o&&SOLID[o.t])}
function solidAt(x,y){return solidRaw(x,y)||!tileOpen(x,y)}
function collides(x,y,r,fn){return fn(Math.floor(x-r),Math.floor(y-r*.6))||fn(Math.floor(x+r),Math.floor(y-r*.6))||fn(Math.floor(x-r),Math.floor(y+r*.4))||fn(Math.floor(x+r),Math.floor(y+r*.4))}
function moveEnt(e,dx,dy,r,fn){if(!collides(e.x+dx,e.y,r,fn))e.x+=dx;if(!collides(e.x,e.y+dy,r,fn))e.y+=dy}
function resolve(x,y){if(!inb(x,y))return null;const o=objs[idx(x,y)];if(o&&o.t==='block')return{x:o.mx,y:o.my,o:objs[idx(o.mx,o.my)]};return{x,y,o}}

/*@AUDIO@*/
/*@SPRITES@*/
Object.assign(PK,{barrel:'barrel',flowerpot:'flowerpot',trough:'trough',anvil:'anvil'});
OBJS.board=[22,24,g=>{R(g,'#6a4426',3,10,3,14);R(g,'#6a4426',16,10,3,14);R(g,'#9b6b3e',0,2,22,13);R(g,'#c08a55',1,3,20,1);R(g,'#7a4f2c',0,14,22,2);R(g,'#fff6dc',3,5,6,7);R(g,'#fff6dc',11,4,7,5);R(g,'#ffe08a',12,10,5,3);R(g,'#c0392b',5,5,2,1);R(g,'#3a6ad9',14,4,2,1)}];
OBJS.sign=[18,20,g=>{R(g,'#6a4426',8,9,3,11);R(g,'#9b6b3e',0,0,18,11);R(g,'#c08a55',1,1,16,1);R(g,'#7a4f2c',0,10,18,1);R(g,'#e8c25a',6,4,6,5);R(g,'#7a5a10',7,6,4,1);g.strokeStyle='#e8c25a';g.lineWidth=1.4;g.beginPath();g.arc(9,4,2.2,Math.PI,0);g.stroke()}];
OBJS.bflower=[12,12,g=>{[[6,2],[2,6],[10,6],[6,10],[3,3],[9,3]].forEach(([x,y],k)=>{R(g,k<4?'#5aa0ff':'#9fd0ff',x-1,y-1,3,3)});R(g,'#fff',5,5,2,2);R(g,'#3f8a2e',5,9,1,3)}];
/*@FX@*/
/*@DIALOG@*/

// ================= ITEMS & ENERGY =================
function give(id,n,x,y){if(n<=0)return;state.inv[id]=(state.inv[id]||0)+n;st().got[id]=(st().got[id]||0)+n;sfx.pick();pop(id,n,x,y);
 if(!state.seen[id]&&!ITEMS[id].tool){state.seen[id]=1;toast('New discovery: '+ITEMS[id].n+'!','tip');sfx.ok()}}
let pops=[];
function pop(id,n,x,y){const e=pops.find(p=>p.id===id&&p.life>.6);if(e){e.n+=n;e.life=1.4;return}pops.push({id,n,x:x!==undefined?x:player.x,y:y!==undefined?y-.6:player.y-1.6,life:1.4,off:pops.filter(p=>p.life>0).length})}
function take(id,n){state.inv[id]=(state.inv[id]||0)-n;if(state.inv[id]<=0)delete state.inv[id]}
function earn(v,x,y){state.bless+=v;coinPulse();if(x!==undefined)floatText(x,y,'+✦'+v,'#ffe066')}
let tiredT=0;
function spend(n){if(state.energy<n){if(GT-tiredT>4){tiredT=GT;toast('Too tired! Eat something, or go home to rest.')}return false}state.energy-=n;return true}
function eat(id){const it=ITEMS[id];if(!it.food||!cnt(id))return;if(state.energy>=maxE()){toast('You are full of energy.');return}take(id,1);state.energy=Math.min(maxE(),state.energy+it.food);tone(500,.1,'square',.03,0,700);floatText(player.x,player.y-1.6,'+'+it.food+'⚡','#9ef08a')}

// ================= WORK (push into things) =================
function facingTile(){return[Math.floor(player.x+player.fx*.7),Math.floor(player.y-.1+player.fy*.7)]}
function anim(id,d=.4){player.toolId=id;player.toolT=d;player.toolD=d}
function work(x0,y0){const T=now();if(inb(x0,y0)&&tiles[idx(x0,y0)]===WATER&&!objs[idx(x0,y0)]){return castRod(x0,y0)}
 const r=resolve(x0,y0);if(!r||!r.o||!tileOpen(r.x,r.y))return false;const {x,y,o}=r,i=idx(x,y);
 switch(o.t){
  case'tree':if(!spend(1))return false;anim('axe');sfx.chop();o.hp-=state.tools.axe;o.shake=.3;burst(x+.5,y,'#5aa83a',4);give('wood',1,x+.5,y-.5);if(o.hp<=0){objs[i]={t:'stump',k:o.k,rg:T+90};give('wood',2,x+.5,y-.5);st().chopped++;sfx.fall()}return true;
  case'rock':case'gold':case'onyx':{const need={rock:1,gold:2,onyx:3}[o.t];if(state.tools.pick<need){if(!toolSeen[o.t]||GT-toolSeen[o.t]>5){toolSeen[o.t]=GT;toast('You need a Lv '+need+' Pickaxe for this. Shamar can upgrade it.')}return false}
   if(!spend(1))return false;anim('pick');sfx.rock();o.hp-=state.tools.pick;o.shake=.25;burst(x+.5,y+.5,'#9a978f',4);if(o.t==='rock')give('stone',1,x+.5,y);
   if(o.hp<=0){objs[i]={t:'rubble',k:o.t,rg:T+({rock:100,gold:240,onyx:360}[o.t])};if(o.t==='rock'){give('stone',1,x+.5,y);if(Math.random()<.25)give('clay',1,x+.5,y)}else{give(o.t,1,x+.5,y);give('stone',1,x+.5,y)}}return true}
  case'fruit':case'bush':case'vine':case'hive':case'resin':case'beehive':if(!(o.n>0))return false;if(!spend(1))return false;anim('hand',.3);{const id={fruit:o.k,bush:'berries',vine:'grapes',hive:'honey',resin:'bdellium',beehive:'honey'}[o.t];const dbl=state.tools.basket&&(o.t==='fruit'||o.t==='bush'||o.t==='vine')?2:1;give(id,o.n*dbl,x+.5,y-.5);o.n=0;o.shake=.4;o.rg=T+({fruit:75,bush:60,vine:80,hive:150,beehive:120,resin:150}[o.t])}return true;
 }return false}
function stepOn(x,y){if(!tileOpen(x,y))return;const i=idx(x,y),o=objs[i],t=tiles[i];
 if(o){if(LITTER[o.t]&&!buildSel){objs[i]=null;give({twig:'wood',pebble:'stone',weed:'fiber',mushroom:'mushroom',clay:'clay'}[o.t],1,x+.5,y+.5);return}
  if(o.t==='crop'&&now()-o.pl>=GROW[o.c]){o.pl=now();give(o.c,ri(1,2),x+.5,y+.5);st().harvested++;burst(x+.5,y+.5,'#ffe08a',4,1.2);return}}
 else if(t===TALL){tiles[i]=G;if(Math.random()<.4)give('fiber',1,x+.5,y+.5)}}
function regrow(){const T=now();for(let i=0;i<objs.length;i++){const o=objs[i];if(!o||!o.rg||o.rg>T)continue;
 if(o.t==='stump'){if(Math.abs(i%W+.5-player.x)<1&&Math.abs(Math.floor(i/W)+.5-player.y)<1)continue;objs[i]={t:'tree',k:o.k,hp:3}}else if(o.t==='rubble'){if(Math.abs(i%W+.5-player.x)<1&&Math.abs(Math.floor(i/W)+.5-player.y)<1)continue;objs[i]=mkNode(o.k)}
 else{o.n=o.t==='fruit'?3:o.t==='hive'||o.t==='beehive'||o.t==='resin'?1:2;o.rg=0}}}

// ================= PURCHASES =================
function buyGhost(g){if(state.bought[g.key])return;if(!canPay(g.need,g.c)){toast('Not enough yet. Fill requests at the board to earn ✦.');sfx.no&&sfx.no();return}
 if(g.t==='house'&&areaPct(g.loc.a)<80){toast('Develop this area to 80% first.');return}
 if(g.t!=='bed'&&g.t!=='pen'&&g.t!=='dock'&&g.t!=='sandbar'){const pr=g.t==='house'?[[g.x,g.y],[g.x-1,g.y],[g.x+1,g.y],[g.x,g.y-1]]:[[g.x,g.y]];if(pr.some(([x,y])=>Math.floor(player.x)===x&&Math.floor(player.y)===y)){player.y+=1;if(collides(player.x,player.y,.3,solidAt))player.y-=2}}
 pay(g.need,g.c);state.bought[g.key]=1;st().ghosts++;applyGhost(g,true);sfx.build();burst(g.x+.5,g.y,'#ffe08a',22,3);
 if(g.t==='animal'){const p=state.pets[state.pets.length-1];spawnAnimals();const a=animals.find(q=>q.k===p.k);if(a)setTimeout(()=>openNaming(a),350)}
 if(g.t==='house')return houseBuilt(g);
 banner(g.n+'!');toast(AREAS[g.loc.a].n+' '+areaPct(g.loc.a)+'%','tip');if(areaPct(g.loc.a)>=80&&!state.tips['h'+g.loc.a]){state.tips['h'+g.loc.a]=1;setTimeout(()=>toast('This area is ready for its '+AREAS[g.loc.a].house+'!','tip'),1500)}save()}
async function houseBuilt(g){const a=g.loc.a;state.houses[a]=1;st().houses=nHouses();residents();state.energy=maxE();sfx.harp();banner('The '+AREAS[a].house+' is built!');save();
 const lines=[];if(a===1)lines.push({s:'gabriel',t:'Peace be with you! I will live here and help you harvest what is ripe in this area.'},{s:'gabriel',t:'Look north. A bridge now crosses the water to the River Lands.'});
 if(a===2)lines.push({s:'michael',t:'I will keep this house and help with the harvest. The way to the Midst of the Garden is open.'});
 if(a===3)lines.push({s:'god',t:'And God saw every thing that he had made, and, behold, it was very good.',ref:'Genesis 1:31'},{s:'narr',t:'You have built every house in Eden. Exploration '+explore()+'%. Keep going for 100%: every place, every item, every creature named.'});
 if(a<3){openArea(a+1)}await runDialog(lines)}
function openArea(a){state.area=Math.max(state.area,a);const by=a===2?50:29;[24,25].forEach(x=>tiles[idx(x,by)]=BRIDGE);LOCS.forEach(l=>{if(l.a===a&&l.c===0&&!state.open[l.id]){state.open[l.id]=1;st().lands=Object.keys(state.open).length}});fixReqs();save()}
async function openLoc(l){if(isOpenLoc(l)||l.a>state.area)return;if(state.bless<l.c){toast('You need ✦'+fmt(l.c)+' to clear '+l.n+'.');return}
 state.bless-=l.c;state.open[l.id]=1;st().lands=Object.keys(state.open).length;sfx.harp();banner('✦ '+l.n+' ✦');const [x0,y0,w,h]=l.r;burst(x0+w/2,y0+h/2,'#fff',40,6);fixReqs();save();
 if(!state.verse[l.id]&&VERSE[l.id]){state.verse[l.id]=1;await runDialog([{s:'narr',t:VERSE[l.id][0],ref:VERSE[l.id][1]}])}toast(AREAS[l.a].n+' '+areaPct(l.a)+'%','tip')}

// ================= ANIMALS =================
function collectPet(a){const pr=PROD[a.id];if(!pr||now()<a.rd)return false;a.rd=now()+pr[1];give(pr[0],1,a.x,a.y-.5);parts.push({heart:1,x:a.x,y:a.y-1,life:1});tone(660,.15,'sine',.04,0,880);return true}
function petName(a){return a.pet?state.pn[a.k]:state.names[a.id]}

// ================= REQUESTS =================
function reqPool(){const s=new Set(['wood','stone','fiber']);for(const l of LOCS){if(!isOpenLoc(l))continue;for(const [b] of NAT[l.id]||[]){const m={twig:'wood',pebble:'stone',weed:'fiber',tree:'wood','tree:jungle':'wood',rock:'stone',gold:state.tools.pick>=2?'gold':null,onyx:state.tools.pick>=3?'onyx':null,bush:'berries',mushroom:'mushroom',clay:'clay',resin:'bdellium'}[b];if(m)s.add(m)}
  for(const g of l.g){if(!state.bought[g.key])continue;if(g.t==='bed')s.add(g.k);if(g.t==='tree')s.add(g.k);if(g.t==='bush')s.add('berries');if(g.t==='vine')s.add('grapes');if(g.t==='beehive')s.add('honey');if(g.t==='animal'&&PROD[g.k])s.add(PROD[g.k][0])}}
 if(state.bought['home:1']||true)s.add('wheat');if(state.tools.rod)s.add('minnow');return[...s]}
function mkReq(rush){const pool=reqPool();const used=state.reqs.map(r=>r.id);let c=pool.filter(i=>!used.includes(i));if(!c.length)c=pool;const early=st().reqDone<2;const id=early?pick(['wood','stone','fiber','wheat'].filter(i=>c.includes(i)).concat(c).slice(0,4)):pick(c);
 const opened=Object.keys(state.open).length;const v=28+opened*18+(state.area-1)*90;const p=ITEMS[id].p;const n=clamp(Math.round(v/p),1,30);let r=Math.ceil(p*n*1.6/5)*5+(early?30:10);const q={id,n,r};if(rush){q.rush=1;q.r*=2;q.until=now()+240}return q}
function fixReqs(){if(!state)return;const T=now();state.reqs=state.reqs.filter(r=>!r.rush||r.until>T);const nr=state.reqs.filter(r=>!r.rush).length;for(let k=nr;k<3;k++)state.reqs.push(mkReq(false));
 if(!state.reqs.some(r=>r.rush)&&st().reqDone>=2&&T>=state.rushAt)state.reqs.push(mkReq(true))}

// ================= SLEEP =================
async function doSleep(){if(sleeping)return;sleeping=true;fish=null;$('#fade').classList.add('on');await wait(900);newDay();player.x=HOME.x+.5;player.y=HOME.y+1.6;player.fx=0;player.fy=1;snapCam();save();await wait(400);$('#fade').classList.remove('on');sleeping=false;banner('Day '+state.day);sfx.bird()}
function newDay(){state.day++;state.energy=maxE();const T=now();for(const o of objs){if(!o)continue;if(o.t==='crop')o.pl=Math.min(o.pl,T-GROW[o.c]);else if(o.rg)o.rg=T-1}regrow();for(const a of animals)if(a.pet)a.rd=Math.min(a.rd,T);for(const l of LOCS)if(isOpenLoc(l))for(let k=0;k<4;k++)litter(l)}

// ================= FISHING =================
function castRod(x,y){if(fish)return false;if(!state.tools.rod){if(!toolSeen.rod||GT-toolSeen.rod>6){toolSeen.rod=GT;toast('Buy a Fishing Rod from Shamar, then walk into water to fish.')}return false}
 if(!spend(2))return false;let l=null;for(let r=0;r<3&&!l;r++)for(let dy=-r;dy<=r&&!l;dy++)for(let dx=-r;dx<=r&&!l;dx++)l=locAt(x+dx,y+dy);const pool=FISHP[l&&FISHP[l.id]?l.id:'sea'];
 let r=Math.random(),f=pool[0][0];for(const [id,pr] of pool){if(r<pr){f=id;break}r-=pr}fish={x:x+.5,y:y+.5,ph:'wait',t:rnd(1.2,3.5),id:f};anim('rod',.5);sfx.splash();tip('fish','Wait for the ❗ then tap the screen!');return true}
function reel(){if(!fish)return;if(fish.ph==='bite'){fish.ph='game';const lv=fishLv();fish.g={fy:.5,fv:0,ft:.5,ftT:0,by:.55,bv:0,bh:Math.min(.5,.28+lv*.025),prog:.35,diff:ITEMS[fish.id].diff};fishHold=false;tip('fishg','Hold your finger down to raise the green bar. Keep the fish inside it!')}else if(fish.ph==='wait'){toast('Too soon!');fish=null}}
function updateFish(dt){if(!fish)return;if(fish.ph==='wait'){fish.t-=dt;if(fish.t<=0){fish.ph='bite';fish.t=1.4;tone(1400,.08,'square',.04);tone(1700,.08,'square',.04,.1)}}
 else if(fish.ph==='bite'){fish.t-=dt;if(fish.t<=0){toast('It got away…');fish=null}}
 else{const g=fish.g,hold=fishHold||keys[' '];g.ftT-=dt;if(g.ftT<=0){g.ft=clamp(g.fy+rnd(-.6,.6)*g.diff,.02,.98);g.ftT=rnd(.25,1.1)/Math.sqrt(g.diff)}g.fv+=(g.ft-g.fy)*g.diff*9*dt;g.fv*=Math.pow(.15,dt);g.fy=clamp(g.fy+g.fv*dt*2,0,1);
  g.bv+=(hold?-2.6:2.2)*dt;g.by+=g.bv*dt;if(g.by<0){g.by=0;g.bv=0}if(g.by>1-g.bh){g.by=1-g.bh;g.bv=-g.bv*.3}const on=g.fy>=g.by&&g.fy<=g.by+g.bh;g.prog+=on?dt*.36:-dt*.2;
  if(g.prog>=1){const lv=fishLv();give(fish.id,1,fish.x,fish.y);st().fish++;state.fxp+=Math.round(ITEMS[fish.id].p/5)+2;banner('Caught a '+ITEMS[fish.id].n+'!');if(fishLv()>lv)toast('Fishing level '+fishLv()+'!','tip');fish=null}else if(g.prog<=0){toast('The fish escaped!');fish=null}}}

// ================= MODALS =================
function openModal(tabs,active){modalOpen=true;updateControlsVis();const m=$('#modal');m.classList.add('on');const tb=m.querySelector('.tabs');tb.innerHTML='';const body=m.querySelector('.mbody');
 tabs.forEach(([k,lab,fn])=>{const d=document.createElement('div');d.className='tab'+(k===active?' on':'');d.textContent=lab;d.onclick=()=>{tb.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));d.classList.add('on');body.scrollTop=0;fn(body)};tb.appendChild(d)});(tabs.find(t=>t[0]===active)||tabs[0])[2](body);body.scrollTop=0}
function closeModal(){modalOpen=false;$('#modal').classList.remove('on');updateControlsVis()}
const reqHTML=need=>Object.entries(need||{}).map(([k,v])=>`<span class="${cnt(k)>=v?'have':'lack'}">${ITEMS[k].n} ${cnt(k)}/${v}</span>`).join(' · ');
const canPay=(need,bless)=>Object.entries(need||{}).every(([k,v])=>cnt(k)>=v)&&state.bless>=(bless||0);
const pay=(need,bless)=>{Object.entries(need||{}).forEach(([k,v])=>take(k,v));state.bless-=bless||0;coinPulse()};
const keep=(b,fn)=>{const sc=b.scrollTop;fn(b);b.scrollTop=sc};
const coinTag=()=>`<div class="have-coins">✦ ${fmt(state.bless)}</div>`;
function openNaming(a){const real=SPC[a.id][0],s=animSpr(a.id,0);openModal([['n','Name a Creature',b=>{b.innerHTML=`<div style="text-align:center"><img src="${s.toDataURL()}" style="width:${s.width*4}px;image-rendering:pixelated"><p class="muted">The ${real.toLowerCase()} looks up at you, waiting. What will you call it?</p></div><input class="name" maxlength="16" placeholder="Type a name…" autocomplete="off" autocapitalize="words"><div style="display:flex;gap:8px;margin-top:10px"><button class="btn alt" id="sug">Suggest</button><button class="btn" id="nm" style="flex:1">Name it</button></div>`;
 const inp=b.querySelector('input');b.querySelector('#sug').onclick=()=>{inp.value=pick(['Pip','Clover','Bramble','Honey','Pebble','Maple','Sunny','Willow','Biscuit','Moss','Dot','Sprout'])};const done=()=>{const v=inp.value.trim().slice(0,16)||real;if(a.pet)state.pn[a.k]=v;if(!state.names[a.id])state.names[a.id]=v;st().named=Object.keys(state.names).length;closeModal();sfx.ok();floatText(a.x,a.y-1.6,'“'+v+'”','#ffe08a');burst(a.x,a.y-.5,'#ffe08a',14,2.5);toast('And that was its name: '+v+'.','tip');save()};
 b.querySelector('#nm').onclick=done;inp.onkeydown=e=>{if(e.key==='Enter')done();e.stopPropagation()}}]],'n')}
function openBoard(){fixReqs();if(!state.tips.board){state.tips.board=1;runDialog([{s:'shamar',t:'Peace to you! I am Shamar. Bring what this board asks for and you will receive Blessings ✦.'},{s:'shamar',t:'Use Blessings to clear overgrown places and buy the see-through things around the island. A ⏱ rush request pays double!'}]).then(()=>openModal([['r','Requests',reqTab],['b','Shop',buyTab],['s','Sell',sellTab]],'r'));return}
 openModal([['r','Requests',reqTab],['b','Shop',buyTab],['s','Sell',sellTab]],'r')}
function reqTab(b){fixReqs();const T=now();let h=coinTag();state.reqs.forEach((r,k)=>{const ok=cnt(r.id)>=r.n;h+=`<div class="row ${r.rush?'rush':''}"><img src="${iconURL(r.id)}"><div class="grow"><div class="t1">${r.rush?'⏱ ':''}${ITEMS[r.id].n} ×${r.n}</div><div class="t2">Have ${cnt(r.id)} · <b class="gold">✦${r.r}</b>${r.rush?' · '+Math.max(0,Math.ceil((r.until-T)/60))+' min left':''}</div></div><button class="btn" data-rq="${k}" ${ok?'':'disabled'}>Deliver</button></div>`});
 b.innerHTML=h+'<p class="muted">A new request appears each time you finish one.</p>';b.querySelectorAll('[data-rq]').forEach(e=>e.onclick=()=>{const k=+e.dataset.rq,r=state.reqs[k];if(!r||cnt(r.id)<r.n)return;take(r.id,r.n);earn(r.r);st().reqDone++;if(r.rush)state.rushAt=now()+90;state.reqs.splice(k,1);sfx.coin();toast('Thank you! ✦'+r.r);fixReqs();keep(b,reqTab);save()})}
function buyTab(b){let h=coinTag()+'<div class="h3">Tools</div>';
 TOOLS.forEach(t=>{const lv=state.tools[t.id],nx=t.lv[lv+1];h+=`<div class="row"><img src="${iconURL(t.id)}"><div class="grow"><div class="t1">${t.n}${lv&&t.lv.length>2?' <span class="muted">Lv '+lv+'</span>':''}</div><div class="t2">${t.d}</div>${nx&&Object.keys(nx[1]).length?'<div class="req">'+reqHTML(nx[1])+'</div>':''}</div>${nx?`<button class="btn" data-tl="${t.id}" ${canPay(nx[1],nx[0])?'':'disabled'}>${lv?'Lv '+(lv+1)+' ':''}✦${fmt(nx[0])}</button>`:'<span class="muted">Owned</span>'}</div>`});b.innerHTML=h;
 b.querySelectorAll('[data-tl]').forEach(e=>e.onclick=()=>{const t=TOOLS.find(q=>q.id===e.dataset.tl),nx=t.lv[state.tools[t.id]+1];if(!nx||!canPay(nx[1],nx[0]))return;pay(nx[1],nx[0]);state.tools[t.id]++;if(t.id==='up_e')state.energy=maxE();sfx.build();toast(t.n+(state.tools[t.id]>1?' Lv '+state.tools[t.id]:'')+'!');keep(b,buyTab);fixReqs();save()})}
function sellTab(b){const ids=Object.keys(state.inv).filter(k=>ITEMS[k].p&&cnt(k)>0);let h=coinTag()+'<p class="muted" style="margin-top:0">Requests pay much more than selling.</p>';if(!ids.length)h+='<p class="muted">Nothing to sell yet.</p>';
 ids.forEach(id=>{h+=`<div class="row"><img src="${iconURL(id)}"><div class="grow"><div class="t1">${ITEMS[id].n} ×${cnt(id)}</div><div class="t2">✦${ITEMS[id].p} each</div></div><button class="btn alt" data-s1="${id}">1</button><button class="btn" data-sa="${id}">All</button></div>`});b.innerHTML=h;
 const sell=(id,n)=>{n=Math.min(n,cnt(id));if(n<=0)return;take(id,n);earn(ITEMS[id].p*n);sfx.coin();keep(b,sellTab)};b.querySelectorAll('[data-s1]').forEach(e=>e.onclick=()=>sell(e.dataset.s1,1));b.querySelectorAll('[data-sa]').forEach(e=>e.onclick=()=>sell(e.dataset.sa,cnt(e.dataset.sa)))}
function cookTab(b){let h='<p class="muted" style="margin-top:0">Food restores ⚡ energy. Open your bag to eat.</p>';COOK.forEach(r=>{const it=ITEMS[r.id];h+=`<div class="row"><img src="${iconURL(r.id)}"><div class="grow"><div class="t1">${it.n}</div><div class="t2">${it.food?'+'+it.food+'⚡ · ':''}worth ✦${it.p}</div><div class="req">${reqHTML(r.need)}</div></div><button class="btn" data-c="${r.id}" ${canPay(r.need)?'':'disabled'}>Make</button></div>`});b.innerHTML=h;
 b.querySelectorAll('[data-c]').forEach(e=>e.onclick=()=>{const r=COOK.find(q=>q.id===e.dataset.c);if(!canPay(r.need))return;pay(r.need);give(r.id,1);keep(b,cookTab)})}
let bagSel=null;
function bagTab(b){const ids=Object.keys(state.inv).filter(k=>cnt(k)>0);let h='';if(!ids.length)h='<p class="muted">Your bag is empty. Walk into twigs, stones and weeds, and push into trees and rocks.</p>';else{h='<div class="grid">';ids.forEach(id=>{h+=`<div class="slot ${id===bagSel?'sel':''}" data-i="${id}"><img src="${iconURL(id)}"><span class="n">${cnt(id)}</span></div>`});h+='</div>'}
 if(bagSel&&cnt(bagSel)){const it=ITEMS[bagSel];h+=`<div class="detail"><img src="${iconURL(bagSel)}"><div class="grow" style="flex:1"><b>${it.n}</b><div class="muted">${it.food?'Restores '+it.food+'⚡. ':''}${it.p?'Worth ✦'+it.p+'.':''}</div></div>${it.food?'<button class="btn" id="eatB">Eat</button>':''}</div>`}
 h+='<div class="h3">Tools</div><div class="muted">'+TOOLS.filter(t=>state.tools[t.id]&&t.id!=='up_e').map(t=>t.n+(t.lv.length>2?' Lv '+state.tools[t.id]:'')).join(' · ')+(state.tools.rod?' · Fishing Lv '+fishLv():'')+'</div>';b.innerHTML=h;
 b.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>{bagSel=e.dataset.i;bagTab(b)});const eb=b.querySelector('#eatB');if(eb)eb.onclick=()=>{eat(bagSel);bagTab(b)}}
function bookTab(b){let h=`<div style="text-align:center"><div class="big">${explore()}%</div><div class="muted">Exploration rate · clear places, buy everything, discover items and name creatures.</div></div>`;
 for(let a=1;a<=3;a++){const lock=a>state.area;h+=`<div class="row" style="${lock?'opacity:.5':''}"><div class="grow"><div class="t1">Area ${a}: ${lock?'???':AREAS[a].n}</div><div class="pbar"><i style="width:${lock?0:areaPct(a)}%"></i></div><div class="t2">${lock?'Build the '+AREAS[a-1].house+' to reach it':areaPct(a)+'% developed · '+(state.houses[a]?AREAS[a].house+' built ✓':AREAS[a].house+' at 80%')}</div></div></div>`}
 h+=`<div class="h3">Discoveries ${DISCOVER.filter(k=>state.seen[k]).length}/${DISCOVER.length}</div><div class="grid">`;
 DISCOVER.forEach(id=>{const s=state.seen[id];h+=`<div class="slot" title="${s?ITEMS[id].n:'?'}"><img src="${iconURL(id)}" style="${s?'':'filter:brightness(0);opacity:.25'}"></div>`});h+=`</div><div class="h3">Creatures ${Object.keys(state.names).length}/${NANIM}</div><div class="grid" style="grid-template-columns:repeat(auto-fill,70px)">`;
 Object.keys(SPC).forEach(id=>{const n=state.names[id],s=animSpr(id,0);h+=`<div class="row" style="flex-direction:column;gap:2px;padding:4px;margin:0;${n?'':'opacity:.4'}"><img src="${s.toDataURL()}" style="width:${Math.min(48,s.width*2)}px;height:auto;${n?'':'filter:brightness(0)'}"><div style="font-size:12px;text-align:center;line-height:1.1">${n?'<b>'+esc(n)+'</b><br><span class="muted">'+SPC[id][0]+'</span>':'???'}</div></div>`});b.innerHTML=h+'</div>'}
function optTab(b){b.innerHTML=`<div class="h3">How to play</div><p class="muted">Drag anywhere on the screen to walk. <b>Walk into things</b> to gather them, and keep pushing into trees and rocks. Walk through ripe crops to harvest; they grow back by themselves. Walk up to a see-through thing or an overgrown sign to buy it. Fill requests at the board for ✦. Develop an area to 80% to build its house and open the next area.</p><div class="h3">Credits</div><p class="muted">Pixel art: Sunnyside World by danieldiggle (danieldiggle.itch.io/sunnyside), with extra sprites drawn for this game.</p><div class="h3">Settings</div><div class="row"><div class="grow">Music</div><button class="btn alt" id="mus">${state.music?'On':'Off'}</button></div><div class="row"><div class="grow">Sound</div><button class="btn alt" id="snd">${state.sound?'On':'Off'}</button></div><div class="row"><div class="grow">Start over<div class="t2">Erases this island.</div></div><button class="btn alt" id="rs">Start over</button></div>`;
 b.querySelector('#mus').onclick=()=>{state.music=!state.music;ensureAudio();optTab(b)};b.querySelector('#snd').onclick=()=>{state.sound=!state.sound;optTab(b)};b.querySelector('#rs').onclick=e=>{if(e.target.dataset.c){try{localStorage.removeItem(KEY)}catch(x){}location.reload()}else{e.target.dataset.c=1;e.target.textContent='Tap again to erase'}}}
// ---- build / decorate ----
function buildIcon(id){if(id==='path')return tileSpr(PATH,0,0,0).toDataURL();if(id==='fence')return fenceSpr(3).toDataURL();return objSpr(id).toDataURL()}
function buildTab(b){let h='<p class="muted" style="margin-top:0">Decorate your island however you like. Pick something, then tap open land to place it. Tap something you placed to pick it back up.</p>';BUILD.forEach(q=>{const have=state.stock[q.id]||0;const ok=have>0||canPay(q.need,q.bless);h+=`<div class="row"><img src="${buildIcon(q.id)}" style="object-fit:contain"><div class="grow"><div class="t1">${q.n}${have?' <span class="muted">(have '+have+')</span>':''}</div><div class="req">${reqHTML(q.need)}${q.bless?` <span class="${state.bless>=q.bless?'have':'lack'}">✦${q.bless}</span>`:''}</div></div><button class="btn" data-b="${q.id}" ${ok?'':'disabled'}>Place</button></div>`});b.innerHTML=h;
 b.querySelectorAll('[data-b]').forEach(e=>e.onclick=()=>{buildSel=e.dataset.b;closeModal();updateBuildBar()})}
function updateBuildBar(){const el=$('#buildBar');if(!buildSel){el.style.display='none';return}const q=BUILD.find(x=>x.id===buildSel);el.style.display='flex';el.querySelector('span').textContent=q.n+' · tap to place'}
function tryPlace(x,y){const q=BUILD.find(k=>k.id===buildSel);if(!inb(x,y)||!tileOpen(x,y)||locOf[idx(x,y)]<0){toast('Place things on land you have cleared.');return}const i=idx(x,y),o=objs[i],t=tiles[i];
 if(o&&o.p){objs[i]=null;state.stock[o.t]=(state.stock[o.t]||0)+1;sfx.pick();toast('Picked up.');return}
 if(!o&&t===PATH&&state.pt&&state.pt[i]){tiles[i]=G;delete state.pt[i];state.stock.path=(state.stock.path||0)+1;sfx.pick();return}
 if(o||reserved[i]||t===WATER||t===BRIDGE||t===TILLED){toast('Something is in the way.');return}if(Math.floor(player.x)===x&&Math.floor(player.y)===y&&SOLID[q.id]){toast('Step off that spot first.');return}
 if(state.stock[q.id]>0)state.stock[q.id]--;else if(canPay(q.need,q.bless))pay(q.need,q.bless);else{toast('You need more materials.');buildSel=null;updateBuildBar();return}
 if(q.id==='path'){tiles[i]=PATH;(state.pt=state.pt||{})[i]=1}else objs[i]={t:q.id,p:1};
 st().built++;sfx.build();burst(x+.5,y+.5,'#ffe08a',6);save()}

// ================= PROMPT CARD (MMF-style popup) =================
function nearGhost(){let best=null,bd=1.5;for(const g of GHOSTS){if(state.bought[g.key]||!isOpenLoc(g.loc))continue;let d;if(g.t==='bed'||g.t==='pen'){const cx=clamp(player.x,g.x,g.x+g.w),cy=clamp(player.y,g.y,g.y+g.h);d=Math.hypot(cx-player.x,cy-player.y)*1.2}else if(g.tiles){d=Math.min(...g.tiles.map(([x,y])=>Math.hypot(x+.5-player.x,y+.5-player.y)))-.3}else if(g.t==='house'){d=Math.hypot(g.x+.5-player.x,g.y+.8-player.y)-.9}else d=Math.hypot(g.x+.5-player.x,g.y+.7-player.y);if(d<bd){bd=d;best=g}}return best}
function nearNpc(){for(const n of NPCS)if(Math.hypot(n.x-player.x,n.y-player.y)<1.5)return n;return null}
function nearAnimal(){let best=null,bd=1.4;for(const a of animals){if(!isOpenLoc(a.loc))continue;const d=Math.hypot(a.x-player.x,a.y-player.y);if(d<bd&&!petName(a)){bd=d;best=a}}return best}
function lockedAhead(){const tries=[facingTile(),[Math.floor(player.x),Math.floor(player.y-.9)],[Math.floor(player.x),Math.floor(player.y+.6)],[Math.floor(player.x-.7),Math.floor(player.y)],[Math.floor(player.x+.7),Math.floor(player.y)]];for(const [x,y] of tries){const l=locAt(x,y);if(l&&!isOpenLoc(l)&&l.a<=state.area)return l}return null}
function ghostImg(g){const k='gh'+g.key;if(iconURLs[k])return iconURLs[k];let s;if(g.t==='house')s=AT[g.spr]?AT[g.spr][0]:homeSpr(2);else if(g.t==='bed')s=cropSpr(g.k,4);else if(g.t==='tree')s=treeSpr(g.k==='date'?'palm':'fruit',0,0);else if(g.t==='animal')s=animSpr(g.k,0);else if(g.t==='pen')s=fenceSpr(3);else if(g.t==='dock')s=tileSpr(BRIDGE,0,0,0);else if(g.t==='sandbar')s=tileSpr(SAND,0,0,0);else if(g.t==='beehive')s=objSpr('hive');else s=objSpr(g.t);iconURLs[k]=s.toDataURL();return iconURLs[k]}
const costHTML=(need,c)=>[...Object.entries(need||{}).map(([k,v])=>`<span class="${cnt(k)>=v?'have':'lack'}"><img src="${iconURL(k)}">${cnt(k)}/${v}</span>`),`<span class="${state.bless>=c?'have':'lack'}">✦${fmt(c)}</span>`].join(' ');
function getPrompt(){if(buildSel||sleeping||!player)return null;
 if(fish&&fish.ph!=='game')return{key:'fish'+fish.ph,img:iconURL('rod'),t:fish.ph==='bite'?'❗ Tap now!':'Fishing…',s:'Wait for a bite',btns:[{l:fish.ph==='bite'?'Pull!':'Stop',fn:()=>{if(fish&&fish.ph==='bite')reel();else fish=null}}]};
 if(fish)return null;
 const n=nearNpc();if(n){if(n.id==='shamar')return{key:'shamar',img:portrait('shamar').toDataURL(),t:'Shamar',s:'Requests, tools and selling',btns:[{l:'Talk',fn:openBoard}]};return{key:'res'+n.res,img:portrait(n.id).toDataURL(),t:n.name,s:'Lives in the '+AREAS[n.res].house+' and helps you harvest',btns:[{l:'Talk',fn:()=>runDialog([{s:n.id,t:pick(['I gather what is ripe in this area and bring it to you.','Every see-through thing you buy makes this place more like the garden God planted.','There are hidden places. Look for blue flowers near the water.','The river parts four ways out of Eden. Keep exploring!'])}])}]}}
 const r0=resolve(...facingTile());const near=(t)=>{for(const [dx,dy] of [[0,0],[0,-1],[0,1],[-1,0],[1,0]]){const r=resolve(Math.floor(player.x)+dx,Math.floor(player.y-.3)+dy);if(r&&r.o&&r.o.t===t)return r}return null};
 if(near('board'))return{key:'board',img:objSpr('board').toDataURL(),t:'Request Board',s:state.reqs.filter(r=>cnt(r.id)>=r.n).length?'You can fill a request!':'Bring items, earn ✦',btns:[{l:'Open',fn:openBoard}]};
 if(near('home'))return{key:'home',img:homeSpr(1).toDataURL(),t:'Your Bower',s:'Rest to restore ⚡ and grow everything',btns:[{l:'Sleep',fn:doSleep},{l:'Cook',fn:()=>openModal([['c','Kitchen',cookTab]],'c'),alt:1}]};
 if(near('life'))return{key:'life',img:iconURL('fig'),t:'Tree of Life',s:state.lifeDay===state.day?'Come back tomorrow':'Eat to restore all energy',btns:[{l:'Eat',dis:state.lifeDay===state.day,fn:()=>{state.lifeDay=state.day;state.energy=maxE();sfx.harp();burst(MIDST.x+.5,MIDST.y-2,'#ffe08a',24,3);toast('Your strength is renewed.')}}]};
 const g=nearGhost();if(g){if(g.t==='house'){const p=areaPct(g.loc.a);return{key:'g'+g.key+p,img:ghostImg(g),t:'Build the '+g.n,s:p<80?`Develop ${AREAS[g.loc.a].n} to 80% (now ${p}%)`:costHTML(g.need,g.c),html:p>=80,btns:[{l:'Build',dis:p<80||!canPay(g.need,g.c),fn:()=>buyGhost(g)}]}}
  return{key:'g'+g.key,img:ghostImg(g),t:g.n,s:costHTML(g.need,g.c),html:1,btns:[{l:'Buy',dis:!canPay(g.need,g.c),fn:()=>buyGhost(g)}]}}
 const l=lockedAhead();if(l)return{key:'l'+l.id,img:objSpr('sign').toDataURL(),t:'Clear '+l.n,s:costHTML({},l.c),html:1,btns:[{l:'Clear',dis:state.bless<l.c,fn:()=>openLoc(l)}]};
 const a=nearAnimal();if(a)return{key:'a'+(a.k||a.id),img:animSpr(a.id,0).toDataURL(),t:'A creature!',s:'It has no name yet',btns:[{l:'Name it',fn:()=>openNaming(a)}]};
 return null}
let promptKey='',promptObj=null;
function updatePrompt(){const p=(!dlg&&!modalOpen&&!titleOpen)?getPrompt():null;const el=$('#prompt');if(!p){if(promptKey){el.classList.remove('on');promptKey='';promptObj=null}return}
 const sig=p.key+'|'+p.s+'|'+p.btns.map(b=>b.dis?1:0).join('');promptObj=p;if(sig===promptKey)return;promptKey=sig;el.querySelector('img').src=p.img;el.querySelector('.pt').textContent=p.t;const ps=el.querySelector('.ps');if(p.html)ps.innerHTML=p.s;else ps.textContent=p.s;
 const bb=el.querySelector('.pb');bb.innerHTML='';p.btns.forEach((b,k)=>{const e=document.createElement('button');e.className='btn'+(b.alt?' alt':'');e.textContent=b.l;e.disabled=!!b.dis;e.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();ensureAudio();const cur=promptObj&&promptObj.btns[k];if(cur&&!cur.dis){cur.fn();promptKey=''}});bb.appendChild(e)});el.classList.add('on')}

// ================= HUD =================
let lastHud='',coinT=0;
function coinPulse(){const e=$('#coins');e.classList.remove('pulse');void e.offsetWidth;e.classList.add('pulse')}
function updateHUD(){$('#coinN').textContent=fmt(state.bless);const e=state.energy/maxE();$('#eFill').style.width=(e*100)+'%';$('#eFill').style.background=e>.5?'#6ee05a':e>.25?'#f0c83a':'#f05a3a';$('#eNum').textContent=Math.floor(state.energy)+'/'+maxE();
 const a=Math.min(curArea(),state.area);$('#aName').textContent=AREAS[a].n;const p=areaPct(a);$('#aFill').style.width=p+'%';$('#aPct').textContent=p+'%';$('#xPct').textContent='Exploration '+explore()+'%  ·  Day '+state.day;
 const g=GUIDE.find(q=>!q[1](st()));const txt=g?g[0]:'Reach 100% exploration!';if(txt!==lastHud){lastHud=txt;$('#tracker').textContent=txt}
 updatePrompt()}
function updateControlsVis(){const hide=!!dlg||modalOpen||titleOpen;$('#hud').style.visibility=titleOpen?'hidden':'visible';$('#ebox').style.visibility=titleOpen?'hidden':'visible';if(hide){$('#prompt').classList.remove('on');promptKey='';endJoy()}}

// ================= INPUT (drag anywhere) =================
const keys={};let joy=null,touchRec=null;
function endJoy(){joy=null;$('#joy').style.display='none'}
function joyMove(e){let jx=e.clientX-joy.ox,jy=e.clientY-joy.oy;const l=Math.hypot(jx,jy),m=44;if(l>m){joy.ox+=jx/l*(l-m);joy.oy+=jy/l*(l-m);jx=jx/l*m;jy=jy/l*m}joy.dx=jx/m;joy.dy=jy/m;const J=$('#joy');J.style.left=(joy.ox-50)+'px';J.style.top=(joy.oy-50)+'px';$('#knob').style.transform=`translate(${jx}px,${jy}px)`;if(l>8)J.style.display='block'}
function screenToWorld(sx,sy){return[(sx*dpr/SC+camX)/TS,(sy*dpr/SC+camY)/TS]}
function setupInput(){cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('pointerdown',e=>{ensureAudio();if(titleOpen||modalOpen||sleeping)return;if(dlg){dialogTap();return}if(fish&&fish.ph==='game'){fishHold=true;return}if(fish&&fish.ph==='bite'){reel();return}
  if(buildSel){touchRec={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};return}
  joy={id:e.pointerId,ox:e.clientX,oy:e.clientY,dx:0,dy:0};touchRec={id:e.pointerId,joy:1}});
 window.addEventListener('pointermove',e=>{if(joy&&e.pointerId===joy.id)joyMove(e)});
 const up=e=>{fishHold=false;if(touchRec&&e.pointerId===touchRec.id){if(!touchRec.joy&&buildSel&&performance.now()-touchRec.t<600){const [wx,wy]=screenToWorld(touchRec.x,touchRec.y);tryPlace(Math.floor(wx),Math.floor(wy))}touchRec=null;endJoy()}};window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
 $('#dialog').addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON')return;e.preventDefault();dialogTap()});
 $('#bBag').onclick=()=>{ensureAudio();if(!dlg&&!sleeping){bagSel=null;openModal([['b','Bag',bagTab]],'b')}};$('#bBuild').onclick=()=>{if(!dlg&&!sleeping)openModal([['b','Decorate',buildTab]],'b')};$('#bBook').onclick=()=>{if(!dlg&&!sleeping)openModal([['e','Exploration',bookTab],['o','Options',optTab]],'e')};
 $('#aBox').onclick=()=>$('#bBook').click();$('#mx').onclick=closeModal;$('#modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal')closeModal()});$('#buildDone').onclick=()=>{buildSel=null;updateBuildBar()};
 window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;ensureAudio();const k=e.key.toLowerCase();keys[k]=true;if(dlg){if(k===' '||k==='enter'||k==='e'){e.preventDefault();dialogTap()}const L2=dlg.lines[dlg.i];if(L2.choices&&dlg.chars>=dlg.full.length&&/^[1-4]$/.test(k)){const c=L2.choices[+k-1];if(c){dlg.val=c.v;advance()}}return}
  if(modalOpen){if(k==='escape')closeModal();return}if(titleOpen||sleeping)return;if(k===' '&&fish&&fish.ph==='bite')reel();else if(k==='e'||k==='enter'){if(promptObj&&promptObj.btns[0]&&!promptObj.btns[0].dis){promptObj.btns[0].fn();promptKey=''}}else if(k==='i')$('#bBag').click();else if(k==='b')$('#bBuild').click();else if(k==='escape'&&buildSel){buildSel=null;updateBuildBar()}});
 window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;endJoy()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state&&!titleOpen)save()});document.addEventListener('gesturestart',e=>e.preventDefault())}

// ================= SAVE =================
function b64e(u){let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)}
function b64d(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function save(){if(!state||titleOpen)return;try{state.px=player.x;state.py=player.y;for(const a of animals)if(a.pet){const p=state.pets.find(q=>q.k===a.k);if(p){p.x=a.x;p.y=a.y;p.rd=a.rd}}const pets=state.pets.map(p=>({k:p.k,id:p.id,x:p.x,y:p.y,rect:p.rect,rd:p.rd}));const o=[];for(let i=0;i<objs.length;i++)if(objs[i])o.push([i,objs[i]]);localStorage.setItem(KEY,JSON.stringify({v:1,st:Object.assign({},state,{pets}),t:b64e(tiles),o}))}catch(e){console.warn(e)}}
function hasSave(){try{return !!localStorage.getItem(KEY)}catch(e){return false}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));genWorld();const t=b64d(d.t);if(t.length!==W*H)return false;tiles=t;objs=new Array(W*H).fill(null);for(const [i,o] of d.o)objs[i]=o;const f=freshState();state=Object.assign(f,d.st);state.stats=Object.assign(freshState().stats,d.st.stats);state.tools=Object.assign(freshState().tools,d.st.tools);
 player=mkPlayer(state.px||HOME.x+.5,state.py||HOME.y+1.6);residents();spawnAnimals();fixReqs();return true}catch(e){console.warn(e);return false}}
function mkPlayer(x,y){return{x,y,fx:0,fy:1,anim:0,moving:false,toolT:0,toolD:.45,toolId:null,side:1,lt:-1}}
function newGame(){state=freshState();player=null;genWorld();for(let i=0;i<objs.length;i++)if(objs[i]&&objs[i].t==='crop')objs[i].pl=now()-100;player=mkPlayer(HOME.x+.5,HOME.y+1.6);residents();spawnAnimals();fixReqs();titleOpen=false;save()}

// ================= UPDATE =================
let hudT=0,saveT=0,birdT=5,secT=0,litT=0,lastLoc='';
function update(dt){GT+=dt;tickDialog(dt);musicTick(dt);
 for(const p of parts){p.life-=dt;if(p.heart)p.y-=dt*.8;else{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||2.5)*dt}}parts=parts.filter(p=>p.life>0);for(const f of floats){f.life-=dt;f.y-=dt*.8}floats=floats.filter(f=>f.life>0);for(const p of pops){p.life-=dt}pops=pops.filter(p=>p.life>0);
 if(titleOpen){camTarget(26+Math.sin(GT*.1)*6,56+Math.cos(GT*.08)*4,1);return}
 hudT-=dt;if(hudT<=0){hudT=.12;updateHUD()}
 secT-=dt;if(secT<=0){secT=1;regrow();if(state.energy<maxE())state.energy=Math.min(maxE(),state.energy+.25);helpers();const T=now();if(state.reqs.some(r=>r.rush&&r.until<=T)||(!state.reqs.some(r=>r.rush)&&st().reqDone>=2&&T>=state.rushAt))fixReqs()}
 litT-=dt;if(litT<=0){litT=30;for(const l of LOCS)if(isOpenLoc(l))litter(l)}
 if(dlg||modalOpen||sleeping)return;
 let mx=0,my=0;if(keys.a||keys.arrowleft)mx--;if(keys.d||keys.arrowright)mx++;if(keys.w||keys.arrowup)my--;if(keys.s||keys.arrowdown)my++;if(joy&&Math.hypot(joy.dx,joy.dy)>.2){mx=joy.dx;my=joy.dy}
 const fgame=fish&&fish.ph==='game';if((mx||my)&&fish&&!fgame)fish=null;
 let pushing=false;
 if((mx||my)&&!fgame){const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}const ti=tiles[idx(Math.floor(player.x),Math.floor(player.y))];const sp=(state.tools.sandals?5.2:4.3)*(ti===PATH||ti===BRIDGE?1.12:1),ox=player.x,oy=player.y;moveEnt(player,mx*sp*dt,my*sp*dt,.3,solidAt);const mv=Math.hypot(player.x-ox,player.y-oy);player.moving=mv>.0005;player.anim+=mv/4;
  if(Math.abs(mx)>Math.abs(my)+.05){player.fx=Math.sign(mx);player.fy=0;player.side=player.fx}else{player.fx=0;player.fy=Math.sign(my)}
  if(mv<sp*dt*.35)pushing=true}else player.moving=false;
 player.toolT=Math.max(0,player.toolT-dt);workT-=dt;
 if(workT<=0&&!fish&&pushing){const ok=work(...facingTile());workT=ok?.42:.2}
 const tx=Math.floor(player.x),ty=Math.floor(player.y),lt=idx(tx,ty);if(lt!==player.lt){player.lt=lt;stepOn(tx,ty);const l=locAt(tx,ty);if(l&&l.id!==lastLoc){lastLoc=l.id;banner(l.n)}}
 updateFish(dt);
 for(const a of animals){if(!isOpenLoc(a.loc))continue;a.bob+=dt;const d=Math.hypot(a.x-player.x,a.y-player.y);if(a.pet&&d<.9)collectPet(a);if(d<1.4&&!a.pet){a.vx=a.vy=0;a.t=1}a.t-=dt;if(a.t<=0){if(Math.random()<.45){a.vx=a.vy=0;a.t=rnd(1,4)}else{const an=Math.random()*6.283,sp=.6;a.vx=Math.cos(an)*sp;a.vy=Math.sin(an)*sp;a.t=rnd(1,2.5)}}
  if(a.vx||a.vy){const ox=a.x,oy=a.y,[rx,ry,rw,rh]=a.rect;moveEnt(a,a.vx*dt,a.vy*dt,.3,(x,y)=>solidRaw(x,y)||x<rx||y<ry||x>=rx+rw||y>=ry+rh||(objs[idx(x,y)]&&objs[idx(x,y)].t==='crop'));if(a.x===ox&&a.y===oy)a.t=0;if(Math.abs(a.vx)>.05)a.face=a.vx>0}}
 for(const n of NPCS)if(n.ht>0)n.ht-=dt;
 birdT-=dt;if(birdT<=0){birdT=rnd(6,14);sfx.bird()}saveT-=dt;if(saveT<=0){saveT=15;save()}
 camTarget(player.x,player.y-.5,Math.min(1,dt*8))}
let helpT=0;
function helpers(){if(!nHouses())return;helpT--;if(helpT>0)return;helpT=12;const T=now();for(const n of NPCS){if(!n.res)continue;const got={};for(const l of LOCS){if(l.a!==n.res||!isOpenLoc(l))continue;const [x0,y0,w,h]=l.r;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const o=objs[idx(x,y)];if(o&&o.t==='crop'&&T-o.pl>=GROW[o.c]){o.pl=T;got[o.c]=(got[o.c]||0)+1}}}
  for(const a of animals)if(a.pet&&a.loc.a===n.res&&PROD[a.id]&&T>=a.rd){a.rd=T+PROD[a.id][1];const p=PROD[a.id][0];got[p]=(got[p]||0)+1}
  const ks=Object.keys(got);if(ks.length){ks.forEach(k=>{state.inv[k]=(state.inv[k]||0)+got[k];st().got[k]=(st().got[k]||0)+got[k];state.seen[k]=1});n.ht=2;if(Math.hypot(n.x-player.x,n.y-player.y)<12)floatText(n.x,n.y-2.2,'+'+ks.map(k=>got[k]+' '+ITEMS[k].n).join(', '),'#bfe6ff');else toast(n.name+' harvested '+ks.map(k=>got[k]+' '+ITEMS[k].n).join(', '))}}}

// ================= RENDER =================
let cv,ctx,buf,bx,cw=1,ch=1,dpr=1,SC=3,camX=0,camY=0,camFX=0,camFY=0;
function camTarget(x,y,k){camFX+=(x*TS-camFX)*k;camFY+=(y*TS-camFY)*k}
function snapCam(){camFX=player.x*TS;camFY=(player.y-.5)*TS}
function resize(){dpr=window.devicePixelRatio||1;cw=Math.floor(innerWidth*dpr);ch=Math.floor(innerHeight*dpr);cv.width=cw;cv.height=ch;SC=Math.max(2,Math.round(Math.min(cw,ch)/(TS*11)));buf.width=Math.ceil(cw/SC);buf.height=Math.ceil(ch/SC);bx.imageSmoothingEnabled=false;ctx.imageSmoothingEnabled=false}
function drawSpr(s,cx,by,flip){const x=Math.round(cx-s.width/2),y=Math.round(by-s.height);if(flip){bx.save();bx.translate(x+s.width,y);bx.scale(-1,1);bx.drawImage(s,0,0);bx.restore()}else bx.drawImage(s,x,y)}
function shadow(cx,by,w){bx.fillStyle='rgba(0,0,0,.2)';bx.beginPath();bx.ellipse(Math.round(cx),Math.round(by),w,Math.max(1.5,w*.35),0,0,7);bx.fill()}
function bubble(cx,top,ch,col){const x=Math.round(cx),y=Math.round(top-9+Math.sin(GT*5)*1);bx.fillStyle='#2c1608';bx.fillRect(x-4,y-1,9,10);bx.fillRect(x-1,y+9,3,2);bx.fillStyle='#fff';bx.fillRect(x-3,y,7,8);bx.fillRect(x,y+8,1,2);bx.fillStyle=col||'#e8392b';if(ch==='!'){bx.fillRect(x,y+1,1,4);bx.fillRect(x,y+6,1,1)}else{bx.fillRect(x-1,y+1,3,1);bx.fillRect(x+1,y+2,1,2);bx.fillRect(x,y+4,1,1);bx.fillRect(x,y+6,1,1)}}
function drawObj(o,x,y){const cx=x*TS+8,by=y*TS+16,sh=o.shake?Math.round(Math.sin(GT*50)*o.shake*4):0;if(o.shake)o.shake=Math.max(0,o.shake-1/60);const pk=!!AT.tree1;
 switch(o.t){
  case'tree':if(o.k==='palm'||!pk)shadow(cx,by-2,10);drawSpr(treeSpr(o.k,0,(x+y)%2),cx+sh,by+(pk&&o.k!=='palm'?4:1));break;
  case'fruit':{const palm=o.k==='date';if(palm||!pk)shadow(cx,by-2,10);drawSpr(treeSpr(palm?'palm':'fruit',0,(x+y)%2),cx+sh,by+(pk&&!palm?4:1));if(o.n>0){const col={apple:'#d93a2e',fig:'#6b3a7a',pomegranate:'#c22a3c',olive:'#55702b',date:'#7a3e17'}[o.k];(palm||!pk?[[-8,-30],[6,-36],[0,-24]]:[[-8,-20],[5,-24],[-1,-15]]).slice(0,o.n).forEach(([dx,dy])=>{bx.fillStyle='#2c1608';bx.fillRect(cx+dx+sh-1,by+dy-1,5,5);bx.fillStyle=col;bx.fillRect(cx+dx+sh,by+dy,3,3);bx.fillStyle='rgba(255,255,255,.7)';bx.fillRect(cx+dx+sh,by+dy,1,1)})}break}
  case'crop':{const f=clamp((now()-o.pl)/GROW[o.c],0,1),ripe=f>=1;drawSpr(cropSpr(o.c,ripe?4:Math.min(3,Math.floor(f*4))),cx,by+1);if(ripe&&Math.sin(GT*4+x*1.7+y)>.75){bx.fillStyle='#fff';bx.fillRect(cx+3,by-14,1,3);bx.fillRect(cx+2,by-13,3,1)}break}
  case'home':shadow(cx,by-1,22);drawSpr(homeSpr(1),cx,by+1);break;
  case'house':shadow(cx,by-1,24);drawSpr(AT[o.spr]?AT[o.spr][0]:homeSpr(2),cx,by+1);break;
  case'life':{const gl=bx.createRadialGradient(cx,by-40,4,cx,by-40,50);gl.addColorStop(0,'rgba(255,230,140,'+(.35+.1*Math.sin(GT*2))+')');gl.addColorStop(1,'rgba(255,230,140,0)');bx.fillStyle=gl;bx.fillRect(cx-50,by-90,100,100);shadow(cx,by-2,22);drawSpr(bigTreeSpr(true),cx,by+2);[[-14,-50],[10,-56],[-2,-66],[16,-44],[-20,-60],[4,-46]].forEach(([dx,dy])=>{bx.fillStyle='#2c1608';bx.fillRect(cx+dx-1,by+dy-1,5,5);bx.fillStyle='#ffd54a';bx.fillRect(cx+dx,by+dy,3,3)});break}
  case'bush':if(AT.bush){drawSpr(AT[o.n>0?'bush_berry':'bush'][0],cx+sh,by+3);break}
  case'vine':case'resin':{drawSpr(objSpr(o.t),cx+sh,by+1);if(o.n>0){const col=o.t==='vine'?'#7a3aa0':'#f0a030';[[-4,-12],[3,-9],[0,-16]].forEach(([dx,dy])=>{bx.fillStyle=col;bx.fillRect(cx+dx+sh,by+dy,2,2)})}break}
  case'hive':case'beehive':drawSpr(objSpr('hive'),cx+sh,by+1);if(o.n>0){bx.fillStyle='#ffd23a';for(let k=0;k<3;k++)bx.fillRect(Math.round(cx+Math.sin(GT*3+k*2)*9),Math.round(by-16+Math.cos(GT*4+k)*4),1,1)}break;
  case'fence':{const n=(dx,dy)=>{const q=inb(x+dx,y+dy)&&objs[idx(x+dx,y+dy)];return q&&q.t==='fence'};drawSpr(fenceSpr((n(1,0)?1:0)|(n(-1,0)?2:0)|(n(0,-1)?4:0)),cx,by+1);break}
  case'campfire':drawSpr(objSpr('campfire'),cx,by);if(AT.fire)drawSpr(AT.fire[Math.floor(GT*8)%4],cx,by-7);break;
  case'stump':drawSpr(objSpr('stump'),cx,by);break;
  case'rubble':drawSpr(objSpr('pebble'),cx,by-2);break;
  case'clay':bx.drawImage(icon('clay'),cx-6,by-13,12,12);break;
  case'bflower':drawSpr(objSpr('bflower'),cx,by-2);if(Math.sin(GT*3+x)>.6){bx.fillStyle='#bfe6ff';bx.fillRect(cx+4,by-14,1,1)}break;
  case'board':shadow(cx,by-1,10);drawSpr(objSpr('board'),cx,by+1);if(state&&state.reqs.some(r=>cnt(r.id)>=r.n))bubble(cx,by-26,'!','#2a9a2a');break;
  case'block':break;
  default:if(OBJS[o.t]||PK[o.t])drawSpr(objSpr(o.t),cx+sh,by)}}
function drawGhost(g){bx.globalAlpha=.42+.08*Math.sin(GT*3);const cx=g.x*TS+8,by=g.y*TS+16;
 switch(g.t){
  case'bed':for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++){bx.drawImage(tileSpr(TILLED,0,0,0),x*TS,y*TS);drawSpr(cropSpr(g.k,4),x*TS+8,y*TS+17)}break;
  case'pen':for(let x=g.x;x<g.x+g.w;x++)for(let y=g.y;y<g.y+g.h;y++){const edge=x===g.x||x===g.x+g.w-1||y===g.y||y===g.y+g.h-1;if(edge&&!(y===g.y+g.h-1&&x===g.x+Math.floor(g.w/2)))drawSpr(fenceSpr((x<g.x+g.w-1&&(y===g.y||y===g.y+g.h-1)?1:0)|(x>g.x&&(y===g.y||y===g.y+g.h-1)?2:0)|(y>g.y&&(x===g.x||x===g.x+g.w-1)?4:0)),x*TS+8,y*TS+17)}break;
  case'dock':case'sandbar':g.tiles.forEach(([x,y])=>bx.drawImage(tileSpr(g.t==='dock'?BRIDGE:SAND,0,0,0),x*TS,y*TS));break;
  case'tree':drawSpr(treeSpr(g.k==='date'?'palm':'fruit',0,0),cx,by+(g.k==='date'?1:4));break;
  case'animal':drawSpr(animSpr(g.k,0),cx,by+1);break;
  case'house':drawSpr(AT[g.spr]?AT[g.spr][0]:homeSpr(2),cx,by+1);break;
  case'beehive':drawSpr(objSpr('hive'),cx,by+1);break;
  case'bush':drawSpr(AT.bush?AT.bush_berry[0]:objSpr('bush'),cx,by+3);break;
  default:drawSpr(objSpr(g.t),cx,by)}
 bx.globalAlpha=1}
function drawPerson(){const p=player,px=p.x*TS,py=p.y*TS,A=k=>AT['adam_'+k];let an,fr=0,flip=false;shadow(px,py,5);
 if(!A('idle')){drawSpr(charSpr(LOOK_ADAM,p.fy<0?1:p.fx?2:0,0,0),px,py+2,p.fx>0);return}
 if(fish){an=A(fish.ph==='game'?'reeling':'waiting');fr=Math.floor(GT*8)%an.length;flip=p.side<0}
 else if(p.toolT>0){an=A({axe:'axe',pick:'mining',rod:'casting',hand:'doing'}[p.toolId]||'doing');fr=Math.floor((1-p.toolT/p.toolD)*an.length);flip=p.side<0}
 else if(p.moving){if(p.fx){an=A('walk');flip=p.fx<0}else an=A(p.fy<0?'walk_n':'walk_s');fr=Math.floor(p.anim*14)%an.length}
 else{if(p.fx){an=A('idle');flip=p.fx<0}else an=A(p.fy<0?'idle_n':'idle_s');fr=Math.floor(GT*6)%an.length}
 drawSpr(an[clamp(fr,0,an.length-1)],px,py+18,flip)}
function render(){const bw=buf.width,bh=buf.height;bx.setTransform(1,0,0,1,0,0);bx.fillStyle='#3a9ad9';bx.fillRect(0,0,bw,bh);if(!tiles)return;
 camX=Math.round(clamp(camFX-bw/2,-TS*2,Math.max(0,W*TS-bw+TS*2)));camY=Math.round(clamp(camFY-bh/2,-TS*2,Math.max(0,H*TS-bh+TS*2)));
 const x0=Math.floor(camX/TS)-1,x1=Math.ceil((camX+bw)/TS)+1,y0=Math.floor(camY/TS)-1,y1=Math.ceil((camY+bh)/TS)+4;bx.translate(-camX,-camY);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const ib=inb(x,y),i=ib?idx(x,y):-1,t=ib?tiles[i]:WATER;bx.drawImage(tileSpr(t,Math.floor(hash(x,y)*4),0,0),x*TS,y*TS);
  if(t===WATER){const land=(xx,yy)=>inb(xx,yy)&&tiles[idx(xx,yy)]!==WATER;const f=.45+.3*Math.sin(GT*2+x*.7+y*.4);bx.fillStyle='rgba(255,255,255,'+f+')';if(land(x,y-1))bx.fillRect(x*TS,y*TS+Math.round(1+Math.sin(GT*2+x)),TS,2);if(land(x-1,y))bx.fillRect(x*TS+1,y*TS,2,TS);if(land(x+1,y))bx.fillRect(x*TS+13,y*TS,2,TS);if(land(x,y+1))bx.fillRect(x*TS,y*TS+13,TS,2);
   if(hash(x+7,y+3)<.12){bx.fillStyle='rgba(255,255,255,'+(.25+.3*Math.sin(GT*1.5+x))+')';bx.fillRect(x*TS+4+Math.round(Math.sin(GT+y)*2),y*TS+8,5,1)}}
  else if(t===TILLED){bx.fillStyle='#5e3a1e';if(tiles[i-W]!==TILLED)bx.fillRect(x*TS,y*TS,TS,1);if(tiles[i+W]!==TILLED)bx.fillRect(x*TS,y*TS+15,TS,1);if(tiles[i-1]!==TILLED)bx.fillRect(x*TS,y*TS,1,TS);if(tiles[i+1]!==TILLED)bx.fillRect(x*TS+15,y*TS,1,TS)}
  else if(t===SAND&&ib&&!tileOpen(x,y)&&locOf[i]<0){bx.fillStyle='rgba(30,70,40,.25)';bx.fillRect(x*TS,y*TS,TS,TS)}}
 // overgrowth over locked places
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const l=locAt(x,y);if(!l||isOpenLoc(l))continue;const far=l.a>state.area;bx.fillStyle=far?'rgba(14,40,28,.72)':'rgba(20,58,32,.5)';bx.fillRect(x*TS,y*TS,TS,TS)}
 if(buildSel&&!titleOpen){bx.strokeStyle='rgba(255,255,255,.2)';bx.lineWidth=1;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(inb(x,y)&&tileOpen(x,y)&&locOf[idx(x,y)]>=0)bx.strokeRect(x*TS+.5,y*TS+.5,TS-1,TS-1)}
 const D=[];for(let y=Math.max(0,y0);y<=Math.min(H-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(W-1,x1);x++){const o=objs[idx(x,y)];if(o&&o.t!=='block'&&tileOpen(x,y))D.push([y+.99,0,o,x,y])}
 for(let y=Math.max(0,y0);y<=Math.min(H-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(W-1,x1);x++){const l=locAt(x,y);if(l&&!isOpenLoc(l)&&hash(x*5+1,y*3+7)<.55)D.push([y+.5,4,x,y,l.a>state.area])}
 for(const l of LOCS){if(isOpenLoc(l)||l.a>state.area)continue;const [lx,ly,lw,lh]=l.r;D.push([ly+lh/2+.9,5,l])}
 for(const g of GHOSTS){if(state.bought[g.key]||!isOpenLoc(g.loc))continue;if(g.x<x0-3||g.x>x1+3||g.y<y0-2||g.y>y1+3)continue;D.push([g.t==='bed'||g.t==='pen'||g.t==='dock'||g.t==='sandbar'?g.y-.5:g.y+.98,6,g])}
 const inV=e=>e.x>x0-2&&e.x<x1+3&&e.y>y0-1&&e.y<y1+3;for(const a of animals)if(isOpenLoc(a.loc)&&inV(a))D.push([a.y,1,a]);for(const n of NPCS)if(tileOpen(Math.floor(n.x),Math.floor(n.y)))D.push([n.y,2,n]);if(!titleOpen)D.push([player.y,3]);D.sort((a,b)=>a[0]-b[0]);
 const thick=[AT.bush&&AT.bush[0],AT.shrub&&AT.shrub[0],AT.pine_s&&AT.pine_s[0]].filter(Boolean);
 for(const d of D){if(d[1]===0)drawObj(d[2],d[3],d[4]);
  else if(d[1]===4){const s=thick[Math.floor(hash(d[2],d[3])*thick.length)];if(s){if(d[4])bx.globalAlpha=.55;drawSpr(s,d[2]*TS+8+Math.round(hash(d[3],d[2])*6-3),d[3]*TS+16);bx.globalAlpha=1}}
  else if(d[1]===5){const l=d[2],[lx,ly,lw,lh]=l.r;const cx=(lx+lw/2)*TS,by=(ly+lh/2+1)*TS;shadow(cx,by-1,8);drawSpr(objSpr('sign'),cx,by)}
  else if(d[1]===6)drawGhost(d[2]);
  else if(d[1]===1){const a=d[2],mv=a.vx||a.vy,s=animSpr(a.id,mv?Math.floor(a.bob*6)%2+1:0);shadow(a.x*TS,a.y*TS-1,Math.max(4,s.width*.3));drawSpr(s,a.x*TS,a.y*TS+1+(a.id==='butterfly'?Math.round(Math.sin(GT*3+a.bob)*3)-8:0),a.face);
   if(a.pet&&PROD[a.id]&&now()>=a.rd)bubble(a.x*TS,a.y*TS-s.height+2,'!');else if(!petName(a))bubble(a.x*TS,a.y*TS-s.height+2,'?','#3a6ad9')}
  else if(d[1]===2){const n=d[2],b=Math.round(Math.sin(GT*1.8+n.x)*1.5),x=n.x*TS,y=n.y*TS;shadow(x,y,7);const af=AT['ang_'+n.id];if(af){drawSpr(af[Math.floor(GT*5+n.x)%af.length],x,y+16+b);drawSpr(haloSpr(),x,y-21+b)}else{drawSpr(shamarSpr(n.id),x,y-3+b);drawSpr(haloSpr(),x,y-28+b)}}else drawPerson()}
 if(fish&&fish.ph!=='game'){const fx=fish.x*TS,fy=fish.y*TS+Math.sin(GT*4)+(fish.ph==='bite'?Math.sin(GT*30)*1.5:0);bx.fillStyle='#fff';bx.fillRect(fx-1,fy-1,3,3);bx.fillStyle='#d93a2e';bx.fillRect(fx-1,fy-2,3,1);if(fish.ph==='bite')bubble(player.x*TS,player.y*TS-30,'!')}
 for(const p of parts){if(p.heart){bx.globalAlpha=clamp(p.life,0,1);bx.fillStyle='#ff5a7a';const hx=Math.round(p.x*TS),hy=Math.round(p.y*TS);bx.fillRect(hx-3,hy-2,2,2);bx.fillRect(hx+1,hy-2,2,2);bx.fillRect(hx-3,hy,6,2);bx.fillRect(hx-2,hy+2,4,1);bx.fillRect(hx-1,hy+3,2,1);continue}bx.globalAlpha=clamp(p.life*2,0,1);bx.fillStyle=p.col;bx.fillRect(Math.round(p.x*TS),Math.round(p.y*TS),2,2)}bx.globalAlpha=1;
 // item pops (icon rising above the player, MMF style)
 for(const p of pops){const k=1.4-p.life;bx.globalAlpha=clamp(p.life*2,0,1);const x=Math.round(p.x*TS)-6,y=Math.round(p.y*TS-k*14)-p.off*2;bx.fillStyle='rgba(255,255,255,.85)';bx.fillRect(x-1,y-1,14,14);bx.drawImage(icon(p.id),x,y,12,12)}bx.globalAlpha=1;
 bx.setTransform(1,0,0,1,0,0);
 if(fish&&fish.ph==='game'){const g=fish.g,H2=Math.min(96,bh-40),x=clamp(Math.round(player.x*TS-camX)+16,4,bw-34),y=clamp(Math.round(player.y*TS-camY)-H2+10,20,bh-H2-4),ih=H2-6;bx.fillStyle='#2c1608';bx.fillRect(x-2,y-2,30,H2+4);bx.fillStyle='#a87444';bx.fillRect(x-1,y-1,28,H2+2);bx.fillStyle='#2c4a6a';bx.fillRect(x+3,y+3,12,ih);bx.fillStyle=(g.fy>=g.by&&g.fy<=g.by+g.bh)?'#7cf05a':'#5ac040';bx.fillRect(x+4,y+3+Math.round(g.by*ih),10,Math.max(4,Math.round(g.bh*ih)));bx.drawImage(icon(fish.id),x+3,y+3+Math.round(g.fy*ih)-6,12,12);bx.fillStyle='#2c1608';bx.fillRect(x+18,y+3,6,ih);const ph=Math.round(clamp(g.prog,0,1)*(ih-2));bx.fillStyle=g.prog>.66?'#5ad040':g.prog>.33?'#e8c020':'#e04020';bx.fillRect(x+19,y+3+ih-1-ph,4,ph)}
 ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(buf,0,0,bw*SC,bh*SC);if(titleOpen)return;
 ctx.textAlign='center';ctx.textBaseline='middle';const fs=Math.max(10,Math.round(SC*4.2));ctx.lineJoin='round';ctx.strokeStyle='#1b1410';const tx=(wx,wy,txt,col,sz)=>{const z=sz||fs;ctx.font=`700 ${z}px 'Pixelify Sans',monospace`;ctx.lineWidth=Math.max(3,z*.28);const sx=(wx*TS-camX)*SC,sy=(wy*TS-camY)*SC;if(sx<-200||sx>cw+200||sy<-50||sy>ch+50)return;ctx.strokeText(txt,sx,sy);ctx.fillStyle=col;ctx.fillText(txt,sx,sy)};
 for(const l of LOCS){if(isOpenLoc(l))continue;const [lx,ly,lw,lh]=l.r;if(l.a>state.area){if(l.c===0)tx(lx+lw/2,ly+lh/2,'Area '+l.a,'rgba(255,255,255,.75)',fs*1.5);continue}tx(lx+lw/2,ly+lh/2-.6,l.n,'#fff',fs*.95);tx(lx+lw/2,ly+lh/2+1.55,'✦ '+fmt(l.c),state.bless>=l.c?'#9cff7a':'#ffd36a',fs*1.05)}
 for(const g of GHOSTS){if(state.bought[g.key]||!isOpenLoc(g.loc))continue;const gx=g.t==='bed'||g.t==='pen'?g.x+g.w/2:g.tiles?g.tiles[0][0]+.5:g.x+.5,gy=g.t==='bed'||g.t==='pen'?g.y+g.h/2:g.tiles?g.tiles[0][1]+.3:g.y-(g.t==='house'?2.2:g.t==='tree'?1.9:.4);if(Math.abs(gx-player.x)>9||Math.abs(gy-player.y)>12)continue;
  if(g.t==='house'){const p=areaPct(g.loc.a);tx(gx,gy,p>=80?'✦ '+fmt(g.c):'🔒 80%',p>=80?(canPay(g.need,g.c)?'#9cff7a':'#ffd36a'):'#fff',fs);continue}tx(gx,gy,'✦'+fmt(g.c),canPay(g.need,g.c)?'#9cff7a':'#ffd36a',fs*.9)}
 for(const f of floats){ctx.globalAlpha=clamp(f.life*1.5,0,1);tx(f.x,f.y,f.txt,f.col)}ctx.globalAlpha=1;
 for(const p of pops){if(p.n<2)continue;const k=1.4-p.life;ctx.globalAlpha=clamp(p.life*2,0,1);tx(p.x+.55,p.y-k*.9+.05-p.off*.12,'×'+p.n,'#fff',fs*.8)}ctx.globalAlpha=1;
 for(const a of animals){if(!isOpenLoc(a.loc)||!inV(a))continue;const nm=petName(a);if(nm&&Math.hypot(a.x-player.x,a.y-player.y)<2.4)tx(a.x,a.y-animSpr(a.id,0).height/TS-.9,nm,'#ffe9a8',fs*.85)}
 for(const n of NPCS)if(Math.hypot(n.x-player.x,n.y-player.y)<3.5)tx(n.x,n.y-2.3,n.name,'#d6e6ff',fs*.85)}

// ================= BOOT =================
let confirmNew=false;
function titleScreen(){titleOpen=true;updateControlsVis();const tb=$('#tbtns');tb.innerHTML='';const sv=hasSave();const mk=(t,fn,alt)=>{const b=document.createElement('button');b.className='btn big'+(alt?' alt':'');b.textContent=t;b.onclick=()=>{ensureAudio();fn(b)};tb.appendChild(b)};
 if(sv)mk('Continue',()=>{if(!load()){newGame();startPlay(true)}else startPlay(false)});mk(sv?'New Island':'Start',b=>{if(sv&&!confirmNew){confirmNew=true;b.textContent='Tap again to erase';return}newGame();startPlay(true)},sv)}
function startPlay(fresh){titleOpen=false;$('#title').style.display='none';updateControlsVis();snapCam();updateHUD();
 if(fresh)runDialog([{s:'god',t:'And the LORD God planted a garden eastward in Eden; and there he put the man whom he had formed.',ref:'Genesis 2:8'},{s:'god',t:'This little island is yours to dress and to keep. Grow it a little each day, at your own pace.'},{s:'narr',t:'Drag anywhere to walk. Walk into things to gather them, and keep pushing into trees and rocks. Walk through the golden wheat to harvest it.'}]);else{banner('Day '+state.day);toast('Welcome back! Your crops kept growing while you were away.')}}
function loop(t){const dt=Math.min(.05,(t-(loop.l||t))/1000);loop.l=t;try{update(dt);render()}catch(e){console.error(e)}requestAnimationFrame(loop)}
function boot(){cv=$('#c');ctx=cv.getContext('2d');buf=mkc(10,10);bx=buf.getContext('2d');resize();addEventListener('resize',resize);state=freshState();genWorld();for(const g of GHOSTS)if(g.t==='bed'&&g.loc.id==='field')applyGhost(g,true);state.open={home:1,field:1,orchard:1,ranch:1};player=mkPlayer(HOME.x+.5,HOME.y+1.6);residents();spawnAnimals();camFX=26*TS;camFY=56*TS;setupInput();titleScreen();requestAnimationFrame(loop);
 try{if('serviceWorker' in navigator&&location.protocol==='https:'&&window.self===window.top&&!/claude|anthropic/.test(location.hostname))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
 window.EDEN={get state(){return state},get player(){return player},get animals(){return animals},get fish(){return fish},objs:()=>objs,tiles:()=>tiles,LOCS,GHOSTS,getPrompt,work,stepOn,give,openLoc,buyGhost,newDay,save,load,tryPlace,explore,areaPct,NPCS,get home(){return HOME},set build(v){buildSel=v},fixReqs,reel,castRod,now}}
loadAtlas(boot);
})();
