#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [propsArg="public/generated/v5-base-render-props.json",planArg="public/generated/v5-shot-plan.json",outPropsArg="public/generated/v5-render-props.no-assets.json"]=process.argv.slice(2);
const props=JSON.parse(fs.readFileSync(propsArg,"utf8"));
const {manifest,resolved}=props;
if(manifest.experienceVersion!=="news-first-v5.0-candidate")throw new Error(`Expected news-first-v5.0-candidate, got ${manifest.experienceVersion}`);

const byUtterance=new Map(manifest.utterances.map(u=>[u.id,u]));
const byScene=new Map(manifest.scenes.map(s=>[s.id,s]));
const claimById=new Map(manifest.claims.map(c=>[c.id,c]));
const sourceById=new Map(manifest.sources.map(s=>[s.id,s]));
const uniq=xs=>[...new Set(xs.filter(Boolean))];
const hash=s=>[...s].reduce((a,c)=>((a*33)^c.charCodeAt(0))>>>0,5381);
const compact=(text,max=92)=>{
  const clean=String(text??"").replace(/\s+/g," ").trim();
  if(clean.length<=max)return clean;
  const cut=clean.slice(0,max+1);const i=cut.lastIndexOf(" ");
  return `${cut.slice(0,i>45?i:max).replace(/[,:;]$/,'')}…`;
};
const sourceLabelFor=claimIds=>{
  for(const id of claimIds){
    const claim=claimById.get(id);const ev=claim?.evidence?.[0];const source=ev?sourceById.get(ev.sourceId):undefined;
    if(source)return source.publishedDate?`${source.publisher} · ${source.publishedDate}`:source.publisher;
  }
  return undefined;
};
const queryFor=(text,scene,index,kind)=>{
  if(scene.role==="hook")return index===0?"semiconductor chip":index===1?"data center server room":"high voltage power lines";
  if(scene.id.includes("setup-news"))return index%2===0?"solar farm electricity":"electricity substation";
  if(scene.id.includes("setup-growth"))return index%2===0?"high voltage power lines":"data center server room";
  const t=String(text).toLowerCase();
  if(/chip|gpu|semiconductor/.test(t))return "semiconductor chip";
  if(/substation/.test(t))return "electricity substation";
  if(/transmission|grid|power line/.test(t))return "high voltage power lines";
  if(/generation|power plant|solar|renewable/.test(t))return "solar farm electricity";
  if(/data cent|server|cloud|computing/.test(t))return "data center server room";
  if(/ipo|share|invest|capital|financ/.test(t))return kind==="evidence"?"solar farm electricity":"data center server room";
  if(/construction|permit|build/.test(t))return "electricity substation";
  return index%2===0?"high voltage power lines":"data center server room";
};
const cameraFor=id=>{
  const h=hash(id);const dir=h%2===0?1:-1;const vertical=(h%5)-2;
  return {scaleFrom:1.10+(h%3)*0.01,scaleTo:1.025,xFrom:-1.8*dir,xTo:1.3*dir,yFrom:vertical*.35,yTo:-vertical*.15};
};
const metricFor=(scene,text)=>{
  const v=scene.visual;
  if(v.type==="metric")return {value:v.value,unit:v.unit,label:v.label};
  const percent=String(text).match(/(\d+(?:\.\d+)?)\s*%/i);
  if(percent)return {value:percent[1],unit:"%",label:"KEY NUMBER"};
  return undefined;
};
const kindFor=(scene,index,total)=>{
  if(scene.role==="hook")return index===0?"cold-open":index===1?"question":"broll";
  if(scene.role==="phrase")return "phrase";
  if(scene.role==="recap")return "recap";
  const t=scene.visual.type;
  if(t==="metric")return index%2===0?"metric":"broll";
  if(t==="chain")return index%2===0?"mechanism":"broll";
  if(t==="compare")return index%2===0?"contrast":"broll";
  if(t==="timeline")return index===0?"evidence":index%2===0?"evidence":"broll";
  if(t==="card")return index===0?"evidence":"broll";
  return total===1?"broll":index%2===0?"broll":"evidence";
};

