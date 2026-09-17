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
    {shot.captionMode==="en-ja"?<div style={{fontFamily:jpFont,fontSize:20,fontWeight:650,lineHeight:1.35,color:"rgba(247,250,252,.72)",marginTop:7,textShadow:"0 3px 18px rgba(0,0,0,.9)",maxWidth:1510}}>{cue.translationJa}</div>:null}
  </div>;
};

const SourceBug:React.FC<{label?:string}>=({label})=>label?<div style={{position:"absolute",left:76,top:58,zIndex:25,fontFamily:enFont,fontSize:16,fontWeight:900,letterSpacing:".13em",color:"rgba(247,250,252,.82)",textShadow:"0 3px 16px rgba(0,0,0,.92)"}}>{label.toUpperCase()}</div>:null;

const Main:React.FC<{manifest:EpisodeManifest;scene?:Scene;shot:ShotPlanShot;hasMedia:boolean}>=({manifest,scene,shot,hasMedia})=>{
  const frame=useCurrentFrame();
  const enter=clamp(interpolate(frame,[0,14],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  const p=clamp(frame/Math.max(1,shot.durationFrames-1));
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

  if(shot.kind==="evidence"){
    const money=shot.sourceTitle?.match(/\$([\d.]+)\s*(million|billion)/i);
    const amount=money?`$${money[1]}${money[2].toLowerCase().startsWith("b")?"B":"M"}`:undefined;
    return <>
      <AbsoluteFill style={{background:"linear-gradient(90deg,rgba(2,7,11,.92) 0%,rgba(2,7,11,.52) 38%,rgba(2,7,11,.08) 78%)"}}/>
      <div style={{position:"absolute",left:84,top:112,width:760,zIndex:20,opacity:enter,transform:`translateX(${(1-enter)*-18}px)`}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:14,padding:"10px 14px",border:"1px solid rgba(91,225,255,.34)",background:"rgba(2,7,11,.74)",backdropFilter:"blur(8px)"}}>
          <span style={{width:8,height:8,borderRadius:999,background:C.cyan,boxShadow:"0 0 20px rgba(91,225,255,.7)"}}/>
          <span style={{fontFamily:enFont,fontSize:14,fontWeight:950,letterSpacing:".14em",color:C.ink}}>{(shot.sourceLabel??"SOURCE EVIDENCE").toUpperCase()}</span>
        </div>
        {amount?<div style={{fontFamily:enFont,fontSize:96,fontWeight:980,lineHeight:.9,letterSpacing:"-.06em",color:C.cyan,marginTop:26,textShadow:"0 0 45px rgba(91,225,255,.14)"}}>{amount}</div>:null}
        <div style={{fontFamily:enFont,fontSize:amount?31:38,fontWeight:900,lineHeight:1.08,letterSpacing:"-.025em",color:C.ink,marginTop:amount?18:26,textShadow:baseShadow,maxWidth:720}}>{shot.sourceTitle??shot.headline}</div>
        {shot.sourceTitle?<div style={{fontFamily:enFont,fontSize:23,fontWeight:720,lineHeight:1.28,color:"rgba(247,250,252,.72)",marginTop:16,maxWidth:690,textShadow:"0 3px 18px rgba(0,0,0,.9)"}}>{shot.headline}</div>:null}
      </div>
      <div style={{position:"absolute",left:84,top:92,width:interpolate(p,[0,1],[0,310]),height:3,zIndex:21,background:C.cyan,boxShadow:"0 0 22px rgba(91,225,255,.36)"}}/>
    </>;
  }

  if(shot.kind==="mechanism"){
    const nodes=scene?.visual.type==="chain"?scene.visual.nodes.map(n=>n.label).slice(0,4):["AI COMPUTE","GRID ACCESS","POWER"];
    return <>
      <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(2,7,11,.18) 0%,rgba(2,7,11,.42) 54%,rgba(2,7,11,.82) 100%)"}}/>
      <div style={{position:"absolute",left:90,right:90,top:154,zIndex:20}}>
        <div style={{fontFamily:enFont,fontSize:17,fontWeight:950,letterSpacing:".16em",color:C.cyan}}>{chapter}</div>
        <div style={{position:"relative",display:"grid",gridTemplateColumns:`repeat(${nodes.length},1fr)`,gap:26,alignItems:"center",marginTop:68}}>
          <div style={{position:"absolute",left:"3%",right:"3%",top:31,height:3,background:"rgba(247,250,252,.22)"}}/>
          <div style={{position:"absolute",left:"3%",top:31,width:`${Math.max(0,(nodes.length>1?p:1))*94}%`,height:3,background:C.cyan,boxShadow:"0 0 24px rgba(91,225,255,.42)"}}/>
          {nodes.map((node,i)=>{
            const threshold=i/Math.max(1,nodes.length-1);
            const visible=clamp((p-threshold+.18)*4);
            return <div key={`${node}-${i}`} style={{position:"relative",opacity:visible,transform:`translateY(${(1-visible)*14}px)`}}>
              <div style={{width:18,height:18,borderRadius:999,background:i===nodes.length-1?C.warm:C.cyan,border:"4px solid rgba(2,7,11,.72)",boxShadow:`0 0 24px ${i===nodes.length-1?"rgba(255,193,90,.42)":"rgba(91,225,255,.42)"}`}}/>
              <div style={{fontFamily:enFont,fontSize:30,fontWeight:940,lineHeight:1.02,color:C.ink,textShadow:baseShadow,marginTop:24,maxWidth:300}}>{node}</div>
            </div>;
          })}
        </div>
      </div>
    </>;
  }

  if(shot.kind==="contrast"){
    const v=scene?.visual;
    const left=v?.type==="compare"?v.leftTitle:"COMPUTE";const right=v?.type==="compare"?v.rightTitle:"POWER";
    const shift=clamp(interpolate(p,[0,.72],[0,1],{extrapolateRight:"clamp"}));
    return <>
      <AbsoluteFill style={{background:"linear-gradient(90deg,rgba(2,7,11,.82) 0%,rgba(2,7,11,.40) 50%,rgba(2,7,11,.78) 100%)"}}/>
      <div style={{position:"absolute",left:100,right:100,top:174,zIndex:20}}>
        <div style={{fontFamily:enFont,fontSize:17,fontWeight:950,letterSpacing:".16em",color:C.cyan}}>{chapter}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px 1fr",alignItems:"center",gap:34,marginTop:66}}>
          <div style={{opacity:1-shift*.35}}>
            <div style={{fontFamily:enFont,fontSize:16,fontWeight:950,letterSpacing:".14em",color:"rgba(247,250,252,.62)"}}>OLD BOTTLENECK</div>
            <div style={{fontFamily:enFont,fontSize:68,fontWeight:970,color:C.ink,marginTop:12,textShadow:baseShadow}}>{left}</div>
          </div>
          <div style={{position:"relative",height:88}}>
            <div style={{position:"absolute",left:0,right:0,top:41,height:3,background:"rgba(247,250,252,.18)"}}/>
            <div style={{position:"absolute",left:0,top:41,width:`${shift*100}%`,height:3,background:C.cyan,boxShadow:"0 0 24px rgba(91,225,255,.42)"}}/>
            <div style={{position:"absolute",left:`calc(${shift*100}% - 9px)`,top:34,width:18,height:18,borderRadius:999,background:C.cyan,boxShadow:"0 0 28px rgba(91,225,255,.56)"}}/>
          </div>
          <div style={{opacity:.55+shift*.45,transform:`scale(${.96+shift*.04})`,transformOrigin:"left center"}}>
            <div style={{fontFamily:enFont,fontSize:16,fontWeight:950,letterSpacing:".14em",color:C.warm}}>NEW CONSTRAINT</div>
            <div style={{fontFamily:enFont,fontSize:68,fontWeight:970,color:C.ink,marginTop:12,textShadow:baseShadow}}>{right}</div>
          </div>
        </div>
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
    <SourceBug label={shot.kind==="evidence"?undefined:shot.sourceLabel}/>
    <Caption cue={cue} shot={shot}/>
  </AbsoluteFill>;
};

export const ShotFirstVideoLayer:React.FC<{manifest:EpisodeManifest;resolved:ResolvedEpisode;shotPlan:ShotPlan;shotAssets?:ShotAsset[]}>=({manifest,resolved,shotPlan,shotAssets=[]})=> <AbsoluteFill style={{background:C.bg}}>
  {shotPlan.shots.map(shot=>{
    const asset=shotAssets.find(a=>a.shotId===shot.id);
    return <Sequence key={shot.id} from={shot.startFrame} durationInFrames={shot.durationFrames}><Shot manifest={manifest} resolved={resolved} shot={shot} asset={asset}/></Sequence>;
  })}
</AbsoluteFill>;
