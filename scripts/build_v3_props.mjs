#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const specPath=process.argv[2]??"episodes/2026-09-15-ai-power-project/v3.json";
const timingPath=process.argv[3]??"public/generated/v3/timing.json";
const brollPath=process.argv[4]??"public/generated/v3/broll/manifest.json";
const outPath=process.argv[5]??"public/generated/v3/render-props.json";
const spec=JSON.parse(fs.readFileSync(specPath,"utf8"));
const timing=JSON.parse(fs.readFileSync(timingPath,"utf8"));
const broll=fs.existsSync(brollPath)?JSON.parse(fs.readFileSync(brollPath,"utf8")):{generated:[]};
const ids=new Set(spec.scenes.map(s=>s.id));
for(const item of timing.scenes){if(!ids.has(item.id))throw new Error(`timing references unknown scene ${item.id}`);}
if(timing.scenes.length!==spec.scenes.length)throw new Error(`scene count mismatch spec=${spec.scenes.length} timing=${timing.scenes.length}`);
const missingBroll=[...new Set(spec.scenes.flatMap(s=>typeof s.visual?.query==="string"?[s.visual.query]:[]))].filter(q=>!broll.generated.some(a=>a.query===q));
if(missingBroll.length)console.warn(`[v3] missing optional B-roll: ${missingBroll.join(", ")}`);
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify({spec,timing,brollAssets:broll.generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,outPath,durationSeconds:timing.durationSeconds,brollAssets:broll.generated.length,missingBroll}));
