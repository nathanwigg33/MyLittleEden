import base64
old=open('/home/claude/eden/index.html').read()
def sl(a,b):
    i=old.index(a); j=old.index(b,i); return old[i:j]
head=old[:old.index('<style>')]
head=head.replace('A pixel-art farming game set in the Garden of Eden.','A cozy little island farm in the Garden of Eden.')
head=head.replace('<link rel="preconnect" href="https://fonts.googleapis.com">\n','').replace('<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&display=swap" rel="stylesheet">\n','')
head=head.replace('Eden: The First Garden','Eden: The Little Garden').replace('#2b1a0e','#3a9ad9')
f4=base64.b64encode(open('/tmp/fnt/package/files/pixelify-sans-latin-400-normal.woff2','rb').read()).decode()
f7=base64.b64encode(open('/tmp/fnt/package/files/pixelify-sans-latin-700-normal.woff2','rb').read()).decode()
css='''<style>
@font-face{font-family:'Pixelify Sans';font-weight:400;src:url(data:font/woff2;base64,%s) format('woff2')}
@font-face{font-family:'Pixelify Sans';font-weight:600 800;src:url(data:font/woff2;base64,%s) format('woff2')}
*{box-sizing:border-box}
html,body{margin:0;height:100%%;overflow:hidden;background:#3a9ad9;color:#3b2a1e;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;font-family:'Pixelify Sans',ui-monospace,monospace;overscroll-behavior:none}
#c{position:fixed;inset:0;width:100vw;height:100vh;display:block;image-rendering:pixelated}
.ol{color:#fff;text-shadow:2px 0 #1b1410,-2px 0 #1b1410,0 2px #1b1410,0 -2px #1b1410,2px 2px #1b1410,-2px -2px #1b1410,2px -2px #1b1410,-2px 2px #1b1410}
.hp{background:rgba(24,20,18,.78);border:2px solid #fff;border-radius:12px;box-shadow:0 3px 0 rgba(0,0,0,.35);color:#fff}
#hud{position:fixed;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;padding:calc(env(safe-area-inset-top) + 8px) calc(env(safe-area-inset-right) + 8px) 0 calc(env(safe-area-inset-left) + 8px);pointer-events:none;z-index:5;gap:8px}
#topL{display:flex;flex-direction:column;gap:6px;pointer-events:auto;max-width:64vw}
#coins{display:flex;align-items:center;gap:7px;padding:4px 12px 4px 6px;font-size:22px;font-weight:700;align-self:flex-start}
#coins .ci{width:24px;height:24px;border-radius:50%%;background:radial-gradient(circle at 35%% 30%%,#fff7b0,#ffd23a 45%%,#d99a10);border:2px solid #7a4a00;display:flex;align-items:center;justify-content:center;font-size:13px;color:#7a4a00}
#coins.pulse{animation:pl .35s}
@keyframes pl{40%%{transform:scale(1.12)}}
#aBox{padding:6px 10px 7px;min-width:190px;cursor:pointer}
#aTop{display:flex;justify-content:space-between;font-size:14px;font-weight:700;gap:10px}
.pbar{height:9px;background:#3b2a1e;border-radius:5px;overflow:hidden;margin-top:4px;box-shadow:inset 0 0 0 1px #000}
.pbar i{display:block;height:100%%;background:linear-gradient(#9cff7a,#3fbf3a);transition:width .4s}
#xPct{font-size:11px;opacity:.85;margin-top:3px}
#tracker{font-size:13px;padding:5px 10px;background:rgba(255,248,226,.94);color:#3b2a1e;border:2px solid #3b2a1e;border-radius:10px;align-self:flex-start;box-shadow:0 3px 0 rgba(0,0,0,.25)}
#tracker:before{content:'➤ ';color:#e8392b}
#topR{display:flex;flex-direction:column;gap:8px;pointer-events:auto}
.rb{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer}
#ebox{position:fixed;left:calc(env(safe-area-inset-left) + 8px);bottom:calc(env(safe-area-inset-bottom) + 10px);display:flex;align-items:center;gap:6px;padding:5px 10px;font-size:14px;font-weight:700;z-index:5;pointer-events:none}
#eBar{width:90px;height:10px;background:#3b2a1e;border-radius:5px;overflow:hidden;box-shadow:inset 0 0 0 1px #000}#eFill{height:100%%;transition:width .3s}
#joy{position:fixed;width:100px;height:100px;border-radius:50%%;border:3px solid rgba(255,255,255,.55);background:rgba(0,0,0,.12);display:none;pointer-events:none;z-index:4}
#knob{position:absolute;left:28px;top:28px;width:38px;height:38px;border-radius:50%%;background:rgba(255,255,255,.8);border:3px solid rgba(27,20,16,.6)}
#prompt{position:fixed;left:50%%;bottom:calc(env(safe-area-inset-bottom) + 52px);transform:translate(-50%%,30px);opacity:0;pointer-events:none;transition:all .15s;z-index:8;display:flex;align-items:center;gap:10px;padding:8px 10px 8px 8px;background:#fff8e2;border:3px solid #3b2a1e;border-radius:14px;box-shadow:0 4px 0 rgba(0,0,0,.3);width:min(370px,94vw)}
#prompt.on{transform:translate(-50%%,0);opacity:1;pointer-events:auto}
#prompt>img{width:44px;height:44px;object-fit:contain;image-rendering:pixelated;background:#f0e2bc;border-radius:8px;padding:2px;flex:none}
#prompt .pm{flex:1;min-width:0}
#prompt .pt{font-weight:700;font-size:16px}
#prompt .ps{font-size:13px;opacity:.9;display:flex;flex-wrap:wrap;gap:2px 8px;align-items:center}
#prompt .ps span{display:inline-flex;align-items:center;gap:2px;font-weight:700}#prompt .ps img{width:16px;height:16px;image-rendering:pixelated}
#prompt .pb{display:flex;flex-direction:column;gap:4px}
.have{color:#2a8a1a}.lack{color:#c0281a}
#pickups{display:none}
#toasts{position:fixed;left:50%%;transform:translateX(-50%%);top:28%%;display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:none;z-index:7;width:92vw}
.toast{padding:6px 12px;font-size:14px;max-width:360px;text-align:center;animation:pin .2s;background:rgba(24,20,18,.85);color:#fff;border:2px solid #fff;border-radius:10px}
.toast.tip{background:#fff8e2;color:#3b2a1e;border-color:#3b2a1e}
@keyframes pin{from{opacity:0;transform:translateY(-8px)}to{opacity:1}}
#banner{position:fixed;left:50%%;top:22%%;transform:translate(-50%%,-50%%);font-size:26px;font-weight:700;color:#fff;text-shadow:3px 0 #1b1410,-3px 0 #1b1410,0 3px #1b1410,0 -3px #1b1410,2px 2px #1b1410,-2px -2px #1b1410,2px -2px #1b1410,-2px 2px #1b1410;opacity:0;transition:opacity .6s;pointer-events:none;text-align:center;white-space:nowrap;z-index:6}
#banner.on{opacity:1}
.pn{background:#fff8e2;border:3px solid #3b2a1e;border-radius:14px;box-shadow:0 4px 0 rgba(0,0,0,.3);color:#3b2a1e}
#dialog{position:fixed;left:50%%;transform:translateX(-50%%);bottom:calc(env(safe-area-inset-bottom) + 10px);width:min(620px,96vw);display:none;gap:6px;z-index:20;cursor:pointer;align-items:stretch}
#dialog.on{display:flex}
#dialog .dbox{flex:1;padding:12px 14px 16px;min-height:110px;position:relative}
#dialog .dt{font-size:17px;line-height:1.35}
#dialog .dref{font-size:12px;opacity:.6;margin-top:5px}
#dialog .dch{display:flex;flex-direction:column;gap:5px;margin-top:8px}
#dialog .dch button{font:inherit;font-size:16px;padding:7px 10px;border:2px solid #3b2a1e;background:#fff;border-radius:8px;text-align:left;cursor:pointer}
#dialog .dnext{position:absolute;right:12px;bottom:4px;font-size:14px;color:#e8392b;animation:bob .8s infinite}
@keyframes bob{50%%{transform:translateY(3px)}}
#dialog .dport{width:96px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px}
#dialog .dport canvas{width:76px;height:76px;image-rendering:pixelated;background:#cfe8ff;border:2px solid #3b2a1e;border-radius:8px}
#dialog .dn{font-weight:700;font-size:13px;margin-top:4px;text-align:center}
#dialog.noport .dport{display:none}
#dialog.god .dbox{background:#fffbe8}
#modal{position:fixed;inset:0;background:rgba(10,20,40,.45);display:none;align-items:center;justify-content:center;z-index:30;padding:calc(env(safe-area-inset-top) + 10px) 10px calc(env(safe-area-inset-bottom) + 10px)}
#modal.on{display:flex}
.mcard{width:min(560px,100%%);max-height:100%%;display:flex;flex-direction:column;overflow:hidden}
.mhead{display:flex;align-items:center;gap:4px;padding:6px;background:#ffd36a;border-bottom:3px solid #3b2a1e}
.tabs{display:flex;gap:4px;flex:1;overflow-x:auto;scrollbar-width:none}
.tab{padding:6px 11px;font-size:15px;font-weight:700;cursor:pointer;border-radius:9px;white-space:nowrap;color:#7a4a10}
.tab.on{background:#fff8e2;color:#3b2a1e;box-shadow:inset 0 0 0 2px #3b2a1e}
.x{width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;font-weight:700;color:#fff;background:#e8392b;border:2px solid #3b2a1e;border-radius:10px;flex:none}
.mbody{padding:10px;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;font-size:15px;line-height:1.35}
.grid{display:grid;grid-template-columns:repeat(auto-fill,46px);gap:4px;justify-content:center}
.slot{width:46px;height:46px;background:#fff;border:2px solid #d9c49a;border-radius:8px;position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer}
.slot img{width:32px;height:32px;image-rendering:pixelated;pointer-events:none}
.slot .n{position:absolute;right:3px;bottom:0;font-size:13px;font-weight:700;color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000}
.slot.sel{border-color:#e8392b}
.h3{font-weight:700;font-size:16px;margin:12px 0 6px}
.h3:first-child{margin-top:0}
.big{font-size:40px;font-weight:700}
.row{display:flex;align-items:center;gap:8px;padding:7px;background:#fff;border:2px solid #e3d2a8;border-radius:10px;margin-bottom:6px}
.row.rush{border-color:#e8392b;background:#fff1ea}
.row img{width:34px;height:34px;image-rendering:pixelated;flex:none}
.row .grow{flex:1;min-width:0}
.row .t1{font-weight:700;font-size:15px}
.row .t2{font-size:13px;opacity:.85}
.gold{color:#b07a00}
.have-coins{display:inline-block;margin-bottom:8px;padding:3px 10px;background:#3b2a1e;color:#ffd75a;border-radius:8px;font-weight:700}
.req{font-size:13px}
.btn{font:inherit;font-size:15px;font-weight:700;padding:7px 13px;border:2px solid #1f5a1a;background:linear-gradient(#7ce06a,#45b43a);color:#fff;text-shadow:1px 1px 0 #1f5a1a;cursor:pointer;white-space:nowrap;border-radius:10px;box-shadow:0 3px 0 #1f5a1a}
.btn:active{transform:translateY(2px);box-shadow:0 1px 0 #1f5a1a}
.btn:disabled{background:#c9c2b2;border-color:#8a8272;box-shadow:0 3px 0 #8a8272;text-shadow:none;color:#f4f0e6}
.btn.alt{background:#fff;color:#3b2a1e;border-color:#3b2a1e;box-shadow:0 3px 0 #3b2a1e;text-shadow:none}
.btn.big{font-size:22px;padding:10px 30px;margin:6px;min-width:200px}
.detail{background:#fff;border:2px solid #d9c49a;border-radius:10px;padding:8px;margin-top:8px;display:flex;gap:10px;align-items:center}
.detail img{width:40px;height:40px;image-rendering:pixelated}
.muted{opacity:.7;font-size:13px}
input.name{font:inherit;font-size:18px;padding:8px 10px;border:2px solid #3b2a1e;background:#fff;width:100%%;-webkit-user-select:text;user-select:text;border-radius:10px}
#buildBar{position:fixed;left:50%%;transform:translateX(-50%%);bottom:calc(env(safe-area-inset-bottom) + 56px);display:none;align-items:center;gap:10px;padding:6px 8px 6px 12px;z-index:6;font-weight:700;font-size:15px;white-space:nowrap}
#title{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:20px 20px calc(env(safe-area-inset-bottom) + 50px);text-align:center;background:linear-gradient(rgba(255,255,255,0) 40%%,rgba(20,40,70,.35))}
#logo{position:absolute;top:calc(env(safe-area-inset-top) + 13vh);left:0;right:0}
#title h1{font-size:min(20vw,96px);margin:0;letter-spacing:4px;color:#ffd75a;text-shadow:5px 0 #3b2a1e,-5px 0 #3b2a1e,0 5px #3b2a1e,0 -5px #3b2a1e,4px 4px #3b2a1e,-4px -4px #3b2a1e,4px -4px #3b2a1e,-4px 4px #3b2a1e,0 9px 0 rgba(0,0,0,.3);font-weight:700}
#title h2{font-weight:700;font-size:24px;margin:4px 0 0}
#title .tip{font-size:13px;color:#fff;margin-top:12px;max-width:320px;text-shadow:1px 1px 0 #000}
#fade{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 1s;z-index:35}
#fade.on{opacity:1}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="hud">
 <div id="topL">
  <div id="coins" class="hp"><span class="ci">✦</span><span id="coinN">0</span></div>
  <div id="aBox" class="hp"><div id="aTop"><span id="aName"></span><span id="aPct"></span></div><div class="pbar"><i id="aFill"></i></div><div id="xPct"></div></div>
  <div id="tracker"></div>
 </div>
 <div id="topR"><div class="hp rb" id="bBag" title="Bag">🎒</div><div class="hp rb" id="bBuild" title="Decorate">🔨</div><div class="hp rb" id="bBook" title="Exploration">📖</div></div>
</div>
<div id="ebox" class="hp">⚡<div id="eBar"><div id="eFill"></div></div><span id="eNum"></span></div>
<div id="pickups"></div><div id="toasts"></div><div id="banner"></div>
<div id="joy"><div id="knob"></div></div>
<div id="prompt"><img alt=""><div class="pm"><div class="pt"></div><div class="ps"></div></div><div class="pb"></div></div>
<div id="buildBar" class="pn"><span></span><button class="btn" id="buildDone">Done</button></div>
<div id="dialog"><div class="dbox pn"><div class="dt"></div><div class="dref"></div><div class="dch"></div><div class="dnext">▼</div></div><div class="dport pn"><canvas id="portC" width="40" height="40"></canvas><div class="dn"></div></div></div>
<div id="modal"><div class="mcard pn"><div class="mhead"><div class="tabs"></div><div class="x" id="mx">✕</div></div><div class="mbody"></div></div></div>
<div id="title">
 <div id="logo"><h1>EDEN</h1><h2 class="ol">~ The Little Garden ~</h2></div>
 <div id="tbtns"></div>
 <div class="tip">Tip: On iPhone tap Share → Add to Home Screen to play full screen. Your island saves on this device.</div>
</div>
<div id="fade"></div>
<script>
'''%(f4,f7)
js=open('/home/claude/eden/mmf.js').read()
js=js.replace('/*@AUDIO@*/',sl('// =============== AUDIO & MUSIC','// =============== PIXEL SPRITE ENGINE'))
js=js.replace('/*@SPRITES@*/',sl('// =============== PIXEL SPRITE ENGINE','// =============== FX & UI HELPERS'))
js=js.replace('/*@FX@*/',sl('// =============== FX & UI HELPERS','// =============== DIALOG'))
js=js.replace('/*@DIALOG@*/',sl('// =============== DIALOG','// =============== QUESTS'))
out=head+css+js+'\n</script>\n</body>\n</html>\n'
open('/home/claude/eden/mmf.html','w').write(out);print(len(out))
