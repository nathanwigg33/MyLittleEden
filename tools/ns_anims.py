"""Front (facing down) and back (facing up) tool animations, built from the pack's own pixels.

The art pack only animates tools from the side. Here each tool is lifted from a side frame where it is held
upright (axe 185, pickaxe 195, hoe 307, scythe 240, watering can 125), then placed in the hands of the front-
and back-facing body: raised overhead, swung with a white swoosh arc, and struck on the tile you face with a
little impact spark. Frames line up 1:1 with the side animations so timing and hit moments stay the same.
"""
import math
from PIL import Image

O = (24, 20, 37, 255)                      # pack outline
SKIN, SKIN_D = (232, 173, 125, 255), (200, 127, 91, 255)
ARC_HI, ARC_LO = (240, 244, 250), (192, 203, 220)
STAR_Y, STAR_W = (255, 222, 90, 255), (255, 252, 214, 255)
WATER = [(0, 149, 233, 255), (44, 232, 245, 255)]
SKINS = {(229, 174, 120), (232, 173, 125), (232, 172, 125), (232, 172, 124), (233, 173, 125), (200, 127, 91)}

def biggest_part(im):
    """keep only the largest connected blob (drops loose dirt bits from the hoe frame)"""
    w, h = im.size; px = im.load(); seen = set(); best = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 or (x, y) in seen: continue
            st, comp = [(x, y)], []; seen.add((x, y))
            while st:
                cx, cy = st.pop(); comp.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3]:
                            seen.add((nx, ny)); st.append((nx, ny))
            if len(comp) > len(best): best = comp
    out = Image.new('RGBA', im.size)
    for p in best: out.putpixel(p, px[p])
    return out.crop(out.getbbox())

