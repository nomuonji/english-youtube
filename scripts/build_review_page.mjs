#!/usr/bin/env node
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from "node:fs";
import {basename, join} from "node:path";

const [inputDir, outputDir] = process.argv.slice(2);
if (!inputDir || !outputDir) {
  console.error("usage: node scripts/build_review_page.mjs <review-artifact-dir> <output-dir>");
  process.exit(2);
}

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

const files = walk(inputDir);
const find = (suffix) => files.find((file) => file.endsWith(suffix));
const video = find("-preview-540p.mp4");
const sheet = find("-contact-sheet.jpg");
const propsFile = files.find((file) => basename(file) === "render-props.json");
if (!video || !sheet || !propsFile) {
  throw new Error(`review artifact is incomplete: video=${Boolean(video)} sheet=${Boolean(sheet)} props=${Boolean(propsFile)}`);
}

const props = JSON.parse(readFileSync(propsFile, "utf8"));
const manifest = props.manifest ?? {};
const episodeId = String(manifest.episodeId ?? "unknown-episode");
const revision = String(manifest.revision ?? "?");
const question = String(manifest.centralQuestion ?? episodeId);
const generatedAt = String(manifest.generatedAt ?? "");
const manifestHash = String(props.resolved?.manifestHash ?? props.manifestHash ?? "");

mkdirSync(outputDir, {recursive: true});
copyFileSync(video, join(outputDir, "video.mp4"));
copyFileSync(sheet, join(outputDir, "contact-sheet.jpg"));

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>READY Review — ${esc(episodeId)}</title>
  <style>
    :root{color-scheme:dark;background:#0b0d10;color:#f4f6f8;font-family:Inter,"Noto Sans JP",system-ui,sans-serif}
    *{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at 50% -20%,#202a37 0,#0b0d10 42%);min-height:100vh}
    main{width:min(1180px,calc(100% - 28px));margin:0 auto;padding:28px 0 64px}
    .top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:18px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em;color:#86efac}.question{font-size:clamp(24px,4vw,44px);line-height:1.08;margin:7px 0 0;max-width:900px}.badge{white-space:nowrap;border:1px solid #34404f;background:#151a21;border-radius:999px;padding:8px 12px;font-size:12px;color:#cbd5e1}
    .player{background:#050607;border:1px solid #2b3440;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px #0008}.player video{display:block;width:100%;aspect-ratio:16/9;background:#000}
    .controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 14px;border-top:1px solid #202733;background:#10141a}.controls button{border:1px solid #374151;background:#171c24;color:#f8fafc;border-radius:9px;padding:7px 11px;font:inherit;cursor:pointer}.controls button:hover{background:#232b36}.controls .spacer{flex:1}.meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.meta div{padding:12px 14px;border-radius:12px;border:1px solid #252e39;background:#11161c}.meta b{display:block;font-size:11px;color:#94a3b8;margin-bottom:5px;text-transform:uppercase;letter-spacing:.08em}.meta span{font-size:13px;overflow-wrap:anywhere}
    details{margin-top:20px;border:1px solid #252e39;background:#10151b;border-radius:14px;padding:14px 16px}summary{cursor:pointer;font-weight:750}.sheet{width:100%;margin-top:14px;border-radius:10px;display:block}.note{color:#94a3b8;font-size:13px;line-height:1.6;margin-top:14px}
    @media(max-width:720px){main{width:min(100% - 18px,1180px);padding-top:16px}.top{display:block}.badge{display:inline-block;margin-top:12px}.meta{grid-template-columns:1fr 1fr}.controls .spacer{display:none}}
  </style>
</head>
<body>
<main>
  <div class="top">
    <div><div class="eyebrow">LATEST READY REVIEW</div><h1 class="question">${esc(question)}</h1></div>
    <div class="badge">Revision ${esc(revision)}</div>
  </div>
  <section class="player">
    <video id="video" controls playsinline preload="metadata" src="./video.mp4"></video>
    <div class="controls">
      <button data-rate="0.75">0.75×</button><button data-rate="1">1×</button><button data-rate="1.25">1.25×</button><button data-rate="1.5">1.5×</button><button data-rate="2">2×</button>
      <span class="spacer"></span><button id="restart">↺ 最初から</button>
    </div>
  </section>
  <section class="meta">
    <div><b>Episode</b><span>${esc(episodeId)}</span></div>
    <div><b>Revision</b><span>${esc(revision)}</span></div>
    <div><b>Generated</b><span>${esc(generatedAt || "—")}</span></div>
    <div><b>Manifest</b><span>${esc(manifestHash ? manifestHash.slice(0,16) + "…" : "validated")}</span></div>
  </section>
  <details><summary>3×3 Contact Sheet</summary><img class="sheet" src="./contact-sheet.jpg" alt="Review contact sheet" /></details>
  <p class="note">このページは最新のREADYレビュー用です。READYが成功するたびに動画が置き換わります。APPROVED / YouTube公開とは別の工程です。</p>
</main>
<script>
  const video=document.getElementById('video');
  document.querySelectorAll('[data-rate]').forEach((button)=>button.addEventListener('click',()=>{video.playbackRate=Number(button.dataset.rate);video.play();}));
  document.getElementById('restart').addEventListener('click',()=>{video.currentTime=0;video.play();});
</script>
</body>
</html>`;

writeFileSync(join(outputDir, "index.html"), html, "utf8");
console.log(JSON.stringify({ok:true,episodeId,revision,videoBytes:statSync(video).size,output:join(outputDir,"index.html")}));
