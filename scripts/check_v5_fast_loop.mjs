#!/usr/bin/env node
import fs from "node:fs";

const [planArg="public/generated/v5-shot-plan.json",assetsArg="public/generated/v5-shot-images/manifest.json"]=process.argv.slice(2);
const plan=JSON.parse(fs.readFileSync(planArg,"utf8"));
const assets=fs.existsSync(assetsArg)?JSON.parse(fs.readFileSync(assetsArg,"utf8")).generated??[]:[];
const assetIds=new Set(assets.map(a=>a.shotId));
const fps=30;
const windowSeconds=Number(process.env.V5_PREVIEW_SECONDS??"36");
const windowFrames=windowSeconds*fps;
const shots=(plan.shots??[]).filter(s=>s.startFrame<windowFrames&&s.startFrame+s.durationFrames>0);
const clipped=shots.map(s=>({...s,visibleFrames:Math.max(0,Math.min(windowFrames,s.startFrame+s.durationFrames)-Math.max(0,s.startFrame))}));
const totalVisible=clipped.reduce((n,s)=>n+s.visibleFrames,0)||1;
const durations=clipped.map(s=>s.visibleFrames/fps);
const mediaFrames=clipped.filter(s=>assetIds.has(s.id)).reduce((n,s)=>n+s.visibleFrames,0);
const bilingualFrames=clipped.filter(s=>s.captionMode==="en-ja").reduce((n,s)=>n+s.visibleFrames,0);
const textHeavyFrames=clipped.filter(s=>["cold-open","question","evidence","metric"].includes(s.kind)).reduce((n,s)=>n+s.visibleFrames,0);
const queries=new Set(clipped.map(s=>s.searchQuery).filter(Boolean));
const report={
  ok:true,
  windowSeconds,
  shotCount:clipped.length,
  avgShotSeconds:durations.reduce((a,b)=>a+b,0)/Math.max(1,durations.length),
  maxShotSeconds:Math.max(0,...durations),
  mediaCoverage:mediaFrames/totalVisible,
  bilingualRatio:bilingualFrames/totalVisible,
  textHeavyRatio:textHeavyFrames/totalVisible,
  distinctSearchQueries:queries.size,
  kinds:[...new Set(clipped.map(s=>s.kind))],
};
const failures=[];
if(report.shotCount<6)failures.push(`only ${report.shotCount} shots in first ${windowSeconds}s`);
if(report.avgShotSeconds>6.7)failures.push(`average shot ${report.avgShotSeconds.toFixed(1)}s is too static`);
if(report.maxShotSeconds>9.0)failures.push(`longest shot ${report.maxShotSeconds.toFixed(1)}s exceeds 9s fast-loop guardrail`);
if(assets.length&&report.mediaCoverage<0.55)failures.push(`media coverage ${(report.mediaCoverage*100).toFixed(0)}% is below 55%`);
if(report.bilingualRatio>0.45)failures.push(`Japanese-support exposure ${(report.bilingualRatio*100).toFixed(0)}% is above 45%`);
if(report.textHeavyRatio>0.72)failures.push(`text-heavy exposure ${(report.textHeavyRatio*100).toFixed(0)}% is above 72%`);
if(report.distinctSearchQueries<4)failures.push(`only ${report.distinctSearchQueries} distinct media queries`);
report.ok=failures.length===0;
console.log(JSON.stringify({...report,failures},null,2));
if(failures.length)process.exit(2);
