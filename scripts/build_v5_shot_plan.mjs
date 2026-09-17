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
const sourceFor=claimIds=>{
  for(const id of claimIds){
    const claim=claimById.get(id);const ev=claim?.evidence?.[0];const source=ev?sourceById.get(ev.sourceId):undefined;
    if(source)return source;
  }
  return undefined;
};

// Search intent is editorial, not decorative. Prefer a different concrete
// subject for each beat so a 30-second opening cannot collapse into the same
// server-room/substation still repeated under different captions.
const queryFor=(text,scene,index,kind,source)=>{
  if(scene.role==="hook"){
    return [
      "semiconductor wafer close up",
      "data center server racks aisle",
      "electrical substation aerial",
      "high voltage transmission tower landscape",
    ][index%4];
  }
  if(scene.id.includes("setup-news")){
    return [
      "stock exchange trading floor",
      "electrical substation control equipment",
      "solar photovoltaic farm aerial",
      "high voltage electricity transmission towers",
      "data center server racks aisle",
    ][index%5];
  }
  if(scene.id.includes("setup-growth")){
    return [
      "data center server racks aisle",
      "high voltage transmission tower landscape",
      "electricity grid control room",
      "power plant turbine generator hall",
    ][index%4];
  }
  const t=`${source?.title??""} ${text}`.toLowerCase();
  if(kind==="evidence"&&/ipo|share|invest|capital|financ|market/.test(t))return "stock exchange trading floor";
  if(/chip|gpu|semiconductor/.test(t))return "semiconductor wafer close up";
  if(/ipo|share|invest|capital|financ|market/.test(t))return "financial market trading floor";
  if(/substation/.test(t))return "electrical substation control equipment";
  if(/transmission|grid|power line/.test(t))return index%2===0?"high voltage electricity transmission towers":"electricity grid control room";
  if(/generation|power plant|solar|renewable/.test(t))return index%2===0?"solar photovoltaic farm aerial":"power plant turbine generator hall";
  if(/data cent|server|cloud|computing/.test(t))return index%2===0?"data center server racks aisle":"data center cooling infrastructure";
  if(/construction|permit|build/.test(t))return "electric power infrastructure construction";
  return index%2===0?"high voltage transmission tower landscape":"data center server racks aisle";
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

const cutPointsFor=rs=>{
  const MIN=72;
  const TARGET=138;
  const MAX=165;
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
  if(points.length>=3){
    const tail=points.at(-1)-points.at(-2);
    const merged=points.at(-1)-points.at(-3);
    if(tail<36&&merged<=MAX)points.splice(points.length-2,1);
  }
  return points;
};

// MeasuredTiming stores cue frames as absolute episode frames. Shot planning is
// easier and safer in scene-local coordinates, so normalize exactly once here.
const rawShots=[];
for(const rs of resolved.scenes){
  const scene=byScene.get(rs.sceneId);if(!scene)continue;
  const localCues=rs.cues
    .map(c=>({...c,startFrame:Math.max(0,c.startFrame-rs.startFrame),endFrame:Math.max(1,c.endFrame-rs.startFrame)}))
    .filter(c=>c.startFrame<rs.durationFrames)
    .map(c=>({...c,endFrame:Math.min(c.endFrame,rs.durationFrames)}));
  const visualRs={...rs,cues:localCues};
  const points=cutPointsFor(visualRs);
  const segments=[];
  for(let i=0;i<points.length-1;i++){
    const start=points[i],end=points[i+1];if(end-start<20)continue;
    segments.push({start,end});
  }
  for(let i=0;i<segments.length;i++){
    const seg=segments[i];
    const cues=localCues.filter(c=>c.endFrame>seg.start&&c.startFrame<seg.end);
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
    const source=sourceFor(claimIds);
    const sourceLabel=source?(source.publishedDate?`${source.publisher} · ${source.publishedDate}`:source.publisher):undefined;
    const sourceTitle=source?.title;
    const bilingual=kind==="question"||kind==="phrase"||(kind==="metric"&&i===0)||(kind==="evidence"&&i===0&&scene.beat==="complication");
    const ja=utterances[0]?.translationJa;
    const focus=["left","center","right"][(hash(id)>>2)%3];
    rawShots.push({
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
      sourceTitle,
      metric,
      searchQuery:queryFor(`${headline} ${text}`,scene,i,kind,source),
      captionMode:kind==="cold-open"?"none":bilingual?"en-ja":"en",
      japaneseAnchor:bilingual?ja:undefined,
      focus,
      camera:cameraFor(id),
    });
  }
}

// Compiler scenes are contiguous, but keep a final defensive stitch so a future
// timing implementation cannot silently create black gaps in a review render.
rawShots.sort((a,b)=>a.startFrame-b.startFrame||a.id.localeCompare(b.id));
const shots=[];
let bridgeCount=0;
for(const shot of rawShots){
  if(!shots.length){
    if(shot.startFrame>0){
      const bridgeId=`bridge-${String(++bridgeCount).padStart(3,"0")}`;
      shots.push({...shot,id:bridgeId,startFrame:0,durationFrames:shot.startFrame,kind:"broll",utteranceIds:[],claimIds:[],headline:"",subhead:undefined,sourceLabel:undefined,sourceTitle:undefined,metric:undefined,captionMode:"none",japaneseAnchor:undefined,camera:cameraFor(bridgeId)});
    }
    shots.push(shot);continue;
  }
  const previous=shots.at(-1);
  const previousEnd=previous.startFrame+previous.durationFrames;
  let gap=shot.startFrame-previousEnd;
  if(gap>0&&gap<24){previous.durationFrames+=gap;gap=0;}
  let cursor=previous.startFrame+previous.durationFrames;
  while(gap>0){
    const duration=Math.min(135,gap);
    const bridgeId=`bridge-${String(++bridgeCount).padStart(3,"0")}`;
    shots.push({...shot,id:bridgeId,startFrame:cursor,durationFrames:duration,kind:"broll",utteranceIds:[],claimIds:[],headline:"",subhead:undefined,sourceLabel:undefined,sourceTitle:undefined,metric:undefined,captionMode:"none",japaneseAnchor:undefined,camera:cameraFor(bridgeId)});
    cursor+=duration;gap-=duration;
  }
  shots.push(shot);
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
console.log(JSON.stringify({ok:true,shots:shots.length,bridgeCount,first36Shots:first36.length,first36Kinds:first36.map(s=>s.kind),first36Durations:first36.map(s=>(s.durationFrames/resolved.fps).toFixed(1)),first36Queries:first36.map(s=>s.searchQuery),plan:planArg,props:outPropsArg}));
