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
const clipped=shots.map(s=>({...s,start:Math.max(0,s.startFrame),end:Math.min(windowFrames,s.startFrame+s.durationFrames)})).filter(s=>s.end>s.start).sort((a,b)=>a.start-b.start);
let cursor=0,overlapFrames=0,gapFrames=0;
for(const shot of clipped){
  if(shot.start>cursor)gapFrames+=shot.start-cursor;
  if(shot.start<cursor)overlapFrames+=Math.max(0,Math.min(cursor,shot.end)-shot.start);
  cursor=Math.max(cursor,shot.end);
}
if(cursor<windowFrames)gapFrames+=windowFrames-cursor;
const visibleFrames=shot=>shot.end-shot.start;
const durations=clipped.map(s=>visibleFrames(s)/fps);
const mediaFrames=clipped.filter(s=>assetIds.has(s.id)).reduce((n,s)=>n+visibleFrames(s),0);
const bilingualFrames=clipped.filter(s=>s.captionMode==="en-ja").reduce((n,s)=>n+visibleFrames(s),0);
const textHeavyFrames=clipped.filter(s=>["cold-open","question","evidence","metric"].includes(s.kind)).reduce((n,s)=>n+visibleFrames(s),0);
const queries=new Set(clipped.map(s=>s.searchQuery).filter(Boolean));
const denominator=Math.max(1,windowFrames);
const report={
  ok:true,
  windowSeconds,
  shotCount:clipped.length,
  avgShotSeconds:durations.reduce((a,b)=>a+b,0)/Math.max(1,durations.length),
  maxShotSeconds:Math.max(0,...durations),
  timelineCoverage:(windowFrames-gapFrames)/denominator,
  overlapSeconds:overlapFrames/fps,
  gapSeconds:gapFrames/fps,
  mediaCoverage:Math.min(1,mediaFrames/denominator),
  bilingualRatio:Math.min(1,bilingualFrames/denominator),
  textHeavyRatio:Math.min(1,textHeavyFrames/denominator),
  distinctSearchQueries:queries.size,
  kinds:[...new Set(clipped.map(s=>s.kind))],
};
const failures=[];
if(report.shotCount<6)failures.push(`only ${report.shotCount} shots in first ${windowSeconds}s`);
if(report.avgShotSeconds>6.7)failures.push(`average shot ${report.avgShotSeconds.toFixed(1)}s is too static`);
if(report.maxShotSeconds>9.0)failures.push(`longest shot ${report.maxShotSeconds.toFixed(1)}s exceeds 9s fast-loop guardrail`);
if(report.overlapSeconds>0)failures.push(`shot timeline overlaps by ${report.overlapSeconds.toFixed(2)}s`);
if(report.timelineCoverage<0.98)failures.push(`shot timeline covers only ${(report.timelineCoverage*100).toFixed(0)}% of preview window`);
if(assets.length&&report.mediaCoverage<0.55)failures.push(`media coverage ${(report.mediaCoverage*100).toFixed(0)}% is below 55%`);
if(report.bilingualRatio>0.45)failures.push(`Japanese-support exposure ${(report.bilingualRatio*100).toFixed(0)}% is above 45%`);
if(report.textHeavyRatio>0.72)failures.push(`text-heavy exposure ${(report.textHeavyRatio*100).toFixed(0)}% is above 72%`);
if(report.distinctSearchQueries<4)failures.push(`only ${report.distinctSearchQueries} distinct media queries`);
report.ok=failures.length===0;
console.log(JSON.stringify({...report,failures},null,2));
if(failures.length)process.exit(2);
