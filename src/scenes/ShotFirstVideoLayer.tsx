import React from "react";
import {AbsoluteFill,Html5Video,Img,Sequence,interpolate,staticFile,useCurrentFrame} from "remotion";
import type {Cue,EpisodeManifest,ResolvedEpisode,Scene} from "../contracts/types";
import type {ShotAsset,ShotPlan,ShotPlanShot} from "../shotplan/types";

const C={bg:"#02070B",ink:"#F7FAFC",muted:"rgba(247,250,252,.66)",cyan:"#5BE1FF",warm:"#FFC15A",red:"#FF5A68"};
const enFont='Inter,"Noto Sans",Arial,sans-serif';
const jpFont='"Noto Sans CJK JP","Noto Sans JP","Yu Gothic",Meiryo,sans-serif';
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));

const cueAt=(globalFrame:number,resolved:ResolvedEpisode,shot:ShotPlanShot):Cue|undefined=>{
  const rs=resolved.scenes.find(s=>s.sceneId===shot.sceneId);if(!rs)return undefined;
  return rs.cues.find(c=>c.startFrame<=globalFrame&&globalFrame<c.endFrame)??[...rs.cues].sort((a,b)=>a.startFrame-b.startFrame).filter(c=>c.startFrame<=globalFrame).at(-1);
};
const chapterFor=(scene?:Scene)=>scene?.role==="hook"?"THE QUESTION":scene?.role==="story"?scene.beat==="setup"?"WHAT CHANGED":scene.beat==="mechanism"?"HOW IT WORKS":scene.beat==="complication"?"THE CATCH":"WHAT IT MEANS":scene?.role==="phrase"?"YOU JUST HEARD":"TAKEAWAY";

const Media:React.FC<{shot:ShotPlanShot;asset?:ShotAsset}>=({shot,asset})=>{
  const frame=useCurrentFrame();
  const p=clamp(frame/Math.max(1,shot.durationFrames-1));
  const scale=interpolate(p,[0,1],[shot.camera.scaleFrom,shot.camera.scaleTo]);
  const x=interpolate(p,[0,1],[shot.camera.xFrom,shot.camera.xTo]);
  const y=interpolate(p,[0,1],[shot.camera.yFrom,shot.camera.yTo]);
  const style:React.CSSProperties={width:"100%",height:"100%",objectFit:"cover",transform:`translate(${x}%,${y}%) scale(${scale})`,filter:"saturate(.93) contrast(1.06) brightness(.84)"};
  return <AbsoluteFill style={{overflow:"hidden",background:"radial-gradient(circle at 60% 30%,#16384A 0%,#07131B 48%,#02070B 100%)"}}>
    {asset?.kind==="video"?<Html5Video src={staticFile(asset.path)} muted loop style={style}/>:asset?<Img src={staticFile(asset.path)} style={style}/>:null}
  </AbsoluteFill>;
};

const Caption:React.FC<{cue?:Cue;shot:ShotPlanShot}>=({cue,shot})=>{
  if(!cue||shot.captionMode==="none")return null;
  return <div style={{position:"absolute",left:0,right:0,bottom:0,zIndex:30,padding:"72px 112px 34px",background:"linear-gradient(180deg,transparent 0%,rgba(2,7,11,.42) 34%,rgba(2,7,11,.94) 100%)"}}>
    <div style={{fontFamily:enFont,fontSize:38,fontWeight:820,lineHeight:1.14,letterSpacing:"-.015em",color:C.ink,textShadow:"0 4px 24px rgba(0,0,0,.92)",maxWidth:1560}}>{cue.text}</div>
    {shot.captionMode==="en-ja"?<div style={{fontFamily:jpFont,fontSize:20,fontWeight:650,lineHeight:1.35,color:"rgba(247,250,252,.72)",marginTop:7,textShadow:"0 3px 18px rgba(0,0,0,.9)",maxWidth:1510}}>{shot.japaneseAnchor??cue.translationJa}</div>:null}
  </div>;
};

const SourceBug:React.FC<{label?:string}>=({label})=>label?<div style={{position:"absolute",left:76,top:58,zIndex:25,fontFamily:enFont,fontSize:16,fontWeight:900,letterSpacing:".13em",color:"rgba(247,250,252,.82)",textShadow:"0 3px 16px rgba(0,0,0,.92)"}}>{label.toUpperCase()}</div>:null;

