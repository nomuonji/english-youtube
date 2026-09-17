import React from "react";
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from "remotion";
import type {Cue,EpisodeManifest,LearningPoint,ResolvedScene,Scene,StoryBeat,Visual} from "../contracts/types";

type Props={manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;hasMedia?:boolean};

const C={bg:"#03070B",ink:"#F7F9FB",muted:"#AAB5BF",cyan:"#62E6FF",amber:"#FFCB72",red:"#FF6675",line:"rgba(255,255,255,.18)",glass:"rgba(3,7,11,.66)"};
const enFont='Inter,"Noto Sans",Arial,sans-serif';
const jpFont='"Noto Sans CJK JP","Noto Sans JP","Yu Gothic",Meiryo,sans-serif';
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const ease=(v:number)=>1-Math.pow(1-v,3);

const cueAt=(frame:number,resolved:ResolvedScene):Cue|undefined=>resolved.cues.find(c=>c.startFrame<=frame&&frame<c.endFrame)??[...resolved.cues].sort((a,b)=>a.startFrame-b.startFrame).filter(c=>c.startFrame<=frame).at(-1);
const cueIndex=(cue:Cue|undefined,resolved:ResolvedScene)=>cue?resolved.cues.findIndex(c=>c===cue):-1;
const utteranceStart=(resolved:ResolvedScene,id:string):number|undefined=>{const starts=resolved.cues.filter(c=>c.utteranceId===id).map(c=>c.startFrame);return starts.length?Math.min(...starts):resolved.audioEvents.find(e=>e.utteranceId===id)?.startFrame;};
const revealed=(frame:number,resolved:ResolvedScene,id:string)=>{const start=utteranceStart(resolved,id);return start!==undefined&&start<=frame;};
const chapter=(beat:StoryBeat|null)=>beat==="setup"?"WHAT HAPPENED":beat==="mechanism"?"HOW IT WORKS":beat==="complication"?"THE CATCH":"WHAT IT MEANS";
const section=(scene:Scene)=>scene.role==="hook"?"THE QUESTION":scene.role==="story"?chapter(scene.beat):scene.role==="phrase"?"YOU JUST HEARD":scene.role==="recap"?"THE ANSWER":"STORY";
const visualClaimIds=(visual:Visual):string[]=>"claimIds" in visual?visual.claimIds:[];
const learningPointForCue=(manifest:EpisodeManifest,cue?:Cue):LearningPoint|undefined=>{if(!cue)return undefined;const lower=cue.text.toLowerCase();return manifest.learningPoints.find(p=>lower.includes(p.phrase.toLowerCase()))??manifest.learningPoints.find(p=>p.sourceUtteranceId===cue.utteranceId);};
const sourceLabel=(manifest:EpisodeManifest,scene:Scene)=>{
  const sourceIds=new Set<string>();
  for(const claimId of visualClaimIds(scene.visual)){
    const claim=manifest.claims.find(c=>c.id===claimId);
    for(const evidence of claim?.evidence??[])sourceIds.add(evidence.sourceId);
  }
  const publishers=[...sourceIds].map(id=>manifest.sources.find(s=>s.id===id)?.publisher).filter((v):v is string=>Boolean(v));
  return [...new Set(publishers)].slice(0,2).join(" · ");
};

const FilmWash:React.FC=()=> <>
  <AbsoluteFill style={{pointerEvents:"none",background:"linear-gradient(90deg,rgba(3,7,11,.82) 0%,rgba(3,7,11,.26) 45%,rgba(3,7,11,.48) 100%)"}}/>
  <AbsoluteFill style={{pointerEvents:"none",opacity:.05,backgroundImage:"radial-gradient(rgba(255,255,255,.34) .7px,transparent .7px)",backgroundSize:"5px 5px",mixBlendMode:"soft-light"}}/>
</>;

const EvidenceChrome:React.FC<{scene:Scene;manifest:EpisodeManifest;progress:number}>=({scene,manifest,progress})=>{
  const source=sourceLabel(manifest,scene);
  return <>
    <div style={{position:"absolute",left:74,top:56,fontFamily:enFont,fontSize:14,fontWeight:900,letterSpacing:".16em",color:"rgba(247,249,251,.72)",textTransform:"uppercase"}}>{section(scene)}</div>
    {source?<div style={{position:"absolute",right:74,top:56,fontFamily:enFont,fontSize:13,fontWeight:800,letterSpacing:".10em",color:"rgba(247,249,251,.58)",textTransform:"uppercase"}}>SOURCE · {source}</div>:null}
    <div style={{position:"absolute",left:74,right:74,top:91,height:2,background:"rgba(255,255,255,.11)"}}><div style={{height:"100%",width:`${progress*100}%`,background:C.cyan}}/></div>
  </>;
};

