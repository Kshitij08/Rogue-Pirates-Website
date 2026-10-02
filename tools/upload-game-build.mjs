#!/usr/bin/env node
/**
 * Upload a Unity WebGL build (or the Android APK) to Cloudflare R2 with the headers browsers need.
 *
 * Usage (from the repo root):
 *   node tools/upload-game-build.mjs <build-folder> <bucket> <version>
 * e.g. for the 2026-10-02 release (folders staged in References/Release-2026-10-02/r2-upload):
 *   node tools/upload-game-build.mjs "<staged>/2026-10-02/desktop/Build" <your-bucket> 2026-10-02/desktop/Build
 *   node tools/upload-game-build.mjs "<staged>/2026-10-02/mobile/Build"  <your-bucket> 2026-10-02/mobile/Build
 *   node tools/upload-game-build.mjs "<staged>/2026-10-02/android"       <your-bucket> 2026-10-02/android
 *
 * Files land at <bucket>/<version>/<file>, e.g. <your-bucket>/Build/WebGL.data.unityweb,
 * which the site loads from https://rogue-pirates.x2c.fun/<version>/… (GAME_CDN in play/index.html).
 *
 * Every upload goes to a new <version> folder, so files can be cached "forever" (immutable).
 * Requires: Node 18+, and `npx wrangler login` done once.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [dir, bucket, version] = process.argv.slice(2);
if (!dir || !bucket || !version) {
  console.error("Usage: node tools/upload-game-build.mjs <build-folder> <bucket> <version>");
  process.exit(1);
}

// Content-Type + Content-Encoding per file. ".unityweb" = Brotli with Decompression Fallback,
// ".br" / ".gz" = Brotli / Gzip without fallback, no suffix = uncompressed.
function meta(name) {
  const enc = name.endsWith(".unityweb") || name.endsWith(".br") ? "br" : name.endsWith(".gz") ? "gzip" : null;
  const base = name.replace(/\.(unityweb|br|gz)$/, "");
  const type = base.endsWith(".apk") ? "application/vnd.android.package-archive"
    : base.endsWith(".wasm") ? "application/wasm"
    : base.endsWith(".js") ? "application/javascript"
    : base.endsWith(".json") ? "application/json"
    : "application/octet-stream";
  return { enc, type };
}

const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
if (!files.length) {
  console.error(`No files in ${dir}`);
  process.exit(1);
}

let failed = 0;
for (const name of files) {
  const { enc, type } = meta(name);
  const size = (fs.statSync(path.join(dir, name)).size / 1e6).toFixed(1);
  const args = [
    "wrangler", "r2", "object", "put", `${bucket}/${version}/${name}`,
    "--file", path.join(dir, name),
    "--content-type", type,
    "--cache-control", "public, max-age=31536000, immutable",
    "--remote",
  ];
  if (enc) args.push("--content-encoding", enc);
  if (name.endsWith(".apk")) args.push("--content-disposition", `attachment; filename="${name}"`);
  console.log(`\n↑ ${name}  (${size} MB, ${type}${enc ? `, ${enc}` : ""})`);
  const r = spawnSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) failed++;
}

if (failed) {
  console.error(`\n${failed} upload(s) failed.`);
  process.exit(1);
}
console.log(`\nDone. Set BUILD.url in play/index.html to "<your bucket URL>/${version}".`);
