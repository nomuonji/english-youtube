import React from "react";
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from "remotion";
import type {Cue,EpisodeManifest,LearningPoint,ResolvedScene,Scene,StoryBeat} from "../contracts/types";

type Props={manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;hasMedia?:boolean};

const C={
  bg:"#050A10",
  bg2:"#071827",
  white:"#F7FAFC",
  muted:"#A9B8C6",
  electric:"#4FD7FF",
  electric2:"#00A8FF",
  danger:"#FF4D5E",
  warm:"#FFB84D",
  line:"rgba(255,255,255,.17)",
};
const enFont='Inter,"Noto Sans",Arial,sans-serif';
const jpFont='"Noto Sans CJK JP","Noto Sans JP","Yu Gothic",Meiryo,sans-serif';
const ease=(v:number)=>1-Math.pow(1-v,3);
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));

const cueAt=(frame:number,resolved:ResolvedScene):Cue|undefined=>{
  const direct=resolved.cues.find(c=>c.startFrame<=frame&&frame<c.endFrame);
  if(direct)return direct;
  return [...resolved.cues].sort((a,b)=>a.startFrame-b.startFrame).filter(c=>c.startFrame<=frame).at(-1);
};
const utteranceStart=(resolved:ResolvedScene,id:string):number|undefined=>{
  const cueStarts=resolved.cues.filter(c=>c.utteranceId===id).map(c=>c.startFrame);
  if(cueStarts.length)return Math.min(...cueStarts);
  return resolved.audioEvents.find(e=>e.utteranceId===id)?.startFrame;
};
const revealed=(frame:number,resolved:ResolvedScene,id:string)=>{
  const start=utteranceStart(resolved,id);
  return start!==undefined&&start<=frame;
};
const learningPointForCue=(manifest:EpisodeManifest,cue?:Cue):LearningPoint|undefined=>{
  if(!cue)return undefined;
  const text=cue.text.toLowerCase();
  return manifest.learningPoints.find(p=>text.includes(p.phrase.toLowerCase()))??manifest.learningPoints.find(p=>p.sourceUtteranceId===cue.utteranceId);
};
const chapter=(beat:StoryBeat|null)=>beat==="setup"?"WHAT CHANGED":beat==="mechanism"?"HOW IT WORKS":beat==="complication"?"THE CATCH":"WHAT IT MEANS";
const sectionFor=(scene:Scene)=>scene.role==="hook"?"THE QUESTION":scene.role==="story"?chapter(scene.beat):scene.role==="phrase"?"ENGLISH REPLAY":scene.role==="recap"?"TAKEAWAY":scene.role==="retrieval"?"LISTENING CHECK":"STORY";
const phaseAt=(frame:number,resolved:ResolvedScene)=>resolved.phases.find(p=>p.startFrame<=frame&&frame<p.endFrame)?.name??"normal";

const Texture:React.FC=()=> <>
  <AbsoluteFill style={{pointerEvents:"none",background:"radial-gradient(circle at 76% 24%,rgba(79,215,255,.13),transparent 30%),linear-gradient(100deg,rgba(3,8,13,.90) 0%,rgba(3,8,13,.42) 52%,rgba(3,8,13,.67) 100%)"}}/>
  <AbsoluteFill style={{pointerEvents:"none",opacity:.055,backgroundImage:"radial-gradient(rgba(255,255,255,.36) .7px,transparent .7px)",backgroundSize:"5px 5px",mixBlendMode:"soft-light"}}/>
</>;

const SectionTag:React.FC<{label:string;progress:number}>=({label,progress})=><>
  <div style={{position:"absolute",left:106,top:70,fontFamily:enFont,fontSize:19,fontWeight:900,letterSpacing:".15em",color:C.electric,textTransform:"uppercase",textShadow:"0 2px 14px rgba(0,0,0,.8)"}}>{label}</div>
  <div style={{position:"absolute",left:106,right:106,top:112,height:3,borderRadius:999,background:"rgba(255,255,255,.10)"}}><div style={{height:"100%",width:`${progress*100}%`,borderRadius:999,background:C.electric}}/></div>
