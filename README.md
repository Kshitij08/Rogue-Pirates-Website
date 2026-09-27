# Rogue Pirates — Website

A static landing page (HTML, CSS and vanilla JS) with no build step and no dependencies.

The page is six full-screen sections (Hero, Our Story, Captains, Gameplay, Play in Browser, Launch) that snap into place as you scroll. On desktop each section is scaled to fit the screen. Phones and portrait tablets get a single-column layout.

```
index.html              page markup
assets/css/style.css    all styles (full-screen desktop layout + single-column mobile layout)
assets/js/main.js       content config + captain picker, carousel, video player, nav
assets/img/             optimised WebP images (generated, see below)
assets/icons/           favicons
assets/og-image.jpg     social share preview
assets/video/           promo video (1080p + 720p for phones) and poster
play/                   browser version (placeholder until the Unity WebGL build lands)
tools/build_assets.py   regenerates assets/img from /References (References/ is git-ignored)
tools/fonts/            Alegreya (SIL OFL), used to render the "Play in Browser" title
vercel.json             cache + security headers
```

## Editing content

Everything you're likely to change is in the **CONFIG** block at the top of `assets/js/main.js`:

| What | Constant |
| --- | --- |
| X / Instagram / Discord links (Discord is also used by **Join us**) | `LINKS` |
| Seeker / App Store / Steam / Google Play links | `STORES` |
| "Our Story" video: the promo in `assets/video/` is used by default. Set this only to switch to a YouTube/Vimeo embed | `STORY_VIDEO` |
| Browser version URL, and whether it's live (hides the "Coming soon" badges and switches buttons to "Play now") | `PLAY` |
| Gameplay carousel images or videos | `GAMEPLAY_MEDIA` |
| Captain names, stats (0–6), special abilities, ability icons | `CAPTAINS` |

Captain stats follow the Narrative Bible. Durability comes from Hull and speed comes from Speed. Firepower and handling are judgement calls based on each captain's weapon and gameplay notes, because the bible gives no numbers for them. Each mapping is written out above `CAPTAINS`.

To add a special-ability icon, put a square image in `assets/img/captains/` and set `ability.icon` on that captain. Without one, the captain's emblem shows as a placeholder.

To re-encode the promo video (the source is `References/Rogue Pirates Promo.mp4`), use the ffmpeg binary that ships with `imageio-ffmpeg`:

```bash
ffmpeg -i "References/Rogue Pirates Promo.mp4" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart assets/video/promo-1080.mp4
```

```bash
ffmpeg -i "References/Rogue Pirates Promo.mp4" -vf scale=-2:720 -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -c:a aac -b:a 112k -movflags +faststart assets/video/promo-720.mp4
```

While a link is empty, clicking it shows a "coming soon" toast.

You can link straight to a captain with `/?captain=roxie`.

## Browser version (Unity WebGL)

`/play/` currently shows a "coming soon" page. To ship the game:

1. Build the game in Unity for WebGL.
2. Replace the contents of `play/` with the build output (`index.html`, `Build/`, `TemplateData/`).
3. Set `PLAY.live = true` in `assets/js/main.js`.

`vercel.json` already sends the correct `Content-Encoding` and `Content-Type` headers for Brotli (`.br`) and Gzip (`.gz`) Unity builds. It also redirects `/play` to `/play/` so the build's relative paths resolve.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Deploy to Vercel

Import the repo in Vercel and pick **Framework preset: Other**. Leave the build command empty and set the output directory to `.` (the repo root). `.vercelignore` keeps `/References` and `/tools` out of the deployment.

With the CLI:

```bash
npx vercel --prod
```

## Regenerating images

If the design exports in `/References` change, run the following (it needs Pillow and numpy):

```bash
python tools/build_assets.py
```

To rebuild only some groups of images, name them, e.g. `python tools/build_assets.py captains ui`. The available groups are `backgrounds`, `hero`, `ui`, `portraits`, `captains` and `meta`.
