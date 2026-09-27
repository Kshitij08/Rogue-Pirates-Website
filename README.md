# Rogue Pirates — Website

A static landing page (HTML, CSS and vanilla JS) with no build step and no dependencies.

The page is six full-screen sections (Hero, Our Story, Captains, Gameplay, Play in Browser, Launch) that snap into place as you scroll. On desktop each section is scaled to fit the screen. Phones and portrait tablets get a single-column layout.

```
index.html              page markup
assets/css/style.css    all styles (full-screen desktop layout + single-column mobile layout)
assets/js/main.js       content config + captain picker, carousel, video player, nav
assets/img/             optimised WebP images (generated, see below)
assets/fonts/           Cinzel (headings) + Alegreya (body copy), SIL OFL, self-hosted
assets/icons/           favicons
assets/og-image.jpg     social share preview
assets/video/           promo video (1080p + 720p for phones) and poster
play/                   Unity WebGL player page (build files hosted separately; see below)
tools/build_assets.py   regenerates assets/img from /References (References/ is git-ignored)
tools/upload-game-build.mjs + r2-cors.json   upload the Unity build to Cloudflare R2
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

`/play/` is a branded player page for the Unity WebGL build. It has a start screen that shows the download size, a progress bar, a fullscreen button, a warning on phones and error handling.

- **Build location:** the build files go in a folder set by `BUILD.url` at the bottom of `play/index.html`. Locally that's the git-ignored `play/Build/` folder; on the live site it's `GAME_CDN` (`https://rogue-pirates.x2c.fun/Build`). Add `?cdn` to test the live bucket from localhost.
- **Kept out of git:** `play/Build/` is in `.gitignore`. The current data file is about 160 MB, which is over GitHub's 100 MB per-file limit and Vercel Hobby's 100 MB upload limit.
- **Compression headers:** the build is Brotli-compressed with *Decompression Fallback*, so the files end in `.unityweb`. Serve them with `Content-Encoding: br` and the right `Content-Type` so the browser decompresses them natively. That makes loading about 2.5× faster than the JavaScript fallback. `vercel.json` already sets these headers for `/play/Build/`, and a CDN needs the same metadata on each file:

  | File | Content-Type | Content-Encoding |
  | --- | --- | --- |
  | `*.data.unityweb` | `application/octet-stream` | `br` |
  | `*.wasm.unityweb` | `application/wasm` | `br` |
  | `*.framework.js.unityweb` | `application/javascript` | `br` |
  | `*.loader.js` | `application/javascript` | none |

- **CORS:** if the build is on another domain, allow `GET` from `https://roguepirates.fun` and `https://www.roguepirates.fun` in that bucket's CORS settings.
- **Updating the build:** copy the new files into the build folder and update `BUILD.name` (the file prefix) and `BUILD.downloadMB` in `play/index.html`.
- **Test locally:** copy the build into `play/Build/` and open http://localhost:5173/play/. Add `?autostart` to skip the start screen.

### Hosting the build on Cloudflare R2

R2 doesn't charge for bandwidth, which matters because every player downloads the whole build. One-time setup:

1. **Put the domain on Cloudflare.** Create a Cloudflare account and add `roguepirates.fun` to it. R2 custom domains need the domain's DNS on Cloudflare. The site itself stays on Vercel: keep its DNS records pointing at Vercel.
2. **Sign in and create the bucket.** `npx wrangler login`, then `npx wrangler r2 bucket create roguepirates-game`.
3. **Allow the site to load files from the bucket.** Run `npx wrangler r2 bucket cors set roguepirates-game --file tools/r2-cors.json`.
4. **Connect the subdomain.** In the dashboard, go to R2 → your bucket → Settings → Custom Domains and connect the game subdomain (currently `rogue-pirates.x2c.fun`). The `r2.dev` URL works for quick tests, but Cloudflare rate-limits it, so it isn't meant for real traffic.

For each build:

1. **Upload it.** Run `node tools/upload-game-build.mjs "References/V4WebGLDemo/Build" roguepirates-game v4`, bumping `v4` to a new version name for every build. The script sets the correct `Content-Type` and `Content-Encoding` on each file, and marks them cacheable for a year.
2. **Point the page at it.** Set `GAME_CDN` in `play/index.html` to `https://rogue-pirates.x2c.fun/<folder>`. Update `BUILD.name` and `BUILD.downloadMB` if they changed, then deploy the site.
3. **Turn on the Play buttons.** The first time, set `PLAY.live = true` in `assets/js/main.js`. That switches the homepage buttons from "Coming soon" to "Play now".

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