</>;

const CaptionBed:React.FC<{cue?:Cue;point?:LearningPoint;hidden?:boolean}>=({cue,point,hidden=false})=><div style={{position:"absolute",left:0,right:0,bottom:0,height:250,background:"linear-gradient(180deg,rgba(3,8,13,0) 0%,rgba(3,8,13,.78) 30%,rgba(3,8,13,.98) 100%)",display:"flex",alignItems:"flex-end",padding:"0 108px 44px",zIndex:20}}>
  {!hidden&&cue?<div style={{width:"100%"}}>
    {point?<div style={{display:"inline-flex",padding:"5px 10px",borderRadius:999,border:"1px solid rgba(79,215,255,.46)",background:"rgba(0,168,255,.13)",fontFamily:enFont,fontSize:13,fontWeight:900,letterSpacing:".1em",color:C.electric,marginBottom:9}}>BUSINESS ENGLISH · {point.meaningJa}</div>:null}
    <div style={{fontFamily:enFont,fontSize:40,lineHeight:1.15,fontWeight:790,letterSpacing:"-.014em",color:C.white,textShadow:"0 4px 22px rgba(0,0,0,.92)"}}>{cue.text}</div>
    <div style={{fontFamily:jpFont,fontSize:22,lineHeight:1.35,fontWeight:600,color:"rgba(247,250,252,.70)",marginTop:7,textShadow:"0 3px 16px rgba(0,0,0,.88)"}}>{cue.translationJa}</div>
  </div>:null}
</div>;