const Main:React.FC<{manifest:EpisodeManifest;scene?:Scene;shot:ShotPlanShot;hasMedia:boolean}>=({manifest,scene,shot,hasMedia})=>{
  const frame=useCurrentFrame();
  const enter=clamp(interpolate(frame,[0,14],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  const baseShadow="0 6px 34px rgba(0,0,0,.88)";
  const chapter=chapterFor(scene);

  if(shot.kind==="cold-open")return <>
    <AbsoluteFill style={{background:"linear-gradient(90deg,rgba(2,7,11,.94) 0%,rgba(2,7,11,.54) 48%,rgba(2,7,11,.16) 100%)"}}/>
    <div style={{position:"absolute",left:82,top:170,width:1220,zIndex:20,opacity:enter,transform:`translateY(${(1-enter)*28}px)`}}>
      <div style={{fontFamily:enFont,fontSize:20,fontWeight:950,letterSpacing:".16em",color:C.red}}>THE BOTTLENECK MOVED</div>
      <div style={{fontFamily:enFont,fontSize:92,fontWeight:970,lineHeight:.98,letterSpacing:"-.05em",color:C.ink,marginTop:20,textShadow:baseShadow}}>{shot.headline}</div>
    </div>
  </>;

  if(shot.kind==="question")return <>
    <AbsoluteFill style={{background:"linear-gradient(90deg,rgba(2,7,11,.97) 0%,rgba(2,7,11,.74) 56%,rgba(2,7,11,.14) 100%)"}}/>
    <div style={{position:"absolute",left:88,top:160,width:1200,zIndex:20}}>
      <div style={{fontFamily:enFont,fontSize:18,fontWeight:950,letterSpacing:".17em",color:C.cyan}}>ONE QUESTION</div>
      <div style={{fontFamily:enFont,fontSize:70,fontWeight:950,lineHeight:1.05,letterSpacing:"-.04em",color:C.ink,marginTop:20,textShadow:baseShadow}}>{manifest.centralQuestion}</div>
      {shot.subhead?<div style={{fontFamily:enFont,fontSize:28,fontWeight:700,lineHeight:1.25,color:C.muted,marginTop:20}}>{shot.subhead}</div>:null}
    </div>
  </>;

  if(shot.kind==="metric"&&shot.metric)return <>
    <AbsoluteFill style={{background:hasMedia?"linear-gradient(90deg,rgba(2,7,11,.95) 0%,rgba(2,7,11,.70) 46%,rgba(2,7,11,.22) 100%)":"linear-gradient(120deg,#04131C,#071F2C 58%,#02070B)"}}/>
    <div style={{position:"absolute",left:90,top:178,zIndex:20}}>
      <div style={{fontFamily:enFont,fontSize:18,fontWeight:950,letterSpacing:".17em",color:C.cyan}}>{chapter}</div>
      <div style={{fontFamily:enFont,fontSize:178,fontWeight:980,lineHeight:.84,letterSpacing:"-.07em",color:C.cyan,textShadow:"0 0 60px rgba(91,225,255,.18)",marginTop:32}}>{shot.metric.value}<span style={{fontSize:58,letterSpacing:"-.03em",marginLeft:16,color:C.ink}}>{shot.metric.unit}</span></div>
      <div style={{fontFamily:enFont,fontSize:38,fontWeight:850,color:C.ink,marginTop:24,maxWidth:890}}>{shot.metric.label}</div>
    </div>
  </>;

  if(shot.kind==="evidence")return <>
    <AbsoluteFill style={{background:"linear-gradient(90deg,rgba(2,7,11,.95) 0%,rgba(2,7,11,.66) 52%,rgba(2,7,11,.12) 100%)"}}/>
    <div style={{position:"absolute",left:90,top:154,width:1180,zIndex:20}}>
      <div style={{fontFamily:enFont,fontSize:17,fontWeight:950,letterSpacing:".16em",color:C.cyan}}>SOURCE EVIDENCE</div>
      <div style={{fontFamily:enFont,fontSize:shot.sourceTitle?48:58,fontWeight:930,lineHeight:1.08,letterSpacing:"-.03em",color:C.ink,marginTop:20,textShadow:baseShadow}}>{shot.sourceTitle??shot.headline}</div>
      {shot.sourceTitle?<div style={{fontFamily:enFont,fontSize:27,fontWeight:720,lineHeight:1.25,color:"rgba(247,250,252,.76)",marginTop:22,maxWidth:1040,textShadow:"0 3px 18px rgba(0,0,0,.9)"}}>{shot.headline}</div>:null}
      <div style={{width:160,height:5,background:C.cyan,marginTop:28}}/>
    </div>
  </>;

  if(shot.kind==="mechanism"){
    const nodes=scene?.visual.type==="chain"?scene.visual.nodes.map(n=>n.label).slice(0,4):["COMPUTE","COOLING","GRID","POWER"];
    return <>
      <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(2,7,11,.45),rgba(2,7,11,.92))"}}/>
      <div style={{position:"absolute",left:86,right:86,top:178,zIndex:20}}>
        <div style={{fontFamily:enFont,fontSize:17,fontWeight:950,letterSpacing:".16em",color:C.cyan}}>{chapter}</div>
        <div style={{display:"flex",alignItems:"center",gap:18,marginTop:50}}>{nodes.map((node,i)=><React.Fragment key={`${node}-${i}`}><div style={{fontFamily:enFont,fontSize:32,fontWeight:940,lineHeight:1.05,color:C.ink,textShadow:baseShadow,maxWidth:310}}>{node}</div>{i<nodes.length-1?<div style={{fontFamily:enFont,fontSize:46,fontWeight:500,color:C.cyan}}>→</div>:null}</React.Fragment>)}</div>
      </div>
    </>;
  }

  if(shot.kind==="contrast"){
    const v=scene?.visual;
    const left=v?.type==="compare"?v.leftTitle:"COMPUTE";const right=v?.type==="compare"?v.rightTitle:"POWER";
    return <>
      <AbsoluteFill style={{background:"linear-gradient(90deg,rgba(6,35,48,.88) 0%,rgba(2,7,11,.55) 48%,rgba(57,37,11,.78) 100%)"}}/>
      <div style={{position:"absolute",inset:"150px 90px 230px",zIndex:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}}>
        <div><div style={{fontFamily:enFont,fontSize:18,fontWeight:950,letterSpacing:".14em",color:C.cyan}}>OLD STORY</div><div style={{fontFamily:enFont,fontSize:74,fontWeight:960,color:C.ink,marginTop:18,textShadow:baseShadow}}>{left}</div></div>
        <div><div style={{fontFamily:enFont,fontSize:18,fontWeight:950,letterSpacing:".14em",color:C.warm}}>NEW CONSTRAINT</div><div style={{fontFamily:enFont,fontSize:74,fontWeight:960,color:C.ink,marginTop:18,textShadow:baseShadow}}>{right}</div></div>
      </div>
    </>;
  }

  if(shot.kind==="phrase")return <>
    <AbsoluteFill style={{background:"linear-gradient(135deg,#04131C,#02070B 68%)"}}/>
    <div style={{position:"absolute",left:110,right:110,top:210,zIndex:20}}><div style={{fontFamily:enFont,fontSize:18,fontWeight:950,letterSpacing:".18em",color:C.cyan}}>YOU JUST HEARD</div><div style={{fontFamily:enFont,fontSize:72,fontWeight:960,lineHeight:1.03,letterSpacing:"-.04em",color:C.ink,marginTop:22}}>{shot.headline}</div></div>
  </>;

  if(shot.kind==="recap")return <>
    <AbsoluteFill style={{background:"linear-gradient(135deg,#04131C,#02070B 68%)"}}/>
    <div style={{position:"absolute",left:110,right:110,top:180,zIndex:20}}><div style={{fontFamily:enFont,fontSize:18,fontWeight:950,letterSpacing:".18em",color:C.cyan}}>THE ANSWER</div><div style={{fontFamily:enFont,fontSize:62,fontWeight:950,lineHeight:1.07,letterSpacing:"-.035em",color:C.ink,marginTop:22}}>{manifest.answer}</div></div>
  </>;

  if(shot.kind==="broll"&&shot.captionMode==="none")return null;

  return <>
    <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(2,7,11,.04) 0%,rgba(2,7,11,.14) 58%,rgba(2,7,11,.58) 100%)"}}/>
    <div style={{position:"absolute",left:76,top:58,zIndex:20,fontFamily:enFont,fontSize:16,fontWeight:950,letterSpacing:".16em",color:"rgba(247,250,252,.78)"}}>{chapter}</div>
  </>;
};

