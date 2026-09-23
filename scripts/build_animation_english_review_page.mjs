#!/usr/bin/env node
import {copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [inputDir, outputDir] = process.argv.slice(2);
if (!inputDir || !outputDir) throw new Error("Usage: node scripts/build_animation_english_review_page.mjs <artifact-dir> <output-dir>");
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = walk(inputDir);
const video = files.find(path => path.endsWith("animation-english-snag-540p.mp4"));
const sheet = files.find(path => path.endsWith("animation-english-contact-sheet.jpg"));
const kineticVideo = files.find(path => path.endsWith("animation-english-kinetic-540p.mp4"));
const kineticSheet = files.find(path => path.endsWith("animation-english-kinetic-contact-sheet.jpg"));
const arcadeWide = files.find(path => path.endsWith("animation-english-arcade-wide-540p.mp4"));
const arcadeShort = files.find(path => path.endsWith("animation-english-arcade-short-540p.mp4"));
const arcadeWideSheet = files.find(path => path.endsWith("animation-english-arcade-wide-contact-sheet.jpg"));
const arcadeShortSheet = files.find(path => path.endsWith("animation-english-arcade-short-contact-sheet.jpg"));
const propsFile = files.find(path => path.endsWith("pilot-props.json"));
if (!video || !sheet || !propsFile) throw new Error("Animated English review artifact is incomplete");
const {lesson, durationFrames, fps} = JSON.parse(readFileSync(propsFile, "utf8"));
if (!lesson?.target?.phrase || lesson.status !== "candidate") throw new Error("Unexpected lesson review props");
const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
mkdirSync(outputDir, {recursive: true});
copyFileSync(video, join(outputDir, "video.mp4"));
copyFileSync(sheet, join(outputDir, "contact-sheet.jpg"));
if (kineticVideo && kineticSheet) {
  copyFileSync(kineticVideo, join(outputDir, "kinetic.mp4"));
  copyFileSync(kineticSheet, join(outputDir, "kinetic-contact-sheet.jpg"));
}
const kineticBlock = kineticVideo && kineticSheet ? `<h2>テンポ強化版（候補B）</h2><p class="note">同じ台本・声・尺で、画面の切り替え、表現の提示、効果音を強めた比較用レンダリングです。</p><div class="video"><video controls playsinline preload="metadata" src="./kinetic.mp4"></video></div><h2>候補Bの画面の流れ</h2><img src="./kinetic-contact-sheet.jpg" alt="Kinetic Animated English contact sheet">` : "";
if ([arcadeWide, arcadeShort, arcadeWideSheet, arcadeShortSheet].some(Boolean) && ![arcadeWide, arcadeShort, arcadeWideSheet, arcadeShortSheet].every(Boolean)) throw new Error("Arcade review artifact is incomplete");
if (arcadeWide) {
  copyFileSync(arcadeWide, join(outputDir, "arcade-wide.mp4"));
  copyFileSync(arcadeShort, join(outputDir, "arcade-short.mp4"));
  copyFileSync(arcadeWideSheet, join(outputDir, "arcade-wide-contact-sheet.jpg"));
  copyFileSync(arcadeShortSheet, join(outputDir, "arcade-short-contact-sheet.jpg"));
}
const arcadeBlock = arcadeWide ? `<h2>レトロゲーム演出の試作（候補C）</h2><p class="note">参考動画の「カード出現と反転」の密度を目標にした冒頭約13秒の実装です。英語の状況→表現→意味をひとつのアニメーションでつなぎます。外部のゲーム画像・音声は使用していません。</p><div class="arcade-grid"><div><h3>横型 16:9</h3><div class="video"><video controls playsinline preload="metadata" src="./arcade-wide.mp4"></video></div><img src="./arcade-wide-contact-sheet.jpg" alt="Arcade wide contact sheet"></div><div><h3>縦型 9:16</h3><div class="video"><video class="vertical-video" controls playsinline preload="metadata" src="./arcade-short.mp4"></video></div><img src="./arcade-short-contact-sheet.jpg" alt="Arcade short contact sheet"></div></div>` : "";
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Animated English review — ${esc(lesson.title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#081722;color:#fff6e8;font-family:Inter,"Noto Sans JP",system-ui,sans-serif}main{width:min(1180px,calc(100% - 24px));margin:auto;padding:28px 0 70px}.eyebrow{color:#69dceb;font-size:12px;font-weight:900;letter-spacing:.16em}.title{font-size:clamp(28px,5vw,56px);line-height:1.06;margin:14px 0}.meta{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:22px}.chip{border:1px solid #3f6a78;background:#152f3e;border-radius:99px;padding:7px 12px;font-size:13px}.video{border:1px solid #345566;border-radius:16px;overflow:hidden;background:#000}.video video{display:block;width:100%;aspect-ratio:16/9}.video video.vertical-video{aspect-ratio:9/16;max-height:650px;margin:auto;width:auto;max-width:100%}.controls{display:flex;gap:8px;padding:12px;background:#102636}.controls button{background:#1e4253;color:#fff6e8;border:1px solid #538092;border-radius:8px;padding:8px 13px;cursor:pointer}h2{margin-top:34px;font-size:20px}h3{font-size:16px}.arcade-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px}.arcade-grid img{margin-top:12px}img{width:100%;border-radius:10px}.note{color:#b3c5c8;line-height:1.7;font-size:14px}@media(max-width:760px){.arcade-grid{grid-template-columns:1fr}}
</style></head><body><main><div class="eyebrow">WORLD IN CLEAR ENGLISH / CANDIDATE REVIEW</div><h1 class="title">${esc(lesson.title)}</h1><div class="meta"><span class="chip">表現: ${esc(lesson.target.phrase)}</span><span class="chip">${esc(lesson.level)}</span><span class="chip">${(durationFrames/fps).toFixed(1)}秒</span></div>${arcadeBlock}<h2>初期案（候補A）</h2><div class="video"><video id="preview" controls playsinline preload="metadata" src="./video.mp4"></video><div class="controls"><button data-rate="0.75">0.75×</button><button data-rate="1">1×</button><button data-rate="1.25">1.25×</button><button id="restart">↺ 最初から</button></div></div><h2>候補Aの画面の流れ</h2><img src="./contact-sheet.jpg" alt="Animation English contact sheet">${kineticBlock}<p class="note">英語学習フォーマットの試作です。このページでの確認は YouTube 公開承認ではありません。場面で理解できるか、声に出す時間が足りるか、最後に表現を思い出せるかを確認してください。</p></main><script>const video=document.getElementById('preview');document.querySelectorAll('[data-rate]').forEach(button=>button.addEventListener('click',()=>{video.playbackRate=Number(button.dataset.rate);video.play()}));document.getElementById('restart').addEventListener('click',()=>{video.currentTime=0;video.play()});</script></body></html>`;
writeFileSync(join(outputDir, "index.html"), html, "utf8");
console.log(JSON.stringify({outputDir, lessonId: lesson.id, videoBytes: statSync(video).size}));