def hand_anchor(im):
    """where the hand is in a tool sprite (centre of its skin pixels)"""
    pts = [(x, y) for y in range(im.height) for x in range(im.width) if im.getpixel((x, y))[3] and im.getpixel((x, y))[:3] in SKINS]
    if not pts: return (im.width // 2, im.height - 2)
    return (round(sum(p[0] for p in pts) / len(pts)), round(sum(p[1] for p in pts) / len(pts)))

def stamp(dst, spr, anchor, at):
    dst.alpha_composite(spr, (at[0] - anchor[0], at[1] - anchor[1]))

def hand(dst, x, y):
    for dx in range(-1, 2):
        for dy in range(-1, 2): dst.putpixel((x + dx, y + dy), O)
    dst.putpixel((x, y), SKIN)

def arc(dst, cx, cy, r, a0, a1, w=3):
    """a swoosh: a crescent along a circle from angle a0 to a1 (degrees, 0 = up, clockwise), bright at the leading end"""
    steps = int(abs(a1 - a0) * r / 40) + 12
    for i in range(steps + 1):
        k = i / steps; a = math.radians(a0 + (a1 - a0) * k); th = 1 + round((w - 1) * math.sin(math.pi * min(1, k * 1.2)))
        for d in range(th):
            x, y = round(cx + math.sin(a) * (r - d)), round(cy - math.cos(a) * (r - d))
            if 0 <= x < dst.width and 0 <= y < dst.height:
                c = ARC_HI if d < th - 1 or th == 1 else ARC_LO
                dst.putpixel((x, y), c + (int(90 + 165 * k),))

def star(dst, x, y, big=True):
    pts = [(0, 0, STAR_W), (1, 0, STAR_Y), (-1, 0, STAR_Y), (0, 1, STAR_Y), (0, -1, STAR_Y)]
    if big: pts += [(2, 0, STAR_Y), (-2, 0, STAR_Y), (0, 2, STAR_Y), (0, -2, STAR_Y), (2, -2, STAR_Y), (-2, 2, STAR_Y), (2, 2, STAR_Y), (-2, -2, STAR_Y)]
    for dx, dy, c in pts:
        if 0 <= x + dx < dst.width and 0 <= y + dy < dst.height: dst.putpixel((x + dx, y + dy), c)

def drops(dst, x, y, n, t):
    for i in range(n):
        dx, dy = (i * 3) % 5 - 2, ((i * 5 + t * 3) % 7)
        dst.putpixel((x + dx, y + dy), WATER[i % 2])

def build(ASE, fr, TAG):
    """returns {anim_key: {layer: [frames]}} for axe_s, axe_n, mining_s, … watering_n"""
    W, H = 96, 64
    body_s, body_n = fr(TAG['idle-s'][1], ('base',)), fr(TAG['idle-n'][1], ('base',))
    HAIRS = ['short', 'long', 'curly', 'bowl', 'mop', 'spikey']
    hair_s = {h: fr(TAG['idle-s'][1], (h + ' hair',)) for h in HAIRS}
    hair_n = {h: fr(TAG['idle-n'][1], (h + ' hair',)) for h in HAIRS}

    def no_side_hands(b):
        b = b.copy()
        for x in (44, 52): b.putpixel((x, 33), (0, 0, 0, 0))
        for x in (45, 51): b.putpixel((x, 33), O)
        return b
    bs_free, bn_free = no_side_hands(body_s), no_side_hands(body_n)

    def lift(f):   # the tool (and the hand holding it) from a side frame, upright
        im = fr(f, ('tools', 'tools rear')); return biggest_part(im.crop(im.getbbox()))
    TOOLS = {'axe': lift(185), 'mining': lift(195), 'dig': lift(307), 'attack': lift(240)}
    can = fr(125, ('tools', 'tools rear')); can = can.crop(can.getbbox())

    def tool_up(k): s = TOOLS[k]; return s, hand_anchor(s)
    def tool_down(k):
        s = TOOLS[k].transpose(Image.FLIP_TOP_BOTTOM); return s, hand_anchor(s)
    def tool_side(k, right=True):   # lying sideways, head pointing out
        s = TOOLS[k].transpose(Image.ROTATE_270 if right else Image.ROTATE_90); return s, hand_anchor(s)

    out = {}
    def frame(dir_, pose, kind, t=0):
        """one frame → (body, hair dict, front tool layer, rear tool layer)"""
        front, rear = Image.new('RGBA', (W, H)), Image.new('RGBA', (W, H))
        free = pose not in ('rest',)
        body = (bs_free if free else body_s) if dir_ == 's' else (bn_free if free else body_n)
        hairs = hair_s if dir_ == 's' else hair_n
        bob = 1 if pose in ('strike', 'hold') else -1 if pose == 'wind2' else 0
        if kind == 'chop':
            if dir_ == 's':
                if pose == 'rest': s, a = tool_down(K); stamp(front, s, a, (52, 34))
                elif pose == 'wind1': s, a = tool_up(K); stamp(front, s, a, (48, 25))
                elif pose == 'wind2': s, a = tool_up(K); stamp(front, s, a, (48, 22))
                elif pose == 'swing': arc(front, 49, 29, 13, -15, 165, 3); s, a = tool_side(K, True); stamp(front, s, a, (51, 30))
                elif pose in ('strike', 'hold'):
                    s, a = tool_down(K); stamp(front, s, a, (48, 37)); tip = 37 - a[1] + s.height - 3
                    if pose == 'strike': star(front, 48, min(H - 3, tip), True)
                    else: star(front, 45, min(H - 3, tip + 1), False)
                elif pose == 'recover': s, a = tool_down(K); stamp(front, s, a, (50, 33))
            else:
                if pose == 'rest': pass
                elif pose == 'wind1': s, a = tool_down(K); stamp(front, s, a, (48, 23))
                elif pose == 'wind2': s, a = tool_down(K); stamp(front, s, a, (48, 21))
                elif pose == 'swing': arc(rear, 48, 22, 13, 110, -10, 3); s, a = tool_side(K, True); stamp(rear, s, a, (50, 21)); hand(front, 48, 22)
                elif pose in ('strike', 'hold'):
                    s, a = tool_up(K); stamp(rear, s, a, (48, 24)); hand(front, 48, 23); top = 24 - a[1] + 3
                    if pose == 'strike': star(rear, 48, max(2, top), True)
                    else: star(rear, 50, max(2, top - 1), False)
                elif pose == 'recover': s, a = tool_up(K); stamp(rear, s, a, (50, 27))
        elif kind == 'sweep':
            if dir_ == 's':
                if pose == 'rest': s, a = tool_down(K); stamp(front, s, a, (52, 34))
                elif pose == 'wind1': s, a = tool_up(K); stamp(front, s, a, (41, 31))
                elif pose == 'swing': arc(front, 48, 33, 14, 250, 110, 3); s, a = tool_side(K, True); stamp(front, s, a, (54, 35))
                elif pose == 'strike': s, a = tool_side(K, True); stamp(front, s, a, (54, 35)); arc(front, 48, 33, 14, 200, 110, 2)
                elif pose == 'recover': s, a = tool_down(K); stamp(front, s, a, (53, 34))
            else:
                if pose == 'rest': pass
                elif pose == 'wind1': s, a = tool_up(K); stamp(rear, s, a, (42, 30))
                elif pose == 'swing': arc(rear, 48, 26, 16, -70, 70, 3); s, a = tool_up(K); stamp(rear, s, a, (55, 26))
                elif pose == 'strike': s, a = tool_up(K); stamp(rear, s, a, (55, 26)); arc(rear, 48, 26, 16, 10, 70, 2)
                elif pose == 'recover': s, a = tool_up(K); stamp(rear, s, a, (53, 29))
        elif kind == 'pour':
            if dir_ == 's':
                cs = can.crop((0, 0, min(can.width, 13), can.height)); stamp(front, cs, hand_anchor(cs), (50, 34))
                if pose == 'pour':
                    for i in range(5): front.putpixel((58 + i % 2, 36 + (i * 2 + t * 2) % 9), WATER[i % 2])
            else:
                cs = can.crop((0, 0, min(can.width, 13), can.height)); stamp(rear, cs, hand_anchor(cs), (51, 24))
                if pose == 'pour':
                    for i in range(5): rear.putpixel((58 + i % 2, 20 + (i * 2 + t * 2) % 7), WATER[i % 2])
        shift = lambda im: (lambda o: (o.paste(im, (0, bob)), o)[1])(Image.new('RGBA', (W, H))) if bob else im
        return shift(body), {h: shift(hairs[h]) for h in HAIRS}, front, rear

    SEQ = {   # side anim → kind, pose per frame (same frame count as the side animation)
        'axe': ('chop', ['rest', 'wind1', 'wind1', 'wind2', 'swing', 'strike', 'hold', 'hold', 'recover', 'rest']),
        'mining': ('chop', ['rest', 'wind1', 'wind1', 'wind2', 'swing', 'strike', 'hold', 'hold', 'recover', 'rest']),
        'dig': ('chop', ['rest', 'rest', 'wind1', 'wind1', 'wind2', 'wind2', 'swing', 'strike', 'hold', 'hold', 'recover', 'recover', 'rest']),
        'attack': ('sweep', ['rest', 'wind1', 'wind1', 'swing', 'strike', 'strike', 'recover', 'recover', 'rest', 'rest']),
        'watering': ('pour', ['rest', 'pour', 'pour', 'pour', 'rest']),
    }
    for anim, (kind, poses) in SEQ.items():
        K = anim if anim in TOOLS else 'axe'
        globals()['K'] = K
        for d in ('s', 'n'):
            L = {'body': [], 'tool': [], 'toolr': []}
            for h in HAIRS: L['hair_' + h] = []
            for i, pose in enumerate(poses):
                b, hs, f_, r_ = frame(d, pose, kind, i)
                L['body'].append(b); L['tool'].append(f_); L['toolr'].append(r_)
                for h in HAIRS: L['hair_' + h].append(hs[h])
            out[f'{anim}_{d}'] = (L, len(poses))
    # ---- fishing, facing down or up: rod raised overhead, flicked forward, then held out over the water ----
    rod = fr(294, ('tools', 'tools rear'))
    px = rod.load()
    for y in range(rod.height):
        for x in range(rod.width):
            r, g, b_, al = px[x, y]
            if al and r > 170 and g < 110 and b_ < 110: px[x, y] = (0, 0, 0, 0)      # take the red bobber off
    ROD = biggest_part(rod.crop(rod.getbbox()))
    rod_up, rod_dn = ROD, ROD.transpose(Image.FLIP_TOP_BOTTOM)
    rod_side = ROD.transpose(Image.ROTATE_270)
    def far_pixel(spr, anchor, at, pick):   # the rod tip, in canvas coordinates
        pts = [(x, y) for y in range(spr.height) for x in range(spr.width) if spr.getpixel((x, y))[3]]
        x, y = pick(pts); return (at[0] - anchor[0] + x, at[1] - anchor[1] + y)
    OUT_S, OUT_N = (50, 35), (49, 25)
    tips = {'s': far_pixel(rod_dn, hand_anchor(rod_dn), OUT_S, lambda P: max(P, key=lambda q: q[1])),
            'n': far_pixel(rod_up, hand_anchor(rod_up), OUT_N, lambda P: min(P, key=lambda q: q[1]))}
    def fish_frame(d, pose, i):
        front, rear = Image.new('RGBA', (W, H)), Image.new('RGBA', (W, H))
        body = bs_free if d == 's' else bn_free; hairs = hair_s if d == 's' else hair_n
        bob = 1 if pose == 'reel' and i % 2 else 0
        if d == 's':
            if pose == 'wind': stamp(front, rod_up, hand_anchor(rod_up), (48, 24))
            elif pose == 'swing': arc(front, 49, 29, 12, -10, 150, 2); stamp(front, rod_side, hand_anchor(rod_side), (51, 31))
            elif pose in ('out', 'reel'): stamp(front, rod_dn, hand_anchor(rod_dn), (OUT_S[0], OUT_S[1] + bob))
            elif pose == 'yank': stamp(front, rod_up, hand_anchor(rod_up), (49, 25))
        else:
            if pose == 'wind': stamp(front, rod_dn, hand_anchor(rod_dn), (48, 22))
            elif pose == 'swing': arc(rear, 48, 22, 12, 110, -10, 2); stamp(rear, rod_side, hand_anchor(rod_side), (50, 21)); hand(front, 48, 22)
            elif pose in ('out', 'reel'): stamp(rear, rod_up, hand_anchor(rod_up), (OUT_N[0], OUT_N[1] + bob)); hand(front, 48, 23 + bob)
            elif pose == 'yank': stamp(front, rod_dn, hand_anchor(rod_dn), (48, 21))
        shift = lambda im: (lambda o: (o.paste(im, (0, bob)), o)[1])(Image.new('RGBA', (W, H))) if bob else im
        return shift(body), {h: shift(hairs[h]) for h in HAIRS}, front, rear
    FSEQ = {'casting': ['wind'] * 5 + ['swing'] * 2 + ['out'] * 8, 'waiting': ['out'] * 9,
            'reeling': ['reel'] * 13, 'caught': ['out'] * 3 + ['yank'] * 7}
    for anim, poses in FSEQ.items():
        for d in ('s', 'n'):
            L = {'body': [], 'tool': [], 'toolr': []}
            for h in HAIRS: L['hair_' + h] = []
            for i, pose in enumerate(poses):
                b, hs, f_, r_ = fish_frame(d, pose, i)
                L['body'].append(b); L['tool'].append(f_); L['toolr'].append(r_)
                for h in HAIRS: L['hair_' + h].append(hs[h])
            out[f'{anim}_{d}'] = (L, len(poses))
    out['_rodtip'] = tips
    return out
