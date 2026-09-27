"""
Builds the optimized web assets in /assets/img from the raw design exports in /References.

Usage:  python tools/build_assets.py
Requires: Pillow (pip install pillow numpy)

The design canvas is 5678 x 15141 px. Every size/offset used in the CSS is expressed in
"design units" (1rem = 100 design px on desktop), so the numbers below match the Figma file.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "References" / "Rogue Pirates Website Assets"
CAP = ROOT / "References" / "Rogue Pirates Captains Section Assets"
OUT = ROOT / "assets" / "img"

CAPTAINS = {
    # key: (file-name token in the captains folder, sail file, up, down)
    "rook": "rook",
    "richie": "richie",
    "hank": "hank",
    "roxie": "roxie",
    "sparky": "sparky",
    "ember": "ember",
}


def find(folder: Path, *tokens: str) -> Path:
    """Find a file whose lower-cased name starts with the given tokens (case-insensitive)."""
    for p in sorted(folder.iterdir()):
        name = p.name.lower()
        if all(t.lower() in name for t in tokens) and name.startswith(tokens[0].lower()):
            return p
    raise FileNotFoundError(f"{tokens} in {folder}")


def save(img: Image.Image, rel: str, width: int | None = None, quality: int = 82, trim: bool = False):
    img = img.convert("RGBA") if img.mode not in ("RGB", "RGBA") else img
    if trim and img.mode == "RGBA":
        bbox = img.getchannel("A").getbbox()
        if bbox:
            img = img.crop(bbox)
    if width and img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    dest = OUT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.suffix == ".webp":
        lossless = False
        img.save(dest, "WEBP", quality=quality, method=6, lossless=lossless)
    elif dest.suffix in (".jpg", ".jpeg"):
        img.convert("RGB").save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
    else:
        img.save(dest, optimize=True)
    print(f"  {rel:40s} {img.width}x{img.height}  {dest.stat().st_size // 1024} KB")
    return img


def backgrounds():
    print("backgrounds")
    bg = Image.open(find(WEB, "chatgpt")).convert("RGB")
    assert bg.size == (5678, 15141), bg.size
    # Desktop: the whole painting as one continuous page background (sections snap on top of it).
    for w in (1600, 2400):
        save(bg, f"bg/full-{w}.webp", width=w, quality=74)
    # Mobile: one continuous vertical strip from the centre of the painting.
    strip = bg.crop((1700, 0, 3978, 15141))
    save(strip, "bg/mobile-900.webp", width=900, quality=74)
    save(strip, "bg/mobile-1300.webp", width=1300, quality=72)


def hero():
    print("hero")
    save(Image.open(find(WEB, "rogue_pirates_logo")), "logo.webp", width=1600, trim=True)
    save(Image.open(find(WEB, "rogue_pirates_logo")), "logo-800.webp", width=800, trim=True)
    save(Image.open(find(WEB, "ship_copy")), "ship.webp", width=2200, trim=True)
    save(Image.open(find(WEB, "ship_copy")), "ship-1100.webp", width=1100, trim=True)
    octo = Image.open(find(WEB, "octo")).convert("RGBA")
    # The kraken is two separate tentacle groups; split them so they can sway independently.
    a = np.array(octo.getchannel("A"))
    cols = np.where(a.max(0) > 0)[0]
    gaps = np.where(np.diff(cols) > 1)[0]
    split = int(cols[gaps[0]] + 1) if len(gaps) else octo.width // 2
    print(f"  kraken split at x={split} of {octo.width}")
    save(octo, "octo.webp", width=2400)
    save(octo.crop((0, 0, split, octo.height)), "octo-left.webp", width=round(2400 * split / octo.width))
    save(octo.crop((split, 0, octo.width, octo.height)), "octo-right.webp",
         width=round(2400 * (octo.width - split) / octo.width))


def ui():
    print("ui")
    save(Image.open(find(WEB, "scroll png")), "story-scroll.webp", width=2600, trim=True)
    save(Image.open(find(WEB, "scroll 4")), "banner-scroll.webp", width=900)
    save(Image.open(find(WEB, "profile bg 2")), "banner-plank.webp", width=900)
    save(Image.open(find(WEB, "button yellow")), "button-yellow.webp", width=700)
    for title in ("Our Story", "Captains", "Gameplay", "Launching soon on", "Join us"):
        slug = title.lower().replace(" ", "-")
        save(Image.open(find(WEB, title)), f"title-{slug}.webp", width=700, quality=90)
    save(Image.open(find(WEB, "arrow button 5")), "arrow-left.webp", width=160, trim=True)
    save(Image.open(find(WEB, "arrow button 4")), "arrow-right.webp", width=160, trim=True)
    save(Image.open(find(WEB, "new-twitter")), "social-x.webp", width=240, quality=88, trim=True)
    save(Image.open(find(WEB, "instagram")), "social-instagram.webp", width=240, quality=88, trim=True)
    save(Image.open(find(WEB, "discord")), "social-discord.webp", width=240, quality=88, trim=True)


def portraits():
    """Portrait cards + a gold 'selected' frame overlay extracted from the Hank selected card."""
    print("portraits")
    size = 498
    load = lambda p: np.array(Image.open(p).convert("RGBA").resize((size, size), Image.LANCZOS))
    normal = {
        "rook": find(WEB, "rook 3"),
        "richie": find(WEB, "richie 4"),
        "roxie": find(WEB, "roxie 3"),
        "sparky": find(WEB, "sparky 4"),
        "ember": find(WEB, "ember 3"),
    }
    arrs = {k: load(p) for k, p in normal.items()}
    gold = load(find(WEB, "hank select"))

    # Pixels identical across every portrait belong to the (silver) frame.
    stack = np.stack([a.astype(int) for a in arrs.values()])
    agree = (stack.max(0) - stack.min(0)).max(-1) < 14
    ref = arrs["rook"].astype(int)
    interior = np.abs(ref[..., :3] - np.array([37, 32, 36])).max(-1) < 18
    yy, xx = np.mgrid[:size, :size]
    near_edge = np.minimum(np.minimum(yy, xx), np.minimum(size - 1 - yy, size - 1 - xx)) < 70
    ring = Image.fromarray(((agree & ~interior & (ref[..., 3] > 0) & near_edge) * 255).astype(np.uint8))
    ring = ring.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(9))
    fill = Image.eval(ring, lambda v: 255 - v).convert("L")
    ImageDraw.floodfill(fill, (size // 2, size // 2), 128)
    hole = np.array(Image.fromarray(((np.array(fill) == 128) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 128

    def frame_only(a):
        b = a.copy()
        b[hole, 3] = 0
        return Image.fromarray(b)

    save(frame_only(gold), "captains/frame-gold.webp", width=300, quality=90)
    for key, a in arrs.items():
        save(Image.fromarray(a), f"captains/{key}-portrait.webp", width=300, quality=86)
    hank = Image.fromarray(gold)
    hank.alpha_composite(frame_only(arrs["rook"]))
    save(hank, "captains/hank-portrait.webp", width=300, quality=86)


def sail_emblem(path: Path) -> Image.Image:
    """Turn a white-icon-on-solid-colour sail image into a white icon with alpha (used as a CSS mask)."""
    im = np.array(Image.open(path).convert("RGB")).astype(float)
    bgc = im[4, 4]
    dist = np.abs(im - bgc).max(-1)
    full = np.abs(np.array([250, 250, 250]) - bgc).max()
    alpha = np.clip(dist / full, 0, 1)
    alpha[alpha < 0.06] = 0
    out = np.zeros((*alpha.shape, 4), np.uint8)
    out[..., :3] = 255
    out[..., 3] = (alpha * 255).astype(np.uint8)
    img = Image.fromarray(out)
    return img.crop(img.getchannel("A").getbbox())


def captains():
    print("captains")
    for key in CAPTAINS:
        if key == "hank":
            char = Image.open(find(WEB, "hank character 4"))
            # keep the same pixel scale as the other characters (hank character 1 is 1041px tall)
            save(char, f"captains/{key}-character.webp", width=round(char.width * 1400 / char.height), quality=84)
        else:
            char = Image.open(find(CAP, f"{key} character"))
            save(char, f"captains/{key}-character.webp", quality=84)
        print(f"    source height {Image.open(find(CAP, f'{key} character')).size}")
        save(Image.open(find(CAP, f"cannon {key}")), f"captains/{key}-cannon.webp", width=180, quality=86)
        save(Image.open(find(CAP, f"sheild {key}")), f"captains/{key}-shield.webp", width=180, quality=86)
        save(Image.open(find(CAP, f"ship logo {key}")), f"captains/{key}-ship.webp", width=180, quality=86)
        save(Image.open(find(CAP, f"wheel {key}")), f"captains/{key}-wheel.webp", width=180, quality=86)
        save(Image.open(find(CAP, f"{key} up")), f"captains/{key}-up.webp", width=96, quality=88)
        save(Image.open(find(CAP, f"{key} down")), f"captains/{key}-down.webp", width=96, quality=88)
        save(sail_emblem(find(CAP, key, "sail")), f"captains/{key}-emblem.webp", width=360, quality=90)



GAMEPLAY = ROOT / "References" / "Gameplay Screenshots"
FONTS = Path(__file__).resolve().parent / "fonts"

# Gameplay carousel order (file name in References/Gameplay Screenshots, alt text).
GAMEPLAY_SHOTS = [
    ("bdjmv.png", "Rook's ship blasts a ring of fire through an enemy fleet"),
    ("dadadada.jpg", "Critical hits land on a giant red sea beast near the islands"),
    ("dhvb.png", "A PvP duel between two pirate ships on a blood-red sea"),
    ("djhvb.png", "A laser beam sweeps across a green sea full of loot"),
    ("jhjb.png", "Captain Richie fights a sea monster among palm-covered islands"),
    ("afssgsf.jpg", "Sailing past islands while dodging a swarm of enemy boats"),
    ("dadwd.jpg", "Lightning and cannon fire light up a coastal battle"),
    ("hb .png", "Fire and cannonballs fly in a night battle on a red sea"),
    ("jhjefb.png", "Racing rival ships across an emerald sea"),
]


def gameplay():
    print("gameplay")
    for i, (name, _alt) in enumerate(GAMEPLAY_SHOTS, 1):
        im = Image.open(GAMEPLAY / name).convert("RGB")
        save(im, f"gameplay/{i:02d}-1600.webp", width=1600, quality=80)
        save(im, f"gameplay/{i:02d}-800.webp", width=800, quality=78)


def _white_icon(img: Image.Image, box, mode="lum") -> Image.Image:
    """Cut a logo out of a store badge as a white silhouette (used as a CSS mask)."""
    c = np.array(img.convert("RGB").crop(box)).astype(float)
    a = c.mean(-1) / 255 if mode == "lum" else np.clip(c.max(-1) / 255 * 1.4, 0, 1)
    a = np.clip((a - 0.12) / 0.8, 0, 1)
    out = np.zeros((*a.shape, 4), np.uint8)
    out[..., :3] = 255
    out[..., 3] = (a * 255).astype(np.uint8)
    o = Image.fromarray(out)
    return o.crop(o.getchannel("A").getbbox())


def platforms():
    """Monochrome platform icons so the 'Launching soon on' row reads as one set."""
    print("platforms")
    apple = Image.open(find(WEB, "apple-store")).convert("RGBA")
    apple = apple.crop(apple.getchannel("A").getbbox())
    save(_white_icon(apple, (115, 51, 326, 307)), "platforms/apple.png", width=160)
    steam = Image.open(find(WEB, "steam"))
    save(_white_icon(steam, (189, 42, 471, 324)), "platforms/steam.png", width=160)
    google = Image.open(find(WEB, "google_play"))
    save(_white_icon(google, (87, 62, 306, 305), mode="any"), "platforms/google-play.png", width=160)


def play_title():
    """Render the 'Play in Browser' banner title in Alegreya ExtraBold to match the other titles."""
    from PIL import ImageFont
    print("play title")
    ref = Image.open(find(WEB, "Captains")).convert("RGBA")
    px = np.array(ref).reshape(-1, 4)
    colour = tuple(int(v) for v in np.median(px[px[:, 3] > 250][:, :3], 0))

    def font(size):
        f = ImageFont.truetype(str(FONTS / "Alegreya-Variable.ttf"), size)
        f.set_variation_by_axes([800])
        return f

    # size the font so "Captains" comes out as tall as the exported Captains title
    probe = font(200).getbbox("Captains")
    size = round(200 * ref.height / (probe[3] - probe[1]))
    # "Launching soon on" is drawn smaller than the one-word titles; match that scale for a long title
    launching = Image.open(find(WEB, "Launching soon on"))
    size = round(size * 0.66)
    f = font(size)
    text = "Play in Browser"
    l, t, r, b = f.getbbox(text)
    img = Image.new("RGBA", (r - l + 8, b - t + 8), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((4 - l, 4 - t), text, font=f, fill=colour + (255,))
    img = img.crop(img.getchannel("A").getbbox())
    print(f"    native size {img.size} (Launching soon on is {launching.size})")
    save(img, "title-play-in-browser.webp", width=700, quality=90)


def meta():
    print("meta")
    logo = Image.open(find(WEB, "rogue_pirates_logo")).convert("RGBA")
    logo = logo.crop(logo.getchannel("A").getbbox())
    # favicon: the ship's wheel at the top of the logo
    w, h = logo.size
    wheel = logo.crop((round(w * 0.2), 0, round(w * 0.8), round(h * 0.62)))
    side = max(wheel.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(wheel, ((side - wheel.width) // 2, (side - wheel.height) // 2))
    save(sq.resize((180, 180), Image.LANCZOS), "../icons/apple-touch-icon.png")
    save(sq.resize((64, 64), Image.LANCZOS), "../icons/favicon-64.png")
    save(sq.resize((32, 32), Image.LANCZOS), "../icons/favicon-32.png")

    # Open Graph image: hero composition
    bg = Image.open(find(WEB, "chatgpt")).convert("RGBA").crop((0, 0, 5678, 3300))
    for p, xy in ((find(WEB, "rogue_pirates_logo"), (0, 1579)), (find(WEB, "ship_copy"), (2183, 283)), (find(WEB, "octo"), (2108, 1016))):
        layer = Image.open(p).convert("RGBA")
        bg.alpha_composite(layer, xy) if xy[0] + layer.width <= bg.width and xy[1] + layer.height <= bg.height else _paste_clipped(bg, layer, xy)
    save(bg.resize((1200, 697), Image.LANCZOS).crop((0, 55, 1200, 685)), "../og-image.jpg", quality=84)


def _paste_clipped(base, layer, xy):
    x, y = xy
    w = min(layer.width, base.width - x)
    h = min(layer.height, base.height - y)
    base.alpha_composite(layer.crop((0, 0, w, h)), (x, y))


if __name__ == "__main__":
    import sys
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    if only:
        for name in only:
            globals()[name]()
        raise SystemExit
    backgrounds()
    hero()
    ui()
    portraits()
    captains()
    gameplay()
    platforms()
    play_title()
    meta()
    print("done")
