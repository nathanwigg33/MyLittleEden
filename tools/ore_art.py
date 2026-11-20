"""Hand-built pixel art for the mine: rock nodes with ore showing through, and ore / gem item icons."""
from PIL import Image
import math

INK = (34, 26, 24, 255)
ROCK = [(66, 60, 60), (92, 86, 84), (122, 116, 110), (154, 148, 138), (188, 182, 168)]   # dark → light

def h(x, y, s=0):
    v = math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453
    return v - math.floor(v)

def shape(w, hgt, bumps, seed):
    """an irregular rock outline: an ellipse with a flat-ish base and a few bumps along the top"""
    m = [[0] * w for _ in range(hgt)]
    cx, cy = (w - 1) / 2, hgt * .58
    for y in range(hgt):
        for x in range(w):
            dx, dy = (x - cx) / (w / 2), (y - cy) / (hgt * .58)
            if dy > 0: dy *= 1.35                                       # flatter bottom
            r = 1 + sum(a * math.cos(f * math.atan2(dy, dx) + p) for a, f, p in bumps) + (h(x, y, seed) - .5) * .06
            if dx * dx + dy * dy <= r * r: m[y][x] = 1
    return m

def shade_rock(m, seed, pal=ROCK):
    hgt, w = len(m), len(m[0]); im = Image.new('RGBA', (w, hgt)); P = im.load()
    inside = lambda x, y: 0 <= x < w and 0 <= y < hgt and m[y][x]
    for y in range(hgt):
        for x in range(w):
            if not m[y][x]: continue
            edge = not all(inside(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if edge: P[x, y] = INK; continue
            # light from the top-left: brighter near the top-left edge, darker to the bottom-right
            top = not inside(x, y - 1) or not inside(x, y - 2); left = not inside(x - 1, y) or not inside(x - 2, y)
            v = 3.3 - (x / w) * 1.5 - (y / hgt) * 2.1 + (h(x // 2, y // 2, seed) - .5) * .9
            if top or (left and y < hgt * .6): v += 1.1
            if not inside(x, y + 2) or not inside(x + 2, y): v -= .9
            P[x, y] = pal[max(0, min(4, int(round(v))))] + (255,)
    # a couple of cracks
    for k in range(2):
        x, y = int(w * (.35 + k * .3)), int(hgt * .45)
        for s in range(4):
            if inside(x, y) and P[x, y] != INK: P[x, y] = pal[0] + (255,)
            x += 1 if h(k, s, seed) > .5 else 0; y += 1
    # ground shadow under the rock
    out = Image.new('RGBA', (w, hgt + 2)); sh = Image.new('RGBA', (w, hgt + 2))
    for x in range(1, w - 1): sh.putpixel((x, hgt), (0, 0, 0, 70)); sh.putpixel((x, hgt + 1), (0, 0, 0, 40))
    out.alpha_composite(sh); out.alpha_composite(im); return out, m

def nugget(P, x, y, c, w=3, hh=2):
    """a small shiny lump of metal set into the rock"""
    dark, mid, light = c
    for yy in range(hh + 1):
        for xx in range(w + 1):
            P[x + xx, y + yy] = INK
    for yy in range(hh):
        for xx in range(w):
            P[x + xx, y + yy] = mid + (255,)
    P[x, y] = light + (255,)
    P[x + w - 1, y + hh - 1] = dark + (255,)

def crystal(P, x, base, hgt, c):
    """a 3-wide crystal sticking up out of the rock, with a pointed tip and two faces"""
    dark, mid, light = c
    for yy in range(base - hgt - 1, base + 1):
        for xx in range(x - 1, x + 4): P[xx, yy] = INK
    for yy in range(base - hgt, base):
        P[x, yy] = light + (255,); P[x + 1, yy] = mid + (255,); P[x + 2, yy] = dark + (255,)
    P[x - 1, base - hgt - 1] = (0, 0, 0, 0); P[x + 3, base - hgt - 1] = (0, 0, 0, 0)
    P[x + 1, base - hgt - 1] = INK; P[x, base - hgt] = INK; P[x + 2, base - hgt] = INK; P[x + 1, base - hgt] = light + (255,)
    P[x, base - hgt + 1] = (255, 255, 255, 255)

METAL = {
    'copper': ((122, 58, 30), (205, 110, 58), (250, 176, 112)),
    'iron': ((92, 46, 36), (156, 82, 60), (206, 140, 110)),
    'silver': ((132, 142, 158), (206, 214, 226), (255, 255, 255)),
    'gold': ((176, 112, 22), (242, 192, 52), (255, 240, 150)),
    'coal': ((10, 10, 14), (34, 34, 42), (96, 100, 124)),
}
GEM = {
    'amethyst': ((88, 40, 130), (156, 92, 214), (220, 180, 255)),
    'emerald': ((22, 104, 60), (52, 186, 98), (170, 250, 190)),
    'ruby': ((120, 16, 36), (214, 44, 70), (255, 160, 170)),
    'sapphire': ((22, 58, 140), (52, 118, 224), (170, 210, 255)),
}

def node(kind):
    seed = {'stone': 1, 'copper': 2, 'coal': 3, 'iron': 4, 'silver': 5, 'gold': 6}.get(kind, 7)
    bumps = [(.07, 3, seed), (.05, 5, seed * 2)]
    m = shape(18, 15, bumps, seed); im, m = shade_rock(m, seed); P = im.load()
    if kind in METAL:
        spots = [(4, 4), (10, 3), (6, 8), (12, 8), (8, 11)] if kind != 'coal' else [(3, 5), (9, 3), (11, 8), (5, 9)]
        for (x, y) in spots: nugget(P, x, y, METAL[kind], 3 if kind != 'coal' else 4, 2 if kind != 'coal' else 3)
        if kind == 'copper':                                      # green patina flecks
            for (x, y) in [(8, 6), (13, 5), (4, 11)]: P[x, y] = (88, 170, 130, 255)
    elif kind in GEM:
        # a cluster of crystals growing out of the top, plus a couple of chips in the rock face
        out = Image.new('RGBA', (18, 22)); out.alpha_composite(im, (0, 5)); P = out.load()
        crystal(P, 4, 12, 7, GEM[kind]); crystal(P, 8, 10, 9, GEM[kind]); crystal(P, 12, 12, 6, GEM[kind])
        for (x, y) in [(5, 15), (12, 16)]: P[x, y] = GEM[kind][1] + (255,); P[x + 1, y] = GEM[kind][2] + (255,)
        return out
    return im

def lump(kind):
    """the item: a chunk of raw ore (14 x 12)"""
    pal = [(70, 62, 58), (96, 86, 80), (124, 114, 104), (150, 140, 128), (176, 166, 152)]
    if kind == 'coal': pal = [(18, 18, 22), (30, 30, 36), (44, 44, 54), (64, 66, 80), (100, 104, 128)]
    if kind == 'iron': pal = [(74, 44, 38), (104, 64, 52), (132, 86, 68), (160, 110, 88), (190, 140, 116)]
    m = shape(14, 11, [(.09, 3, 9), (.06, 4, 3)], 9); im, m = shade_rock(m, 9, pal); P = im.load()
    if kind in METAL and kind != 'coal':
        for (x, y) in ([(3, 3), (8, 4), (5, 7)] if kind != 'iron' else [(3, 4), (8, 3)]): nugget(P, x, y, METAL[kind])
        if kind == 'copper': P[10, 7] = (88, 170, 130, 255); P[3, 7] = (88, 170, 130, 255)
    if kind == 'coal':
        for (x, y) in [(4, 3), (8, 5), (6, 7)]: P[x, y] = (150, 156, 190, 255)
    return im

def gem(kind):
    """the item: a cut gem, each with its own cut"""
    dark, mid, light = GEM[kind]; im = Image.new('RGBA', (14, 13)); P = im.load()
    rows = {'amethyst': ['....XXXXXX....', '...XLLMMMDX...', '..XLLMMMMDDX..', '.XLLMMMMMMDDX.', 'XLLMMMMMMMMDDX', '.XLMMMMMMMDDX.', '..XMMMMMMMDX..', '...XMMMMMDX...', '....XMMMDX....', '.....XMDX.....', '......XX......'],
            'emerald': ['..XXXXXXXXXX..', '.XLLLLLLLLLDX.', 'XLLMMMMMMMMDDX', 'XLMMMMMMMMMMDX', 'XLMMMMMMMMMMDX', 'XLMMMMMMMMMMDX', 'XLMMMMMMMMMMDX', 'XLMMMMMMMMMDDX', '.XDDDDDDDDDDX.', '..XXXXXXXXXX..'],
            'ruby': ['....XXXXXX....', '..XXLLLMMMXX..', '.XLLLMMMMMDDX.', 'XLLMMMMMMMMDDX', 'XLMMMMMMMMMMDX', 'XLMMMMMMMMMMDX', 'XLMMMMMMMMMDDX', '.XMMMMMMMMDDX.', '..XXDDDDDDXX..', '....XXXXXX....'],
            'sapphire': ['.....XXXX.....', '...XXLLMMXX...', '..XLLLMMMMDX..', '.XLLMMMMMMMDX.', 'XLLMMMMMMMMMDX', 'XLMMMMMMMMMMDX', 'XMMMMMMMMMMDDX', '.XMMMMMMMMDDX.', '..XMMMMMMDDX..', '...XXDDDDXX...', '.....XXXX.....']}[kind]
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == 'X': P[x, y] = INK
            elif ch in 'LMD': P[x, y] = {'L': light, 'M': mid, 'D': dark}[ch] + (255,)
    # facet lines and a sparkle
    for (x, y) in [(4, 3), (5, 4), (9, 3), (8, 4)]:
        if P[x, y][3] and P[x, y] != INK: P[x, y] = light + (255,)
    P[4, 2] = (255, 255, 255, 255); P[3, 3] = (255, 255, 255, 255)
    return im
