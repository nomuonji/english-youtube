#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const manifestPath=process.argv[2]??"fixtures/v2.1-demo.json";
const outputPath=process.argv[3]??"public/generated/image-briefs.json";
const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
const scenes=manifest.scenes.filter((s)=>s.role==="hook"||s.role==="story");

const chosen=[];
const hook=scenes.find((s)=>s.role==="hook");
if(hook)chosen.push({scene:hook,purpose:"hook"});
for(const [beat,purpose] of [["mechanism","analogy"],["complication","context"],["answer","context"]]){
  const scene=scenes.find((s)=>s.role==="story"&&s.beat===beat&&["chain","compare","timeline","card"].includes(s.visual.type))??scenes.find((s)=>s.role==="story"&&s.beat===beat);
  if(scene&&!chosen.some((x)=>x.scene.id===scene.id))chosen.push({scene,purpose});
}
for(const scene of scenes){if(chosen.length>=4)break;if(!chosen.some((x)=>x.scene.id===scene.id)&&["card","metric","timeline"].includes(scene.visual.type))chosen.push({scene,purpose:"context"});}

const sceneSummary=(scene)=>scene.utteranceIds.map((id)=>manifest.utterances.find((u)=>u.id===id)?.text).filter(Boolean).join(" ").slice(0,700);
const seed=(id)=>[...id].reduce((acc,c)=>((acc*31+c.charCodeAt(0))>>>0),2166136261)%2147483647;
const searchQuery=(scene,purpose)=>{
  const t=sceneSummary(scene).toLowerCase();
  if(/server|data cent|cloud|computing/.test(t))return "data center server room computing";
  if(/grid|transmission|power line/.test(t))return "high voltage electricity transmission grid";
  if(/substation/.test(t))return "electric substation high voltage";
  if(/power plant|generation|nuclear|renewable/.test(t))return "electric power generation infrastructure";
  if(/chip|gpu|semiconductor/.test(t))return "GPU semiconductor computing hardware";
  if(/finance|ipo|invest|shares/.test(t))return "technology finance investment stock market";
  const category=String(manifest.category??"technology").replaceAll("_"," ");
  return purpose==="hook"?`${category} technology`:purpose==="analogy"?`${category} infrastructure`:`${category} system`;
};
const briefs=chosen.slice(0,4).map(({scene,purpose})=>({
  sceneId:scene.id,
  purpose,
  seed:seed(scene.id),
  searchQuery:searchQuery(scene,purpose),
  prompt:[
    "Editorial documentary illustration for a serious business-news English YouTube explainer.",
    `Central question: ${manifest.centralQuestion}`,
    `Scene meaning: ${sceneSummary(scene)}`,
    purpose==="hook"?"Create one instantly readable visual with a strong focal point and tension; it must work in the first seconds of a video.":purpose==="analogy"?"Turn the mechanism into a concrete visual metaphor that removes the need for explanatory text.":"Create a concrete contextual scene that makes the abstract explanation intuitive.",
    "16:9 landscape composition, cinematic documentary or sophisticated magazine editorial style, realistic lighting, no logos, no captions, no readable text, no UI, no infographic labels, strong depth and one obvious focal point, avoid visual clutter."
  ].join(" ")
}));

fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify({version:"1.2.0",episodeId:manifest.episodeId,briefs},null,2)+"\n");
console.log(JSON.stringify({ok:true,episodeId:manifest.episodeId,count:briefs.length,output:outputPath,scenes:briefs.map((b)=>b.sceneId)}));