// Prefer real semantic cue boundaries, but never allow a long cue gap to turn
// into another 12–16 second static screen. Insert editorial cuts inside long
// gaps so the opening can be falsified quickly as actual video grammar.
const cutPointsFor=rs=>{
  const MIN=72;      // 2.4s: avoid nervous micro-cuts
  const TARGET=138;  // 4.6s: useful rough-cut rhythm
  const MAX=165;     // 5.5s: hard planning ceiling before the checker
  const candidates=uniq([0,...rs.cues.map(c=>c.startFrame),rs.durationFrames]).sort((a,b)=>a-b);
  const points=[0];
  for(const candidate of candidates.slice(1)){
    let last=points.at(-1);
    let gap=candidate-last;
    while(gap>MAX){
      const next=Math.min(candidate-MIN,last+TARGET);
      if(next-last<MIN)break;
      points.push(next);last=next;gap=candidate-last;
    }
    if(candidate===rs.durationFrames){
      if(candidate>points.at(-1))points.push(candidate);
      continue;
    }
    if(candidate-points.at(-1)>=MIN&&rs.durationFrames-candidate>=36)points.push(candidate);
  }
  // If a tiny tail was produced, merge it backward unless doing so breaks MAX.
  if(points.length>=3){
    const tail=points.at(-1)-points.at(-2);
    const merged=points.at(-1)-points.at(-3);
    if(tail<36&&merged<=MAX)points.splice(points.length-2,1);
  }
  return points;
};

const shots=[];
for(const rs of resolved.scenes){
  const scene=byScene.get(rs.sceneId);if(!scene)continue;
  const points=cutPointsFor(rs);
  const segments=[];
  for(let i=0;i<points.length-1;i++){
    const start=points[i],end=points[i+1];if(end-start<20)continue;
    segments.push({start,end});
  }
  for(let i=0;i<segments.length;i++){
    const seg=segments[i];
    const cues=rs.cues.filter(c=>c.endFrame>seg.start&&c.startFrame<seg.end);
    const utteranceIds=uniq(cues.map(c=>c.utteranceId));
    const fallbackIds=scene.utteranceIds.slice(Math.min(i,Math.max(0,scene.utteranceIds.length-1)),Math.min(i+1,scene.utteranceIds.length));
    const ids=utteranceIds.length?utteranceIds:fallbackIds;
    const utterances=ids.map(id=>byUtterance.get(id)).filter(Boolean);
    const text=utterances.map(u=>u.text).join(" ")||scene.utteranceIds.map(id=>byUtterance.get(id)?.text??"").join(" ");
    const claimIds=uniq(utterances.flatMap(u=>u.claimIds??[]));
    const kind=kindFor(scene,i,segments.length);
    const metric=metricFor(scene,text);
    const id=`shot-${scene.id}-${String(i+1).padStart(2,"0")}`;
    const headline=kind==="question"?manifest.centralQuestion:kind==="recap"?manifest.answer:metric?metric.label:compact(text,kind==="cold-open"?78:94);
    const sourceLabel=sourceLabelFor(claimIds);
    const bilingual=kind==="cold-open"||kind==="question"||kind==="phrase"||(kind==="metric"&&i===0)||(kind==="evidence"&&i===0&&scene.beat==="complication");
    const ja=utterances[0]?.translationJa;
    const focus=["left","center","right"][(hash(id)>>2)%3];
    shots.push({
      id,
      sceneId:scene.id,
      startFrame:rs.startFrame+seg.start,
      durationFrames:seg.end-seg.start,
      kind,
      utteranceIds:ids,
      claimIds,
      headline,
      subhead:kind==="question"?"Follow the money, then follow the power.":undefined,
      sourceLabel,
      metric,
      searchQuery:queryFor(`${headline} ${text}`,scene,i,kind),
      captionMode:bilingual?"en-ja":"en",
      japaneseAnchor:bilingual?ja:undefined,
      focus,
      camera:cameraFor(id),
    });
  }
}

const plan={
  version:"1.0.0",
  experienceVersion:"news-first-v5.0-candidate",
  episodeId:manifest.episodeId,
  revision:manifest.revision,
  manifestHash:resolved.manifestHash,
  generatedAt:new Date().toISOString(),
  shots,
};
fs.mkdirSync(path.dirname(planArg),{recursive:true});
fs.writeFileSync(planArg,JSON.stringify(plan,null,2)+"\n");
fs.writeFileSync(outPropsArg,JSON.stringify({...props,shotPlan:plan,shotAssets:[]},null,2)+"\n");
const first36=shots.filter(s=>s.startFrame<36*resolved.fps);
console.log(JSON.stringify({ok:true,shots:shots.length,first36Shots:first36.length,first36Kinds:first36.map(s=>s.kind),first36Durations:first36.map(s=>(s.durationFrames/resolved.fps).toFixed(1)),plan:planArg,props:outPropsArg}));