const Shot:React.FC<{manifest:EpisodeManifest;resolved:ResolvedEpisode;shot:ShotPlanShot;asset?:ShotAsset}>=({manifest,resolved,shot,asset})=>{
  const frame=useCurrentFrame();const globalFrame=shot.startFrame+frame;
  const scene=manifest.scenes.find(s=>s.id===shot.sceneId);const cue=cueAt(globalFrame,resolved,shot);
  return <AbsoluteFill style={{background:C.bg}}>
    <Media shot={shot} asset={asset}/>
    <Main manifest={manifest} scene={scene} shot={shot} hasMedia={Boolean(asset)}/>
    <SourceBug label={shot.sourceLabel}/>
    <Caption cue={cue} shot={shot}/>
  </AbsoluteFill>;
};

export const ShotFirstVideoLayer:React.FC<{manifest:EpisodeManifest;resolved:ResolvedEpisode;shotPlan:ShotPlan;shotAssets?:ShotAsset[]}>=({manifest,resolved,shotPlan,shotAssets=[]})=> <AbsoluteFill style={{background:C.bg}}>
  {shotPlan.shots.map(shot=>{
    const asset=shotAssets.find(a=>a.shotId===shot.id);
    return <Sequence key={shot.id} from={shot.startFrame} durationInFrames={shot.durationFrames}><Shot manifest={manifest} resolved={resolved} shot={shot} asset={asset}/></Sequence>;
  })}
</AbsoluteFill>;
