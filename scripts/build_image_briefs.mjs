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
const mechanism=scenes.find((s)=>s.role==="story"&&s.beat==="mechanism"&&["chain","compare"].includes(s.visual.type));
if(mechanism&&!chosen.some((x)=>x.scene.id===mechanism.id))chosen.push({scene:mechanism,purpose:"analogy"});
const complication=scenes.find((s)=>s.role==="story"&&s.beat==="complication");
if(complication&&!chosen.some((x)=>x.scene.id===complication.id))chosen.push({scene:complication,purpose:"context"});
for(const scene of scenes){if(chosen.length>=3)break;if(!chosen.some((x)=>x.scene.id===scene.id)&&["card","metric","timeline"].includes(scene.visual.type))chosen.push({scene,purpose:"context"});}

const sceneSummary=(scene)=>{
  const lines=scene.utteranceIds.map((id)=>manifest.utterances.find((u)=>u.id===id)?.text).filter(Boolean);
  return lines.join(" ").slice(0,700);
};
const seed=(id)=>[...id].reduce((acc,c)=>((acc*31+c.charCodeAt(0))>>>0),2166136261)%2147483647;
const central=String(manifest.centralQuestion??"").toLowerCase();
const energy=central.includes("power")||central.includes("energy")||central.includes("data center");
const searchQuery=(purpose)=>{
  if(energy){
    if(purpose==="hook")return "data center server room";
    if(purpose==="analogy")return "high voltage electricity transmission grid";
    return "power plant electricity infrastructure";
  }
  const category=String(manifest.category??"technology").replaceAll("_"," ");
  return purpose==="hook"?`${category} technology`:purpose==="analogy"?`${category} infrastructure`:`${category} system`;
};
const briefs=chosen.slice(0,3).map(({scene,purpose})=>({
  sceneId:scene.id,
  purpose,
  seed:seed(scene.id),
  searchQuery:searchQuery(purpose),
  prompt:[
    "Editorial documentary illustration for a serious long-form YouTube explainer.",
    `Central question: ${manifest.centralQuestion}`,
    `Scene meaning: ${sceneSummary(scene)}`,
    purpose==="hook"?"Create one instantly readable visual metaphor with a strong focal point.":purpose==="analogy"?"Turn the mechanism into a concrete visual metaphor that reduces the need for explanatory text.":"Create a concrete contextual scene that makes the abstract explanation intuitive.",
    "16:9 landscape composition, cinematic but clean, sophisticated magazine editorial style, realistic lighting, no logos, no captions, no readable text, no UI, no infographic labels, leave calm negative space, avoid visual clutter."
  ].join(" ")
}));

fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify({version:"1.1.0",episodeId:manifest.episodeId,briefs},null,2)+"\n");
console.log(JSON.stringify({ok:true,episodeId:manifest.episodeId,count:briefs.length,output:outputPath,scenes:briefs.map((b)=>b.sceneId)}));