const AdaptiveCaption:React.FC<{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;cue?:Cue;point?:LearningPoint}>=({manifest,scene,resolved,cue,point})=>{
  if(!cue)return null;
  const index=cueIndex(cue,resolved);
  const showJa=scene.role==="hook"||scene.role==="phrase"||scene.role==="recap"||Boolean(point)||(index===0&&(scene.beat==="complication"||scene.beat==="answer"));
  return <div style={{position:"absolute",left:0,right:0,bottom:0,height:205,background:"linear-gradient(180deg,rgba(3,7,11,0) 0%,rgba(3,7,11,.62) 42%,rgba(3,7,11,.94) 100%)",display:"flex",alignItems:"flex-end",padding:"0 92px 34px",zIndex:30}}>
    <div style={{maxWidth:1510}}>
      {point?<div style={{display:"inline-flex",fontFamily:enFont,fontSize:12,fontWeight:900,letterSpacing:".13em",color:C.cyan,border:`1px solid rgba(98,230,255,.42)`,borderRadius:999,padding:"5px 10px",marginBottom:7,background:"rgba(3,7,11,.66)"}}>{point.phrase.toUpperCase()} · {point.meaningJa}</div>:null}
      <div style={{fontFamily:enFont,fontSize:36,lineHeight:1.13,fontWeight:800,letterSpacing:"-.015em",color:C.ink,textShadow:"0 4px 24px rgba(0,0,0,.95)"}}>{cue.text}</div>
      {showJa?<div style={{fontFamily:jpFont,fontSize:18,lineHeight:1.35,fontWeight:650,color:"rgba(247,249,251,.68)",marginTop:6,textShadow:"0 3px 16px rgba(0,0,0,.95)"}}>{cue.translationJa}</div>:null}
    </div>
  </div>;
};

const CardVisual:React.FC<{manifest:EpisodeManifest;scene:Scene;hasMedia:boolean}>=({manifest,scene,hasMedia})=>{
  if(scene.visual.type!=="card")return null;
  const v=scene.visual;
  const isHook=scene.role==="hook";
  return <div style={{position:"absolute",left:92,right:92,top:150,bottom:230,display:"flex",alignItems:hasMedia?"flex-end":"center"}}>
    <div style={{maxWidth:isHook?1380:1160,padding:hasMedia?"0 0 22px":"36px 40px",borderRadius:24,background:hasMedia?"transparent":"rgba(3,7,11,.54)",border:hasMedia?"none":`1px solid ${C.line}`}}>
      <div style={{fontFamily:enFont,fontSize:isHook?82:56,lineHeight:1.03,fontWeight:950,letterSpacing:"-.045em",color:isHook?C.red:C.ink,textShadow:"0 6px 34px rgba(0,0,0,.94)"}}>{v.headline||manifest.centralQuestion}</div>
      {!hasMedia&&v.body?<div style={{fontFamily:enFont,fontSize:27,lineHeight:1.35,fontWeight:650,color:C.muted,marginTop:18,maxWidth:1040}}>{v.body}</div>:null}
    </div>
  </div>;
};

