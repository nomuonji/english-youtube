import React from "react";
import {
  AbsoluteFill,
  Html5Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type BrollVisual={type:"broll";query:string;accent?:"danger"|"electric"};
type SourceVisual={type:"source";sourceIndex:number;query:string};
type MetricVisual={type:"metric";from:number;to:number;unit:string;label:string};
type CompareVisual={type:"compare";left:string;leftValue:string;right:string;rightValue:string;focus:"left"|"right"};
type ChainVisual={type:"chain";items:string[]};
type ChecklistVisual={type:"checklist";items:string[]};
type OutroVisual={type:"outro"};
type V3Visual=BrollVisual|SourceVisual|MetricVisual|CompareVisual|ChainVisual|ChecklistVisual|OutroVisual;

type V3Scene={
  id:string;
  section:string;
  narrationEn:string;
  translationJa:string;
  headline:string;
  subline:string;
  visual:V3Visual;
};
type V3Source={label:string;headline:string;url:string};
export type V3Spec={version:"3.1.0";episodeId:string;title:string;voice:string;rate:string;pitch:string;sources:V3Source[];scenes:V3Scene[]};
export type V3TimingScene={id:string;startFrame:number;durationFrames:number;audioPath:string};
export type V3BrollAsset={query:string;path:string;sourcePage?:string;license?:string};
export type TechExplainerV3Props={spec:V3Spec;timing:{fps:30;durationFrames:number;scenes:V3TimingScene[]};brollAssets:V3BrollAsset[]};

const COLORS={
  bg:"#050A10",white:"#F7FAFC",muted:"#A9B8C6",electric:"#4FD7FF",electric2:"#00A8FF",
  danger:"#FF4D5E",warm:"#FFB84D",line:"rgba(255,255,255,.18)",
};
const enFont='Inter,"Noto Sans",Arial,sans-serif';
const jpFont='"Noto Sans CJK JP","Noto Sans JP","Yu Gothic",Meiryo,sans-serif';
const ease=(v:number)=>1-Math.pow(1-v,3);
const sceneFade=(frame:number,duration:number)=>{
  const a=interpolate(frame,[0,6],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const b=interpolate(frame,[Math.max(0,duration-6),duration-1],[1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return Math.min(a,b);
};
const findBroll=(assets:V3BrollAsset[],query:string)=>assets.find(a=>a.query===query);

const Noise:React.FC=()=> <AbsoluteFill style={{opacity:.07,backgroundImage:"radial-gradient(rgba(255,255,255,.34) .7px,transparent .7px)",backgroundSize:"5px 5px",mixBlendMode:"soft-light",pointerEvents:"none"}}/>;

const Broll:React.FC<{asset?:V3BrollAsset;accent?:"danger"|"electric"}>=({asset,accent="electric"})=>{
  const f=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  const scale=interpolate(f,[0,Math.max(1,durationInFrames-1)],[1.015,1.075]);
  const x=interpolate(f,[0,Math.max(1,durationInFrames-1)],[-1.2,1.2]);
  const glow=accent==="danger"?"rgba(255,77,94,.14)":"rgba(79,215,255,.13)";
  return <AbsoluteFill style={{background:COLORS.bg,overflow:"hidden"}}>
    {asset?<OffthreadVideo src={staticFile(asset.path)} muted style={{width:"100%",height:"100%",objectFit:"cover",transform:`translateX(${x}%) scale(${scale})`,filter:"saturate(.92) contrast(1.07) brightness(.72)"}}/>:null}
    <AbsoluteFill style={{background:`linear-gradient(90deg,rgba(3,8,13,.84) 0%,rgba(3,8,13,.34) 54%,rgba(3,8,13,.58) 100%),radial-gradient(circle at 76% 35%,${glow},transparent 38%)`}}/>
  </AbsoluteFill>;
};

const SectionTag:React.FC<{section:string}>=({section})=><div style={{fontFamily:enFont,fontSize:20,fontWeight:900,letterSpacing:".16em",color:COLORS.electric,textTransform:"uppercase",textShadow:"0 2px 12px rgba(0,0,0,.6)"}}>{section}</div>;

const Headline:React.FC<{headline:string;subline:string;danger?:boolean;compact?:boolean}>=({headline,subline,danger=false,compact=false})=>{
  const f=useCurrentFrame();
  const p=ease(interpolate(f,[2,15],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  return <div style={{opacity:p,transform:`translateY(${(1-p)*26}px)`,maxWidth:compact?1210:1380}}>
    <div style={{fontFamily:enFont,fontSize:compact?58:76,fontWeight:950,lineHeight:1.06,letterSpacing:"-.035em",color:danger?COLORS.danger:COLORS.white,textShadow:"0 5px 28px rgba(0,0,0,.84)"}}>{headline}</div>
    <div style={{fontFamily:jpFont,fontSize:compact?27:30,fontWeight:700,marginTop:17,color:COLORS.muted,lineHeight:1.35,textShadow:"0 3px 18px rgba(0,0,0,.75)"}}>{subline}</div>
  </div>;
};

const BrollScene:React.FC<{scene:V3Scene;asset?:V3BrollAsset}>=({scene,asset})=> <AbsoluteFill>
  <Broll asset={asset} accent={scene.visual.type==="broll"?scene.visual.accent:"electric"}/>
  <div style={{position:"absolute",left:110,top:78}}><SectionTag section={scene.section}/></div>
  <div style={{position:"absolute",left:110,bottom:270,right:110}}><Headline headline={scene.headline} subline={scene.subline} danger={scene.visual.type==="broll"&&scene.visual.accent==="danger"}/></div>
  <Noise/>
</AbsoluteFill>;

const SourceScene:React.FC<{scene:V3Scene;spec:V3Spec;asset?:V3BrollAsset}>=({scene,spec,asset})=>{
  const source=scene.visual.type==="source"?spec.sources[scene.visual.sourceIndex]:undefined;
  const f=useCurrentFrame();
  const p=ease(interpolate(f,[5,18],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  return <AbsoluteFill>
    <Broll asset={asset}/>
    <div style={{position:"absolute",left:110,top:78}}><SectionTag section="REAL NEWS"/></div>
    <div style={{position:"absolute",left:110,right:110,top:190,bottom:245,display:"flex",alignItems:"center"}}>
      <div style={{width:1420,padding:"44px 52px",borderLeft:`8px solid ${COLORS.danger}`,background:"linear-gradient(90deg,rgba(4,9,15,.91),rgba(4,9,15,.57))",opacity:p,transform:`translateX(${(1-p)*34}px)`}}>
        <div style={{fontFamily:enFont,fontSize:23,fontWeight:900,color:COLORS.danger,letterSpacing:".08em"}}>{source?.label??"SOURCE"}</div>
        <div style={{fontFamily:enFont,fontSize:55,fontWeight:950,lineHeight:1.12,color:COLORS.white,marginTop:16}}>{scene.headline}</div>
        <div style={{fontFamily:jpFont,fontSize:28,lineHeight:1.4,color:COLORS.muted,marginTop:14}}>{scene.subline}</div>
        <div style={{fontFamily:enFont,fontSize:21,lineHeight:1.35,color:"rgba(255,255,255,.72)",marginTop:24,maxWidth:1220}}>{source?.headline}</div>
      </div>
    </div>
    <Noise/>
  </AbsoluteFill>;
};

const MetricScene:React.FC<{scene:V3Scene}>=({scene})=>{
  if(scene.visual.type!=="metric")return null;
  const v=scene.visual;const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();
  const p=ease(interpolate(f,[7,Math.min(50,durationInFrames*.56)],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  const value=v.from+(v.to-v.from)*p;
  const fmt=v.unit==="%"?value.toFixed(1).replace(".0",""):Math.round(value).toLocaleString("en-US");
  const bar=interpolate(p,[0,1],[10,88]);
  return <AbsoluteFill style={{background:"radial-gradient(circle at 70% 25%,rgba(0,168,255,.22),transparent 30%),linear-gradient(135deg,#050A10,#071827 58%,#050A10)",color:COLORS.white}}>
    <div style={{position:"absolute",left:110,top:78}}><SectionTag section="DATA"/></div>
    <div style={{position:"absolute",left:118,top:182,right:118}}>
      <div style={{fontFamily:enFont,fontSize:44,fontWeight:900,color:COLORS.white}}>{scene.headline}</div>
      <div style={{fontFamily:enFont,fontSize:22,color:COLORS.muted,marginTop:8,letterSpacing:".03em"}}>{v.label}</div>
    </div>
    <div style={{position:"absolute",left:120,right:120,bottom:285,height:330,display:"flex",alignItems:"flex-end",gap:70}}>
      <div style={{flex:1,height:"100%",display:"flex",alignItems:"flex-end",gap:42}}>
        <div style={{width:270,height:"48%",background:"linear-gradient(180deg,#5A7890,#263847)",borderRadius:"18px 18px 0 0",position:"relative"}}><div style={{position:"absolute",top:-50,width:"100%",textAlign:"center",fontFamily:enFont,fontSize:31,fontWeight:800}}>2025</div><div style={{position:"absolute",bottom:27,width:"100%",textAlign:"center",fontFamily:enFont,fontSize:45,fontWeight:900}}>{v.from}</div></div>
        <div style={{width:320,height:`${bar}%`,background:`linear-gradient(180deg,${COLORS.electric},${COLORS.electric2})`,borderRadius:"18px 18px 0 0",boxShadow:"0 0 60px rgba(79,215,255,.26)",position:"relative"}}><div style={{position:"absolute",top:-50,width:"100%",textAlign:"center",fontFamily:enFont,fontSize:31,fontWeight:900,color:COLORS.electric}}>2030</div><div style={{position:"absolute",bottom:27,width:"100%",textAlign:"center",fontFamily:enFont,fontSize:59,fontWeight:950}}>{fmt}<span style={{fontSize:29,marginLeft:9}}>{v.unit}</span></div></div>
      </div>
      <div style={{width:590,paddingBottom:28}}>
        <div style={{fontFamily:enFont,fontSize:91,fontWeight:950,color:v.unit==="%"?COLORS.danger:COLORS.electric,lineHeight:1}}>{fmt}<span style={{fontSize:40,marginLeft:12}}>{v.unit}</span></div>
        <div style={{fontFamily:jpFont,fontSize:29,lineHeight:1.38,color:COLORS.muted,marginTop:20}}>{scene.subline}</div>
      </div>
    </div>
    <Noise/>
  </AbsoluteFill>;
};

const CompareScene:React.FC<{scene:V3Scene}>=({scene})=>{
  if(scene.visual.type!=="compare")return null;
  const v=scene.visual;const f=useCurrentFrame();const p=ease(interpolate(f,[5,18],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  const card=(side:"left"|"right",label:string,value:string)=>{const active=v.focus===side;return <div style={{flex:1,minHeight:350,border:`2px solid ${active?COLORS.electric:COLORS.line}`,background:active?"linear-gradient(155deg,rgba(0,168,255,.18),rgba(255,255,255,.035))":"rgba(255,255,255,.035)",borderRadius:30,padding:"40px 40px",display:"flex",flexDirection:"column",justifyContent:"space-between",boxShadow:active?"0 0 70px rgba(0,168,255,.13)":"none"}}>
    <div style={{fontFamily:enFont,fontSize:23,fontWeight:900,letterSpacing:".12em",color:active?COLORS.electric:COLORS.muted}}>{label}</div>
    <div style={{fontFamily:enFont,fontSize:65,fontWeight:950,color:active?COLORS.white:"#80909D"}}>{value}</div>
    <div style={{height:6,borderRadius:999,background:active?COLORS.electric:"rgba(255,255,255,.12)"}}/>
  </div>;};
  return <AbsoluteFill style={{background:"linear-gradient(135deg,#050A10,#0A1520 60%,#050A10)",color:COLORS.white}}>
    <div style={{position:"absolute",left:110,top:78}}><SectionTag section="SPEED MISMATCH"/></div>
    <div style={{position:"absolute",left:118,right:118,top:165}}><Headline headline={scene.headline} subline={scene.subline} compact/></div>
    <div style={{position:"absolute",left:118,right:118,bottom:235,display:"flex",gap:30,opacity:p,transform:`translateY(${(1-p)*22}px)`}}>{card("left",v.left,v.leftValue)}<div style={{display:"flex",alignItems:"center",fontFamily:enFont,fontSize:54,color:COLORS.danger,fontWeight:950}}>≠</div>{card("right",v.right,v.rightValue)}</div>
    <Noise/>
  </AbsoluteFill>;
};

const ChainScene:React.FC<{scene:V3Scene}>=({scene})=>{
  if(scene.visual.type!=="chain")return null;const f=useCurrentFrame();
  return <AbsoluteFill style={{background:"radial-gradient(circle at 50% 40%,rgba(255,77,94,.14),transparent 35%),#050A10",color:COLORS.white}}>
    <div style={{position:"absolute",left:110,top:78}}><SectionTag section="BOTTLENECK"/></div>
    <div style={{position:"absolute",left:118,right:118,top:165}}><Headline headline={scene.headline} subline={scene.subline} compact/></div>
    <div style={{position:"absolute",left:120,right:120,bottom:260,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:22}}>{scene.visual.items.map((item,i)=>{const p=ease(interpolate(f,[9+i*9,21+i*9],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));return <div key={item} style={{height:190,border:`2px solid ${COLORS.danger}`,background:"rgba(255,77,94,.07)",borderRadius:27,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:enFont,fontSize:32,fontWeight:900,textAlign:"center",padding:15,opacity:p,transform:`translateY(${(1-p)*28}px)`}}>{item}</div>;})}</div>
    <Noise/>
  </AbsoluteFill>;
};

const ChecklistScene:React.FC<{scene:V3Scene}>=({scene})=>{
  if(scene.visual.type!=="checklist")return null;const f=useCurrentFrame();
  return <AbsoluteFill style={{background:"linear-gradient(145deg,#050A10,#071E2C 66%,#050A10)",color:COLORS.white}}>
    <div style={{position:"absolute",left:110,top:78}}><SectionTag section="INVESTOR CHECK"/></div>
    <div style={{position:"absolute",left:118,right:118,top:165}}><Headline headline={scene.headline} subline={scene.subline} compact/></div>
    <div style={{position:"absolute",left:180,right:180,bottom:220,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{scene.visual.items.map((item,i)=>{const p=ease(interpolate(f,[8+i*8,20+i*8],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));return <div key={item} style={{display:"flex",alignItems:"center",gap:22,minHeight:100,padding:"20px 28px",borderBottom:`1px solid ${COLORS.line}`,opacity:p}}><div style={{width:46,height:46,borderRadius:999,background:COLORS.electric,color:COLORS.bg,fontFamily:enFont,fontSize:28,fontWeight:950,display:"flex",alignItems:"center",justifyContent:"center"}}>✓</div><div style={{fontFamily:enFont,fontSize:31,fontWeight:900}}>{item}</div></div>;})}</div>
    <Noise/>
  </AbsoluteFill>;
};

const OutroScene:React.FC<{scene:V3Scene}>=({scene})=>{
  const f=useCurrentFrame();const p=ease(interpolate(f,[5,19],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}));
  return <AbsoluteFill style={{background:"radial-gradient(circle at 50% 44%,rgba(79,215,255,.20),transparent 30%),#050A10",display:"flex",alignItems:"center",justifyContent:"center",color:COLORS.white}}>
    <div style={{textAlign:"center",maxWidth:1500,marginBottom:130,opacity:p,transform:`scale(${.95+.05*p})`}}><div style={{fontFamily:enFont,fontSize:82,fontWeight:950,lineHeight:1.08}}>{scene.headline}</div><div style={{fontFamily:enFont,fontSize:27,color:COLORS.electric,letterSpacing:".15em",fontWeight:850,marginTop:29}}>{scene.subline}</div><div style={{width:180,height:6,background:COLORS.danger,borderRadius:999,margin:"35px auto 0"}}/></div>
    <Noise/>
  </AbsoluteFill>;
};

const SceneView:React.FC<{scene:V3Scene;spec:V3Spec;assets:V3BrollAsset[];durationFrames:number}>=({scene,spec,assets,durationFrames})=>{
  const f=useCurrentFrame();const opacity=sceneFade(f,durationFrames);let body:React.ReactNode;
  if(scene.visual.type==="broll")body=<BrollScene scene={scene} asset={findBroll(assets,scene.visual.query)}/>;
  else if(scene.visual.type==="source")body=<SourceScene scene={scene} spec={spec} asset={findBroll(assets,scene.visual.query)}/>;
  else if(scene.visual.type==="metric")body=<MetricScene scene={scene}/>;
  else if(scene.visual.type==="compare")body=<CompareScene scene={scene}/>;
  else if(scene.visual.type==="chain")body=<ChainScene scene={scene}/>;
  else if(scene.visual.type==="checklist")body=<ChecklistScene scene={scene}/>;
  else body=<OutroScene scene={scene}/>;
  return <AbsoluteFill style={{opacity}}>{body}</AbsoluteFill>;
};

const CaptionBed:React.FC=()=> <div style={{position:"absolute",left:0,right:0,bottom:0,height:220,background:"linear-gradient(180deg,rgba(5,10,16,0),rgba(5,10,16,.78) 36%,rgba(5,10,16,.96))",pointerEvents:"none"}}/>;
const CaptionText:React.FC<{scene:V3Scene}>=({scene})=><div style={{position:"absolute",left:110,right:110,bottom:42,pointerEvents:"none"}}>
  <div style={{fontFamily:enFont,fontSize:34,fontWeight:850,lineHeight:1.22,color:COLORS.white,textShadow:"0 3px 16px rgba(0,0,0,.95)",maxWidth:1600}}>{scene.narrationEn}</div>
  <div style={{fontFamily:jpFont,fontSize:22,fontWeight:650,lineHeight:1.32,color:"rgba(238,245,250,.82)",textShadow:"0 2px 12px rgba(0,0,0,.95)",marginTop:7,maxWidth:1600}}>{scene.translationJa}</div>
</div>;

export const TechExplainerV3:React.FC<TechExplainerV3Props>=({spec,timing,brollAssets})=>{
  return <AbsoluteFill style={{background:COLORS.bg}}>
    <Html5Audio src={staticFile("generated/v3/bgm.wav")} volume={(f)=>{
      const scene=timing.scenes.find(s=>s.startFrame<=f&&f<s.startFrame+s.durationFrames);
      if(!scene)return .10;
      const local=f-scene.startFrame;const edge=Math.min(local,scene.durationFrames-local);
      return edge<8?.11:.09;
    }}/>
    {timing.scenes.map((t,index)=>{
      const scene=spec.scenes.find(s=>s.id===t.id);if(!scene)return null;
      return <Sequence key={t.id} from={t.startFrame} durationInFrames={t.durationFrames}>
        <SceneView scene={scene} spec={spec} assets={brollAssets} durationFrames={t.durationFrames}/>
        <Html5Audio src={staticFile(t.audioPath)} volume={1}/>
        {index===0?<Html5Audio src={staticFile("generated/v3/sfx/impact.wav")} volume={.38}/>:null}
        {scene.visual.type==="metric"?<Html5Audio src={staticFile("generated/v3/sfx/data-rise.wav")} volume={.20}/>:null}
        {index>0&&[2,8,11,14,17,20].includes(index)?<Html5Audio src={staticFile("generated/v3/sfx/whoosh.wav")} volume={.15}/>:null}
      </Sequence>;
    })}
    <CaptionBed/>
    {timing.scenes.map((t)=>{
      const scene=spec.scenes.find(s=>s.id===t.id);if(!scene)return null;
      return <Sequence key={`caption-${t.id}`} from={t.startFrame} durationInFrames={t.durationFrames}><CaptionText scene={scene}/></Sequence>;
    })}
  </AbsoluteFill>;
};
