"""Hand-drawn 16x16 harvest icons for crops the art pack doesn't have (and a clearer garlic)."""
from PIL import Image

PAL = {
    'k': (52, 30, 20), '.': None,
    # greens
    'G': (40, 110, 50), 'g': (78, 160, 66), 'l': (150, 210, 96), 'w': (214, 240, 170),
    # cucumber stripes
    'C': (30, 86, 44), 'c': (64, 136, 60), 'v': (120, 186, 84),
    # lentils / sack
    'R': (150, 60, 30), 'r': (212, 104, 50), 'o': (240, 156, 84), 'S': (130, 92, 52), 's': (190, 148, 92), 't': (226, 196, 140),
    # beans
    'B': (70, 130, 50), 'b': (136, 196, 90), 'e': (196, 232, 140), 'y': (236, 230, 176),
    # saffron crocus
    'P': (92, 50, 140), 'p': (150, 96, 206), 'q': (204, 168, 240), 'F': (200, 40, 30), 'f': (250, 120, 50), 'Y': (250, 220, 90),
    # garlic
    'W': (238, 232, 220), 'H': (255, 255, 250), 'h': (200, 190, 180), 'm': (150, 110, 160), 'd': (180, 150, 100),
}

ICONS = {
    'cucumber': [
        "................",
        "...........kk...",
        "..........kGgk..",
        ".........kcvvck.",
        "........kcvlvck.",
        ".......kcvlvcCk.",
        "......kcvlvcCk..",
        ".....kcvlvcCk...",
        "....kcvlvcCk....",
        "...kcvvvcCk.....",
        "..kcvlvcCk......",
        "..kcvvcCk.......",
        "..kccCCk........",
        "...kkkk.........",
        "................",
        "................"],
    'lentils': [
        "................",
        "....k......k....",
        "...ksk....ksk...",
        "...kstkkkkstk...",
        "...krorRororok..",
        "..korRorororRk..",
        "..krororRororok.",
        ".ksoRororoRorsk.",
        ".kstsrororosstk.",
        ".kstssssssssstk.",
        ".ksttssssssttsk.",
        ".kssttssssttssk.",
        "..kSsssssssssk..",
        "...kSSSSSSSSk...",
        "....kkkkkkkk.o..",
        ".........o.r..o."],
    'fava': [
        "................",
        "..............k.",
        ".............kGk",
        "...kkkkkkkkkkBk.",
        "..kBbbBbbBbbbBk.",
        ".kBbeebbeebbeebk",
        ".kbeyyebeyyebeyk",
        ".kbeyyebeyyebebk",
        ".kBbeebbeebbeBk.",
        "..kBBbBBbBBBBk..",
        "...kkkkkkkkkk...",
        "................",
        "...kkk...kkk....",
        "..kbeek.kbeek...",
        "..kBbbk.kBbbk...",
        "...kkk...kkk...."],
    'saffron': [
        "................",
        "......k..k......",
        ".....kqkkqk.....",
        "....kqpkkpqk....",
        "....kpfFFfpk....",
        "...kqpFYYFpqk...",
        "...kppFfFfppk...",
        "...kPppFFppPk...",
        "....kPpppPPk....",
        ".....kPPPPk.....",
        "..kk..kgGk..kk..",
        "..klk.kgGk.klk..",
        "...klkkgGkklk...",
        "....kgGgGgGk....",
        ".....kkkkkk.....",
        "................"],
    'garlic': [
        "................",
        ".......kk.......",
        "......kddk......",
        "......kdhk......",
        ".....kkWhkk.....",
        "....kHWmWWHk....",
        "...kHWWmWHWWk...",
        "..kHWHWmWHWmWk..",
        "..kWHWmWWHWmWk..",
        "..kWWmWWHWmWhk..",
        "..khWmWWWWmWhk..",
        "...khWWhhWWhk...",
        "....khhhhhhk....",
        ".....kkkkkk.....",
        "......d.d.......",
        "................"],
}


def icon(name):
    rows = ICONS[name]; im = Image.new('RGBA', (16, 16)); px = im.load()
    for y, row in enumerate(rows):
        assert len(row) == 16, (name, y, len(row))
        for x, ch in enumerate(row):
            c = PAL[ch]
            if c: px[x, y] = c + (255,)
    return im


if __name__ == '__main__':
    out = Image.new('RGBA', (16 * len(ICONS), 16), (232, 220, 192, 255))
    for i, k in enumerate(ICONS): ic = icon(k); out.alpha_composite(ic, (i * 16, 0))
    out.resize((out.width * 8, out.height * 8), Image.NEAREST).save('/tmp/cropicons.png')