const MetricVisual:React.FC<{scene:Scene}>=({scene})=>{
  if(scene.visual.type!=="metric")return null;
  const v=scene.visual;const frame=useCurrentFrame();const p=ease(interpolate(frame,[5,44],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  const raw=v.value.match(/^([~]?)(-?\d+(?:\.\d+)?)$/);const decimals=raw?.[2]?.includes(".")?(raw[2].split(".")[1]?.length??0):0;const value=raw?`${raw[1]??""}${(Number(raw[2])*p).toFixed(decimals)}`:v.value;
  return <div style={{position:"absolute",left:96,right:96,top:150,bottom:235,display:"grid",gridTemplateColumns:"1.18fr .82fr",gap:54,alignItems:"center"}}>
    <div><div style={{fontFamily:enFont,fontSize:18,fontWeight:900,letterSpacing:".16em",color:"rgba(247,249,251,.62)",textTransform:"uppercase"}}>{v.label}</div><div style={{fontFamily:enFont,fontSize:178,lineHeight:.92,fontWeight:950,letterSpacing:"-.065em",color:C.cyan,textShadow:"0 0 56px rgba(98,230,255,.18)",marginTop:18}}>{value}<span style={{fontSize:50,letterSpacing:"-.02em",color:C.ink,marginLeft:14}}>{v.unit}</span></div></div>
    <div style={{borderLeft:`1px solid ${C.line}`,paddingLeft:34}}><div style={{fontFamily:enFont,fontSize:33,lineHeight:1.17,fontWeight:860,color:C.ink}}>{v.qualifier}</div><div style={{height:6,borderRadius:999,background:"rgba(255,255,255,.11)",marginTop:28,overflow:"hidden"}}><div style={{width:`${Math.max(8,p*100)}%`,height:"100%",background:C.cyan}}/></div></div>
  </div>;
};

const ChainVisual:React.FC<{scene:Scene;resolved:ResolvedScene;globalFrame:number}>=({scene,resolved,globalFrame})=>{
  if(scene.visual.type!=="chain")return null;
  const v=scene.visual;
  return <div style={{position:"absolute",left:100,right:100,top:190,bottom:240,display:"flex",alignItems:"center",gap:12}}>{v.nodes.map((node,index)=>{const on=revealed(globalFrame,resolved,node.revealAtUtteranceId);return <React.Fragment key={`${node.label}-${index}`}><div style={{flex:1,padding:"24px 18px",borderTop:`3px solid ${on?C.cyan:"rgba(255,255,255,.16)"}`,background:on?"linear-gradient(180deg,rgba(98,230,255,.10),rgba(3,7,11,.22))":"rgba(3,7,11,.22)",fontFamily:enFont,fontSize:27,fontWeight:870,lineHeight:1.15,color:on?C.ink:"rgba(247,249,251,.38)",minHeight:148,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>{node.label}</div>{index<v.nodes.length-1?<div style={{fontFamily:enFont,fontSize:31,color:on?C.cyan:"rgba(255,255,255,.16)"}}>→</div>:null}</React.Fragment>;})}</div>;
};

const CompareVisual:React.FC<{scene:Scene;resolved:ResolvedScene;globalFrame:number}>=({scene,resolved,globalFrame})=>{
  if(scene.visual.type!=="compare")return null;
  const v=scene.visual;
  return <div style={{position:"absolute",left:98,right:98,top:150,bottom:230}}>
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr 1fr",gap:14,marginBottom:10}}><div/><div style={{fontFamily:enFont,fontSize:27,fontWeight:930,color:C.cyan}}>{v.leftTitle}</div><div style={{fontFamily:enFont,fontSize:27,fontWeight:930,color:C.amber}}>{v.rightTitle}</div></div>
    <div style={{display:"grid",gap:8}}>{v.rows.map((row,index)=>{const on=revealed(globalFrame,resolved,row.revealAtUtteranceId);return <div key={`${row.aspect}-${index}`} style={{display:"grid",gridTemplateColumns:"220px 1fr 1fr",gap:14,opacity:on?1:.28}}><div style={{fontFamily:enFont,fontSize:17,fontWeight:850,letterSpacing:".08em",color:C.muted,padding:"16px 12px",textTransform:"uppercase"}}>{row.aspect}</div><div style={{fontFamily:enFont,fontSize:24,fontWeight:760,color:C.ink,padding:"16px 18px",borderLeft:`2px solid ${C.cyan}`,background:"rgba(3,7,11,.46)"}}>{row.left}</div><div style={{fontFamily:enFont,fontSize:24,fontWeight:760,color:C.ink,padding:"16px 18px",borderLeft:`2px solid ${C.amber}`,background:"rgba(3,7,11,.46)"}}>{row.right}</div></div>;})}</div>
  </div>;
};

const TimelineVisual:React.FC<{scene:Scene;resolved:ResolvedScene;globalFrame:number}>=({scene,resolved,globalFrame})=>{
  if(scene.visual.type!=="timeline")return null;
  const v=scene.visual;
  return <div style={{position:"absolute",left:108,right:108,top:210,bottom:250,display:"flex",alignItems:"center"}}>{v.events.map((event,index)=>{const on=revealed(globalFrame,resolved,event.revealAtUtteranceId);return <React.Fragment key={`${event.dateLabel}-${index}`}><div style={{flex:1,opacity:on?1:.30}}><div style={{height:4,background:on?C.cyan:"rgba(255,255,255,.15)"}}/><div style={{fontFamily:enFont,fontSize:18,fontWeight:900,letterSpacing:".10em",color:on?C.cyan:C.muted,marginTop:18}}>{event.dateLabel}</div><div style={{fontFamily:enFont,fontSize:27,fontWeight:850,lineHeight:1.18,color:C.ink,marginTop:9,paddingRight:22}}>{event.label}</div></div>{index<v.events.length-1?<div style={{width:20}}/>:null}</React.Fragment>;})}</div>;
};

const ReplayVisual:React.FC<{manifest:EpisodeManifest;scene:Scene}>=({manifest,scene})=>{
  if(scene.visual.type!=="phrase")return null;
  const point=manifest.learningPoints.find(p=>p.id===scene.visual.learningPointId);const source=point?manifest.utterances.find(u=>u.id===point.sourceUtteranceId):undefined;
  return <div style={{position:"absolute",left:110,right:110,top:175,bottom:235,display:"flex",alignItems:"center"}}><div style={{maxWidth:1450}}><div style={{fontFamily:enFont,fontSize:18,fontWeight:900,letterSpacing:".18em",color:C.cyan}}>YOU JUST HEARD</div><div style={{fontFamily:enFont,fontSize:78,fontWeight:950,lineHeight:1.02,letterSpacing:"-.045em",color:C.ink,marginTop:18}}>{point?.phrase}</div><div style={{fontFamily:jpFont,fontSize:24,fontWeight:700,color:"rgba(247,249,251,.65)",marginTop:13}}>{point?.meaningJa}</div>{source?<div style={{fontFamily:enFont,fontSize:28,lineHeight:1.35,fontWeight:650,color:"rgba(247,249,251,.78)",marginTop:30,borderLeft:`3px solid ${C.cyan}`,paddingLeft:20,maxWidth:1280}}>{source.text}</div>:null}</div></div>;
};

const RecapVisual:React.FC<{manifest:EpisodeManifest;scene:Scene}>=({manifest,scene})=>{
  if(scene.visual.type!=="recap")return null;
  const points=scene.visual.learningPointIds.map(id=>manifest.learningPoints.find(p=>p.id===id)).filter((p):p is LearningPoint=>Boolean(p));
  return <div style={{position:"absolute",left:100,right:100,top:155,bottom:235,display:"grid",gridTemplateColumns:"1.35fr .65fr",gap:52,alignItems:"center"}}><div><div style={{fontFamily:enFont,fontSize:18,fontWeight:900,letterSpacing:".17em",color:C.cyan}}>THE ANSWER</div><div style={{fontFamily:enFont,fontSize:56,fontWeight:940,lineHeight:1.08,letterSpacing:"-.032em",color:C.ink,marginTop:18}}>{manifest.answer}</div></div><div style={{display:"grid",gap:14}}>{points.map(point=><div key={point.id} style={{borderTop:`1px solid ${C.line}`,paddingTop:13}}><div style={{fontFamily:enFont,fontSize:23,fontWeight:900,color:C.cyan}}>{point.phrase}</div><div style={{fontFamily:jpFont,fontSize:16,fontWeight:650,color:"rgba(247,249,251,.58)",marginTop:3}}>{point.meaningJa}</div></div>)}</div></div>;
};

const MainVisual:React.FC<{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;globalFrame:number;hasMedia:boolean}>=({manifest,scene,resolved,globalFrame,hasMedia})=>{
  if(scene.visual.type==="card")return <CardVisual manifest={manifest} scene={scene} hasMedia={hasMedia}/>;
  if(scene.visual.type==="metric")return <MetricVisual scene={scene}/>;
  if(scene.visual.type==="chain")return <ChainVisual scene={scene} resolved={resolved} globalFrame={globalFrame}/>;
  if(scene.visual.type==="compare")return <CompareVisual scene={scene} resolved={resolved} globalFrame={globalFrame}/>;
  if(scene.visual.type==="timeline")return <TimelineVisual scene={scene} resolved={resolved} globalFrame={globalFrame}/>;
  if(scene.visual.type==="phrase")return <ReplayVisual manifest={manifest} scene={scene}/>;
  if(scene.visual.type==="recap")return <RecapVisual manifest={manifest} scene={scene}/>;
  return null;
};

export const DocumentarySceneRenderer:React.FC<Props>=({manifest,scene,resolved,hasMedia=false})=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const globalFrame=resolved.startFrame+frame;const cue=cueAt(globalFrame,resolved);const point=learningPointForCue(manifest,cue);const sceneIndex=Math.max(0,manifest.scenes.findIndex(s=>s.id===scene.id));const progress=clamp((sceneIndex+frame/Math.max(1,resolved.durationFrames))/Math.max(1,manifest.scenes.length));const enter=spring({frame,fps,config:{damping:24,stiffness:110,mass:.82}});
  return <AbsoluteFill style={{background:hasMedia?"transparent":"radial-gradient(circle at 78% 20%,rgba(98,230,255,.10),transparent 28%),linear-gradient(135deg,#020508,#071019 58%,#03070B)",color:C.ink,overflow:"hidden",opacity:enter}}>
    <FilmWash/>
    <EvidenceChrome scene={scene} manifest={manifest} progress={progress}/>
    <MainVisual manifest={manifest} scene={scene} resolved={resolved} globalFrame={globalFrame} hasMedia={hasMedia}/>
    <AdaptiveCaption manifest={manifest} scene={scene} resolved={resolved} cue={cue} point={point}/>
  </AbsoluteFill>;
};