const HeroText:React.FC<{headline:string;subline?:string;danger?:boolean;compact?:boolean}>=({headline,subline,danger=false,compact=false})=>{
  const frame=useCurrentFrame();
  const p=ease(interpolate(frame,[2,15],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  return <div style={{maxWidth:compact?1210:1420,opacity:p,transform:`translateY(${(1-p)*24}px)`}}>
    <div style={{fontFamily:enFont,fontSize:compact?58:78,fontWeight:950,lineHeight:1.05,letterSpacing:"-.038em",color:danger?C.danger:C.white,textShadow:"0 5px 30px rgba(0,0,0,.88)"}}>{headline}</div>
    {subline?<div style={{fontFamily:jpFont,fontSize:compact?26:29,fontWeight:700,lineHeight:1.38,color:C.muted,marginTop:15,textShadow:"0 3px 18px rgba(0,0,0,.82)"}}>{subline}</div>:null}
  </div>;
};

const CardVisual:React.FC<{manifest:EpisodeManifest;scene:Scene;hasMedia:boolean}>=({manifest,scene,hasMedia})=>{
  if(scene.visual.type!=="card")return null;
  const isHook=scene.role==="hook";
  return <div style={{position:"absolute",left:108,right:108,top:isHook?205:190,bottom:280,display:"flex",alignItems:hasMedia?"flex-end":"center",justifyContent:"flex-start"}}>
    <HeroText headline={scene.visual.headline||manifest.centralQuestion} subline={scene.visual.body} danger={isHook}/>
  </div>;
};

const MetricVisual:React.FC<{scene:Scene}>=({scene})=>{
  if(scene.visual.type!=="metric")return null;
  const frame=useCurrentFrame();
  const p=ease(interpolate(frame,[6,42],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  const raw=scene.visual.value.match(/^([~]?)(-?\d+(?:\.\d+)?)$/);
  const decimals=raw?.[2]?.includes(".")?(raw?.[2]?.split(".")[1]?.length??0):0;
  const shown=raw?`${raw[1]??""}${(Number(raw[2])*p).toFixed(decimals)}`:scene.visual.value;
  return <div style={{position:"absolute",left:110,right:110,top:170,bottom:270,display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:58,alignItems:"center"}}>
    <div>
      <div style={{fontFamily:enFont,fontSize:30,fontWeight:900,letterSpacing:".08em",color:C.muted,textTransform:"uppercase"}}>{scene.visual.label}</div>
      <div style={{fontFamily:enFont,fontSize:158,fontWeight:950,lineHeight:.98,letterSpacing:"-.055em",color:C.electric,textShadow:"0 0 55px rgba(79,215,255,.22)",marginTop:18}}>{shown}<span style={{fontSize:54,marginLeft:14,color:C.white}}>{scene.visual.unit}</span></div>
      <div style={{height:8,borderRadius:999,background:"rgba(255,255,255,.12)",marginTop:30,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(6,p*100)}%`,background:`linear-gradient(90deg,${C.electric2},${C.electric})`}}/></div>
    </div>
    <div style={{padding:"34px 36px",border:`1px solid ${C.line}`,borderRadius:28,background:"rgba(5,10,16,.66)",backdropFilter:"blur(8px)"}}>
      <div style={{fontFamily:enFont,fontSize:45,fontWeight:930,lineHeight:1.1,color:C.white}}>{scene.visual.label}</div>
      <div style={{fontFamily:jpFont,fontSize:26,lineHeight:1.45,color:C.muted,marginTop:17}}>{scene.visual.qualifier}</div>
    </div>
  </div>;
};

const ChainVisual:React.FC<{scene:Scene;resolved:ResolvedScene;globalFrame:number}>=({scene,resolved,globalFrame})=>{
  if(scene.visual.type!=="chain")return null;
  return <div style={{position:"absolute",left:105,right:105,top:205,bottom:285,display:"flex",alignItems:"center",gap:18}}>
    {scene.visual.nodes.map((node,index)=>{const visible=revealed(globalFrame,resolved,node.revealAtUtteranceId);return <React.Fragment key={`${node.label}-${index}`}>
      <div style={{flex:1,minHeight:178,border:`2px solid ${visible?C.electric:C.line}`,background:visible?"rgba(0,168,255,.12)":"rgba(255,255,255,.035)",borderRadius:25,padding:"28px 22px",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:enFont,fontSize:31,fontWeight:900,lineHeight:1.18,textAlign:"center",color:visible?C.white:"#667786",opacity:visible?1:.45,boxShadow:visible?"0 0 42px rgba(79,215,255,.10)":"none"}}>{node.label}</div>
      {index<scene.visual.nodes.length-1?<div style={{fontFamily:enFont,fontSize:40,fontWeight:900,color:visible?C.electric:"rgba(255,255,255,.18)"}}>→</div>:null}
    </React.Fragment>;})}
  </div>;
};

const CompareVisual:React.FC<{scene:Scene;resolved:ResolvedScene;globalFrame:number}>=({scene,resolved,globalFrame})=>{
  if(scene.visual.type!=="compare")return null;
  return <div style={{position:"absolute",left:108,right:108,top:170,bottom:275}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22,marginBottom:16}}>
      {[scene.visual.leftTitle,scene.visual.rightTitle].map((title,index)=><div key={title} style={{fontFamily:enFont,fontSize:29,fontWeight:930,letterSpacing:".05em",color:index===0?C.electric:C.warm,padding:"0 20px"}}>{title}</div>)}
    </div>
    <div style={{display:"grid",gap:12}}>{scene.visual.rows.map((row,index)=>{const visible=revealed(globalFrame,resolved,row.revealAtUtteranceId);return <div key={`${row.aspect}-${index}`} style={{display:"grid",gridTemplateColumns:"230px 1fr 1fr",gap:16,opacity:visible?1:.34,transform:`translateY(${visible?0:10}px)`}}>
      <div style={{padding:"18px 18px",fontFamily:enFont,fontSize:20,fontWeight:850,color:C.muted}}>{row.aspect}</div>
      <div style={{padding:"18px 22px",borderRadius:18,border:`1px solid ${visible?"rgba(79,215,255,.42)":C.line}`,background:"rgba(0,168,255,.08)",fontFamily:enFont,fontSize:25,fontWeight:800,color:C.white}}>{row.left}</div>
      <div style={{padding:"18px 22px",borderRadius:18,border:`1px solid ${visible?"rgba(255,184,77,.38)":C.line}`,background:"rgba(255,184,77,.06)",fontFamily:enFont,fontSize:25,fontWeight:800,color:C.white}}>{row.right}</div>
    </div>;})}</div>
  </div>;
};

const TimelineVisual:React.FC<{scene:Scene;resolved:ResolvedScene;globalFrame:number}>=({scene,resolved,globalFrame})=>{
  if(scene.visual.type!=="timeline")return null;
  return <div style={{position:"absolute",left:130,right:130,top:205,bottom:290,display:"flex",alignItems:"center",gap:12}}>
    {scene.visual.events.map((event,index)=>{const visible=revealed(globalFrame,resolved,event.revealAtUtteranceId);return <React.Fragment key={`${event.dateLabel}-${index}`}>
      <div style={{flex:1,minHeight:220,borderRadius:24,border:`1px solid ${visible?C.electric:C.line}`,background:visible?"rgba(0,168,255,.10)":"rgba(255,255,255,.03)",padding:"30px 26px",opacity:visible?1:.42}}>
        <div style={{fontFamily:enFont,fontSize:21,fontWeight:900,letterSpacing:".08em",color:C.electric}}>{event.dateLabel}</div>
        <div style={{fontFamily:enFont,fontSize:30,fontWeight:880,lineHeight:1.2,color:C.white,marginTop:18}}>{event.label}</div>
      </div>
      {index<scene.visual.events.length-1?<div style={{width:46,height:3,background:visible?C.electric:"rgba(255,255,255,.16)"}}/>:null}
    </React.Fragment>;})}
  </div>;
};

const PhraseVisual:React.FC<{manifest:EpisodeManifest;scene:Scene}>=({manifest,scene})=>{
  if(scene.visual.type!=="phrase")return null;
  const point=manifest.learningPoints.find(p=>p.id===scene.visual.learningPointId);
  const source=point?manifest.utterances.find(u=>u.id===point.sourceUtteranceId):undefined;
  return <div style={{position:"absolute",left:130,right:130,top:185,bottom:285,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:1420,padding:"52px 58px",borderRadius:30,border:`2px solid ${C.electric}`,background:"linear-gradient(145deg,rgba(0,168,255,.14),rgba(5,10,16,.76))",boxShadow:"0 0 80px rgba(79,215,255,.12)"}}>
      <div style={{fontFamily:enFont,fontSize:19,fontWeight:900,letterSpacing:".16em",color:C.electric}}>LISTEN · NOTICE · SHADOW</div>
      <div style={{fontFamily:enFont,fontSize:72,fontWeight:950,lineHeight:1.05,letterSpacing:"-.035em",color:C.white,marginTop:22}}>{point?.phrase??"Replay from the story"}</div>
      <div style={{fontFamily:jpFont,fontSize:27,fontWeight:700,color:C.muted,marginTop:15}}>{point?.meaningJa}</div>
      {source?<div style={{fontFamily:enFont,fontSize:30,lineHeight:1.35,color:"rgba(247,250,252,.78)",marginTop:26,borderTop:`1px solid ${C.line}`,paddingTop:22}}>{source.text}</div>:null}
    </div>
  </div>;
};

const RetrievalVisual:React.FC<{scene:Scene;phase:string}>=({scene,phase})=>{
  if(scene.visual.type!=="retrieval")return null;
  const showAnswer=phase==="reveal"||phase==="answer";
  return <div style={{position:"absolute",left:150,right:150,top:210,bottom:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:1280,padding:"46px 52px",borderRadius:28,border:`1px solid ${C.line}`,background:"rgba(5,10,16,.78)"}}>
      <div style={{fontFamily:enFont,fontSize:44,fontWeight:920,color:C.white,lineHeight:1.15}}>{scene.visual.question}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginTop:28}}>{scene.visual.options.map((option,index)=><div key={option} style={{padding:"22px 24px",borderRadius:18,border:`1px solid ${showAnswer&&index===scene.visual.correctIndex?C.electric:C.line}`,background:showAnswer&&index===scene.visual.correctIndex?"rgba(0,168,255,.14)":"rgba(255,255,255,.035)",fontFamily:enFont,fontSize:27,fontWeight:800,color:C.white}}>{option}</div>)}</div>
      {showAnswer?<div style={{fontFamily:jpFont,fontSize:24,color:C.muted,marginTop:22}}>{scene.visual.answerJa}</div>:null}
    </div>
  </div>;
};

const RecapVisual:React.FC<{manifest:EpisodeManifest;scene:Scene}>=({manifest,scene})=>{
  if(scene.visual.type!=="recap")return null;
  const points=scene.visual.learningPointIds.map(id=>manifest.learningPoints.find(p=>p.id===id)).filter((p):p is LearningPoint=>Boolean(p));
  return <div style={{position:"absolute",left:112,right:112,top:170,bottom:280,display:"grid",gridTemplateColumns:"1.25fr .75fr",gap:42,alignItems:"center"}}>
    <div>
      <div style={{fontFamily:enFont,fontSize:24,fontWeight:900,letterSpacing:".12em",color:C.electric}}>THE ANSWER</div>
      <div style={{fontFamily:enFont,fontSize:58,fontWeight:950,lineHeight:1.08,letterSpacing:"-.03em",color:C.white,marginTop:15}}>{manifest.answer}</div>
    </div>
    <div style={{display:"grid",gap:14}}>{points.map(point=><div key={point.id} style={{padding:"20px 22px",borderRadius:18,border:`1px solid ${C.line}`,background:"rgba(255,255,255,.04)"}}><div style={{fontFamily:enFont,fontSize:25,fontWeight:900,color:C.electric}}>{point.phrase}</div><div style={{fontFamily:jpFont,fontSize:18,color:C.muted,marginTop:5}}>{point.meaningJa}</div></div>)}</div>
  </div>;
};

export const NewsFirstSceneRenderer:React.FC<Props>=({manifest,scene,resolved,hasMedia=false})=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const globalFrame=resolved.startFrame+frame;
  const cue=cueAt(globalFrame,resolved);
  const point=learningPointForCue(manifest,cue);
  const phase=phaseAt(globalFrame,resolved);
  const sceneIndex=Math.max(0,manifest.scenes.findIndex(s=>s.id===scene.id));
  const progress=clamp((sceneIndex+frame/Math.max(1,resolved.durationFrames))/Math.max(1,manifest.scenes.length));
  const enter=spring({frame,fps,config:{damping:20,stiffness:105,mass:.85}});
  const captionHidden=scene.role==="retrieval"&&phase!=="reveal"&&phase!=="answer";
  return <AbsoluteFill style={{background:hasMedia?"transparent":`radial-gradient(circle at 70% 24%,rgba(0,168,255,.19),transparent 31%),linear-gradient(135deg,${C.bg},${C.bg2} 58%,${C.bg})`,color:C.white,overflow:"hidden",opacity:enter}}>
    <Texture/>
    <SectionTag label={sectionFor(scene)} progress={progress}/>
    <CardVisual manifest={manifest} scene={scene} hasMedia={hasMedia}/>
    <MetricVisual scene={scene}/>
    <ChainVisual scene={scene} resolved={resolved} globalFrame={globalFrame}/>
    <CompareVisual scene={scene} resolved={resolved} globalFrame={globalFrame}/>
    <TimelineVisual scene={scene} resolved={resolved} globalFrame={globalFrame}/>
    <PhraseVisual manifest={manifest} scene={scene}/>
    <RetrievalVisual scene={scene} phase={phase}/>
    <RecapVisual manifest={manifest} scene={scene}/>
    <CaptionBed cue={cue} point={point} hidden={captionHidden}/>
  </AbsoluteFill>;
};
