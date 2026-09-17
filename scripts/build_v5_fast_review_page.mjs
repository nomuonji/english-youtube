#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [artifactDirArg="v5-fast-artifact",outDirArg="out/review-v5"]=process.argv.slice(2);
const artifactDir=path.resolve(artifactDirArg);const outDir=path.resolve(outDirArg);
fs.mkdirSync(outDir,{recursive:true});
for(const file of ["v5-roughcut.mp4","v5-contact-sheet.jpg"]){
  const src=path.join(artifactDir,file);if(fs.existsSync(src))fs.copyFileSync(src,path.join(outDir,file));
}
let report={};
try{report=JSON.parse(fs.readFileSync(path.join(artifactDir,"fast-loop-report.json"),"utf8"));}catch{}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const metric=(label,value)=>`<div class="metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V5 fast review</title><style>
body{margin:0;background:#060a0e;color:#f5f7f8;font-family:Inter,system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:36px 20px 72px}h1{font-size:30px;margin:0 0 8px}.lead{color:#aab5bd;margin:0 0 28px}.video{width:100%;background:#000;border-radius:16px;box-shadow:0 18px 70px #0008}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0 28px}.metric{border:1px solid #ffffff18;background:#ffffff08;border-radius:12px;padding:14px}.metric strong{display:block;font-size:24px}.metric span{font-size:12px;color:#9ba9b2}.sheet{width:100%;border-radius:12px;border:1px solid #ffffff18}.note{margin-top:18px;padding:16px;border-left:3px solid #5be1ff;background:#5be1ff0c;color:#c9d2d8;line-height:1.55}</style></head><body><main>
<h1>V5 · Shot-first fast loop</h1><p class="lead">This is intentionally only the opening rough cut. Reject the visual grammar here before spending compute on the full episode.</p>
<video class="video" controls preload="metadata" src="v5-roughcut.mp4"></video>
<div class="metrics">${metric("shots",report.shotCount??"—")}${metric("avg shot",report.avgShotSeconds?`${Number(report.avgShotSeconds).toFixed(1)}s`:"—")}${metric("media coverage",report.mediaCoverage!=null?`${Math.round(Number(report.mediaCoverage)*100)}%`:"—")}${metric("bilingual exposure",report.bilingualRatio!=null?`${Math.round(Number(report.bilingualRatio)*100)}%`:"—")}</div>
<img class="sheet" src="v5-contact-sheet.jpg" alt="V5 contact sheet"><div class="note">Review order: 1) first 8 seconds, 2) whether shots feel like edited video rather than UI/slides, 3) whether media itself carries information, 4) subtitle reading load. Full 5–6.5 minute rendering is deliberately blocked until this grammar is acceptable.</div>
</main></body></html>`;
fs.writeFileSync(path.join(outDir,"index.html"),html);
console.log(JSON.stringify({ok:true,output:outDirArg}));
