import React from "react";
import {interpolate,spring,useCurrentFrame,useVideoConfig} from "remotion";
import type {Cue,EpisodeManifest,LearningPoint,ResolvedScene,Scene,Utterance} from "../contracts/types";
import {base,COLORS,headerStyle,mainArea,subtitleArea} from "./styles";

type Props={manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene};
type Signal={token:string;label:string;ja:string};

const getU=(m:EpisodeManifest,id:string):Utterance|undefined=>m.utterances.find(i=>i.id===id);
const getP=(m:EpisodeManifest,id:string):LearningPoint|undefined=>m.learningPoints.find(i=>i.id===id);
const phaseAt=(g:number,r:ResolvedScene)=>r.phases.find(p=>p.startFrame<=g&&g<p.endFrame);
const cueAt=(g:number,r:ResolvedScene)=>r.cues.find(c=>c.startFrame<=g&&g<c.endFrame);
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const cueProgress=(g:number,c:Cue)=>clamp((g-c.startFrame)/Math.max(1,c.endFrame-c.startFrame));
const utteranceStart=(r:ResolvedScene,id:string):number|undefined=>{
  const cueStarts=r.cues.filter(c=>c.utteranceId===id).map(c=>c.startFrame);
  if(cueStarts.length)return Math.min(...cueStarts);
  return r.audioEvents.find(e=>e.utteranceId===id)?.startFrame;
};
const currentReveal=(g:number,r:ResolvedScene,ids:string[]):Set<string>=>{
  const eligible=ids.map(id=>({id,frame:utteranceStart(r,id)})).filter((x):x is {id:string;frame:number}=>x.frame!==undefined&&x.frame<=g);
  if(!eligible.length)return new Set();
  const max=Math.max(...eligible.map(x=>x.frame));
  return new Set(eligible.filter(x=>x.frame===max).map(x=>x.id));
};
const sceneLabel=(scene:Scene)=>scene.role==="story"?(scene.beat==="setup"?"WHAT CHANGED":scene.beat==="mechanism"?"HOW IT WORKS":scene.beat==="complication"?"THE CATCH":"WHAT IT MEANS"):scene.role==="retrieval"?"LISTENING CHECK":scene.role==="phrase"?"USEFUL ENGLISH":scene.role==="recap"?"TAKEAWAYS":"THE QUESTION";
const seedOf=(s:string)=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0);
const prettyCategory=(s:string)=>s.replace("_"," ").toUpperCase();

const SIGNALS:Array<{re:RegExp;signal:Signal}>=[
  {re:/\bhowever\b/i,signal:{token:"however",label:"CONTRAST",ja:"対比"}},
  {re:/\bbut\b/i,signal:{token:"but",label:"CONTRAST",ja:"対比"}},
  {re:/\bwhile\b/i,signal:{token:"while",label:"CONTRAST",ja:"対比"}},
  {re:/\bbecause\b/i,signal:{token:"because",label:"REASON",ja:"理由"}},
  {re:/\btherefore\b/i,signal:{token:"therefore",label:"RESULT",ja:"結果"}},
  {re:/\bso\b/i,signal:{token:"so",label:"RESULT",ja:"結果"}},
  {re:/\balthough\b/i,signal:{token:"although",label:"CONCESSION",ja:"譲歩"}},
  {re:/\beven though\b/i,signal:{token:"even though",label:"CONCESSION",ja:"譲歩"}},
  {re:/\binstead\b/i,signal:{token:"instead",label:"ALTERNATIVE",ja:"代替"}},
  {re:/\bif\b/i,signal:{token:"if",label:"CONDITION",ja:"条件"}},
];
const detectSignal=(text:string):Signal|undefined=>SIGNALS.find(x=>x.re.test(text))?.signal;
const pointForCue=(m:EpisodeManifest,cue:Cue|undefined):LearningPoint|undefined=>{
  if(!cue)return undefined;
  const text=cue.text.toLowerCase();
  return m.learningPoints.find(p=>text.includes(p.phrase.toLowerCase()))??m.learningPoints.find(p=>p.sourceUtteranceId===cue.utteranceId);
};

const Highlight=({text,phrase,signal}:{text:string;phrase?:string;signal?:Signal})=>{
  const target=phrase&&text.toLowerCase().includes(phrase.toLowerCase())?phrase:signal?.token;
  if(!target)return <>{text}</>;
  const i=text.toLowerCase().indexOf(target.toLowerCase());
  if(i<0)return <>{text}</>;
  const isPhrase=Boolean(phrase&&target.toLowerCase()===phrase.toLowerCase());
  return <>{text.slice(0,i)}<span style={{color:isPhrase?COLORS.accent:COLORS.accent2,fontWeight:800,textDecoration:"underline",textDecorationThickness:5,textUnderlineOffset:10}}>{text.slice(i,i+target.length)}</span>{text.slice(i+target.length)}</>;
};

const Backdrop=({frame,label,seed}:{frame:number;label:string;seed:number})=>{
  const x=50+Math.sin((frame+seed)/55)*8;
  const y=34+Math.cos((frame+seed)/72)*7;
  const x2=78+Math.cos((frame+seed)/64)*5;
  const y2=70+Math.sin((frame+seed)/83)*7;
  return <>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at ${x}% ${y}%, rgba(0,139,139,.13), transparent 31%), radial-gradient(circle at ${x2}% ${y2}%, rgba(229,107,63,.10), transparent 28%), ${COLORS.background}`}}/>
    <div style={{position:"absolute",inset:0,opacity:.19,backgroundImage:"linear-gradient(rgba(16,42,54,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,42,54,.08) 1px, transparent 1px)",backgroundSize:"64px 64px",transform:`translate(${Math.sin(frame/90)*8}px,${Math.cos(frame/105)*8}px)`}}/>
    <div style={{position:"absolute",left:60,top:106,fontSize:168,fontWeight:900,letterSpacing:"-.04em",color:"rgba(16,42,54,.035)",whiteSpace:"nowrap",textTransform:"uppercase"}}>{label}</div>
  </>;
};

const TopRail=({manifest,scene,resolved,frame}:{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;frame:number})=>{
  const index=Math.max(0,manifest.scenes.findIndex(s=>s.id===scene.id));
  const local=clamp(frame/Math.max(1,resolved.durationFrames-1));
  const whole=clamp((index+local)/Math.max(1,manifest.scenes.length));
  return <>
    <div style={{position:"absolute",left:0,top:0,width:"100%",height:7,background:"rgba(16,42,54,.10)"}}><div style={{height:"100%",width:`${whole*100}%`,background:COLORS.accent}}/></div>
    <div style={headerStyle}>
      <div style={{display:"flex",alignItems:"center",gap:18}}>
        <span style={{padding:"8px 14px",borderRadius:999,background:COLORS.navy,color:COLORS.white,fontWeight:800,fontSize:20}}>{String(index+1).padStart(2,"0")}/{String(manifest.scenes.length).padStart(2,"0")}</span>
        <span style={{fontWeight:800,color:COLORS.text}}>{sceneLabel(scene)}</span>
      </div>
      <div style={{maxWidth:900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>{manifest.centralQuestion}</div>
      <div style={{fontWeight:800}}>{prettyCategory(manifest.category)}</div>
    </div>
  </>;
};

const LearningRibbon=({manifest,scene,resolved,globalFrame,phaseName}:{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;globalFrame:number;phaseName:string})=>{
  const cue=cueAt(globalFrame,resolved);
  if(scene.role==="retrieval"&&phaseName!=="reveal")return null;
  if(!cue)return null;
  const utterance=getU(manifest,cue.utteranceId);
  const index=cue.chunkIndices[0]??0;
  const total=utterance?.chunks.length??1;
  const progress=cueProgress(globalFrame,cue);
  const point=pointForCue(manifest,cue);
  const signal=detectSignal(cue.text);
  const showJa=scene.role!=="retrieval"&&progress>.38;
  const phraseInChunk=point&&cue.text.toLowerCase().includes(point.phrase.toLowerCase())?point.phrase:undefined;
  return <div style={{width:"100%",height:250,border:`1px solid ${COLORS.line}`,borderRadius:30,background:"rgba(255,255,255,.92)",boxShadow:`0 18px 55px ${COLORS.shadow}`,padding:"24px 38px 22px",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",left:0,top:0,height:7,width:`${progress*100}%`,background:point?COLORS.accent:signal?COLORS.accent2:COLORS.lineStrong}}/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,height:34,marginBottom:10,fontSize:19,fontWeight:800,letterSpacing:".04em"}}>
      <span style={{color:COLORS.muted}}>LISTEN IN CHUNKS</span>
      <span style={{padding:"5px 10px",borderRadius:999,background:"#EEF1EF",color:COLORS.muted}}>CHUNK {index+1}/{total}</span>
      {signal?<span style={{padding:"5px 10px",borderRadius:999,background:COLORS.accent2Soft,color:COLORS.accent2}}>{signal.token.toUpperCase()} → {signal.label} / {signal.ja}</span>:null}
      {point?<span style={{padding:"5px 10px",borderRadius:999,background:COLORS.accentSoft,color:COLORS.accent}}>{point.phrase} = {point.meaningJa}</span>:null}
    </div>
    <div style={{fontSize:54,lineHeight:1.28,fontWeight:680,letterSpacing:"-.015em",minHeight:74,display:"flex",alignItems:"center",justifyContent:"center"}}><div><Highlight text={cue.text} phrase={phraseInChunk} signal={signal}/></div></div>
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",fontSize:31,lineHeight:1.35,minHeight:48,marginTop:8,color:COLORS.muted,opacity:showJa?1:0,transform:`translateY(${showJa?0:8}px)`}}>{cue.translationJa}</div>
  </div>;
};

const LearningMoment=({manifest,scene,cue}:{manifest:EpisodeManifest;scene:Scene;cue:Cue|undefined})=>{
  if(scene.role!=="story"||!cue)return null;
  const p=manifest.learningPoints.find(item=>item.sourceUtteranceId===cue.utteranceId);
  if(!p)return null;
  return <div style={{position:"absolute",right:116,top:615,width:520,padding:"16px 22px",borderRadius:18,background:COLORS.navy,color:COLORS.white,boxShadow:`0 14px 38px rgba(11,37,49,.22)`,display:"flex",gap:16,alignItems:"center"}}>
    <div style={{fontSize:16,fontWeight:900,letterSpacing:".10em",color:"#8BE0D5"}}>USEFUL ENGLISH</div>
    <div style={{height:28,width:1,background:"rgba(255,255,255,.25)"}}/>
    <div style={{fontSize:24,fontWeight:800}}>{p.phrase}</div>
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",fontSize:20,color:"rgba(255,255,255,.78)"}}>{p.meaningJa}</div>
  </div>;
};

const focus=(on:boolean):React.CSSProperties=>({borderColor:on?COLORS.accent:COLORS.line,borderWidth:on?4:2,opacity:on?1:.52,fontWeight:on?760:560,transform:on?"scale(1.035)":"scale(1)",boxShadow:on?`0 16px 42px rgba(0,139,139,.16)`:"none"});
const metricText=(value:string,p:number)=>{
  const match=value.match(/^([~]?)(-?\d+(?:\.\d+)?)$/);
  if(!match)return value;
  const prefix=match[1]??"";
  const raw=match[2]??"0";
  const n=Number(raw),decimals=(raw.split(".")[1]??"").length;
  return `${prefix}${(n*p).toFixed(decimals)}`;
};

export const SceneRenderer:React.FC<Props>=({manifest,scene,resolved})=>{
  const f=useCurrentFrame();
  const {fps}=useVideoConfig();
  const g=resolved.startFrame+f;
  const phaseObj=phaseAt(g,resolved);
  const ph=phaseObj?.name??"normal";
  const cue=cueAt(g,resolved);
  const uid=cue?.utteranceId??null;
  const seed=seedOf(scene.id);
  const intro=spring({frame:f,fps,config:{damping:18,stiffness:130,mass:.8}});
  const fadeOut=interpolate(f,[Math.max(0,resolved.durationFrames-10),Math.max(1,resolved.durationFrames-1)],[1,.92],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const sceneP=clamp(f/Math.max(1,resolved.durationFrames-1));
  let visual:React.ReactNode=null;

  if(scene.visual.type==="card"){
    const v=scene.visual;
    const isHook=scene.role==="hook";
    const headline=/news peg/i.test(v.headline)?"Why this suddenly matters":v.headline;
    visual=<div style={{width:isHook?1570:1510,minHeight:isHook?410:360,border:`1px solid ${COLORS.line}`,borderRadius:38,padding:isHook?"52px 76px":"46px 68px",textAlign:"center",background:COLORS.panel,boxShadow:`0 24px 70px ${COLORS.shadow}`,transform:`scale(${.94+intro*.06}) rotate(${Math.sin((f+seed)/80)*.18}deg)`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",left:-100,top:-160,width:420,height:420,borderRadius:"50%",background:"rgba(0,139,139,.08)"}}/>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:".14em",color:COLORS.accent,marginBottom:18}}>{isHook?"ONE QUESTION CHANGES THE STORY":"WHY THIS MATTERS"}</div>
      <div style={{fontSize:isHook?88:72,lineHeight:1.12,fontWeight:850,letterSpacing:"-.035em",position:"relative"}}>{headline}</div>
      {v.body?<div style={{fontSize:isHook?42:38,lineHeight:1.35,marginTop:30,color:COLORS.muted,fontWeight:520,opacity:interpolate(f,[8,24],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})}}>{v.body}</div>:null}
      {isHook?<div style={{margin:"34px auto 0",display:"inline-flex",padding:"13px 22px",borderRadius:999,background:COLORS.navy,color:COLORS.white,fontSize:28,fontWeight:750}}>{manifest.centralQuestion}</div>:null}
    </div>;
  }

  if(scene.visual.type==="metric"){
    const v=scene.visual;
    const count=interpolate(f,[4,34],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
    visual=<div style={{width:1460,display:"grid",gridTemplateColumns:"450px 1fr",gap:70,alignItems:"center"}}>
      <div style={{width:390,height:390,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`conic-gradient(${COLORS.accent} ${count*300}deg, rgba(0,139,139,.10) 0deg)`,transform:`scale(${.9+intro*.1})`}}><div style={{width:320,height:320,borderRadius:"50%",background:COLORS.white,display:"flex",alignItems:"baseline",justifyContent:"center",paddingTop:95,boxSizing:"border-box",boxShadow:`inset 0 0 0 1px ${COLORS.line}`}}><span style={{fontSize:126,fontWeight:900,color:COLORS.accent,letterSpacing:"-.05em"}}>{metricText(v.value,count)}</span><span style={{fontSize:42,fontWeight:800,marginLeft:10}}>{v.unit}</span></div></div>
      <div><div style={{fontSize:60,lineHeight:1.15,fontWeight:820,letterSpacing:"-.02em"}}>{v.label}</div><div style={{height:8,width:`${Math.max(8,count*100)}%`,maxWidth:700,background:COLORS.accent,borderRadius:99,marginTop:34}}/><div style={{fontSize:26,marginTop:22,color:COLORS.warning,fontWeight:800,letterSpacing:".05em"}}>{v.qualifier}</div></div>
    </div>;
  }

  if(scene.visual.type==="chain"){
    const v=scene.visual;
    const active=currentReveal(g,resolved,v.nodes.map(n=>n.revealAtUtteranceId));
    visual=<div style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",gap:22}}>{v.nodes.map((n,i)=>{
      const start=utteranceStart(resolved,n.revealAtUtteranceId)??resolved.startFrame;
      const revealed=g>=start;
      const nodeIn=spring({frame:Math.max(0,g-start),fps,config:{damping:17,stiffness:150}});
      return <React.Fragment key={`${n.label}-${i}`}><div style={{width:350,minHeight:190,border:`2px solid ${COLORS.line}`,borderRadius:26,display:"flex",alignItems:"center",justifyContent:"center",padding:28,textAlign:"center",fontSize:45,lineHeight:1.18,background:COLORS.white,...focus(active.has(n.revealAtUtteranceId)),opacity:revealed?(.55+.45*nodeIn):.16,transform:`translateY(${revealed?(1-nodeIn)*18:18}px) scale(${active.has(n.revealAtUtteranceId)?1.035:1})`}}>{n.label}</div>{i<v.nodes.length-1?<div style={{width:78,height:24,position:"relative",opacity:revealed?1:.18}}><div style={{position:"absolute",left:0,right:0,top:10,height:3,background:COLORS.lineStrong}}/><div style={{position:"absolute",top:5,left:`${((f+i*11)%42)/42*56}px`,width:13,height:13,borderRadius:"50%",background:COLORS.accent}}/><div style={{position:"absolute",right:0,top:0,fontSize:24,color:COLORS.muted}}>›</div></div>:null}</React.Fragment>;
    })}</div>;
  }

  if(scene.visual.type==="compare"){
    const v=scene.visual;
    const active=currentReveal(g,resolved,v.rows.map(r=>r.revealAtUtteranceId));
    visual=<div style={{width:1580}}>
      <div style={{display:"grid",gridTemplateColumns:"310px 1fr 1fr",gap:24,fontSize:31,fontWeight:850,marginBottom:18,color:COLORS.muted}}><div/><div style={{textAlign:"center",padding:"12px 0",borderRadius:16,background:"rgba(16,42,54,.06)"}}>{v.leftTitle}</div><div style={{textAlign:"center",padding:"12px 0",borderRadius:16,background:COLORS.accentSoft,color:COLORS.accent}}>{v.rightTitle}</div></div>
      {v.rows.map((r,i)=>{const start=utteranceStart(resolved,r.revealAtUtteranceId)??resolved.startFrame;const shown=g>=start;const rowIn=spring({frame:Math.max(0,g-start),fps,config:{damping:20,stiffness:170}});const on=active.has(r.revealAtUtteranceId);return <div key={`${r.aspect}-${i}`} style={{display:"grid",gridTemplateColumns:"310px 1fr 1fr",gap:24,minHeight:132,alignItems:"center",borderTop:`1px solid ${COLORS.line}`,fontSize:41,opacity:shown?(.5+.5*rowIn):.14,transform:`translateX(${shown?(1-rowIn)*25:25}px)`,background:on?"linear-gradient(90deg, transparent, rgba(0,139,139,.06), transparent)":"transparent"}}><div style={{fontWeight:800}}>{r.aspect}</div><div style={{textAlign:"center",fontWeight:650}}>{r.left}</div><div style={{textAlign:"center",fontWeight:850,color:on?COLORS.accent:COLORS.text}}>{r.right}</div></div>;})}
    </div>;
  }

  if(scene.visual.type==="timeline"){
    const v=scene.visual;
    const active=currentReveal(g,resolved,v.events.map(e=>e.revealAtUtteranceId));
    visual=<div style={{width:1580,position:"relative",paddingTop:36}}>
      <div style={{position:"absolute",left:80,right:80,top:60,height:5,background:COLORS.line,borderRadius:99}}/><div style={{position:"absolute",left:80,top:60,height:5,width:`${Math.max(0,(1580-160)*sceneP)}px`,background:COLORS.accent,borderRadius:99}}/>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${v.events.length},1fr)`,gap:22,position:"relative"}}>{v.events.map((e,i)=>{const start=utteranceStart(resolved,e.revealAtUtteranceId)??resolved.startFrame;const shown=g>=start;const eventIn=spring({frame:Math.max(0,g-start),fps,config:{damping:18,stiffness:145}});const on=active.has(e.revealAtUtteranceId);return <div key={`${e.dateLabel}-${i}`} style={{paddingTop:42}}><div style={{width:22,height:22,borderRadius:"50%",background:shown?COLORS.accent:COLORS.line,margin:"0 auto 18px",boxShadow:on?"0 0 0 10px rgba(0,139,139,.12)":"none"}}/><div style={{border:`2px solid ${on?COLORS.accent:COLORS.line}`,borderRadius:22,padding:24,textAlign:"center",minHeight:180,background:COLORS.white,opacity:shown?(.5+.5*eventIn):.18,transform:`translateY(${shown?(1-eventIn)*18:18}px) scale(${on?1.025:1})`,boxShadow:on?`0 15px 38px rgba(0,139,139,.13)`:"none"}}><div style={{fontSize:24,color:COLORS.warning,fontWeight:850}}>{e.dateLabel}</div><div style={{fontSize:38,lineHeight:1.22,marginTop:14,fontWeight:700}}>{e.label}</div></div></div>;})}</div>
    </div>;
  }

  if(scene.visual.type==="phrase"){
    const v=scene.visual;
    const p=getP(manifest,v.learningPointId),source=p?getU(manifest,p.sourceUtteranceId):undefined;
    visual=p?<div style={{width:1540,textAlign:"center",background:COLORS.panel,border:`1px solid ${COLORS.line}`,borderRadius:34,padding:"40px 62px",boxShadow:`0 24px 70px ${COLORS.shadow}`,transform:`scale(${.95+intro*.05})`}}>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:".13em",color:COLORS.accent,marginBottom:22}}>HEAR IT → CHUNK IT → KEEP IT</div>
      <div style={{fontSize:67,lineHeight:1.24,fontWeight:690}}><Highlight text={source?.text??p.phrase} phrase={p.phrase}/></div>
      <div style={{display:"inline-flex",alignItems:"center",gap:20,marginTop:30,padding:"13px 22px",borderRadius:18,background:COLORS.accentSoft}}><span style={{fontSize:31,fontWeight:900,color:COLORS.accent}}>{p.phrase}</span><span style={{fontFamily:"'Noto Sans JP',sans-serif",fontSize:28,color:COLORS.text}}>{p.meaningJa}</span></div>
    </div>:null;
  }

  if(scene.visual.type==="retrieval"){
    const v=scene.visual;
    const reveal=ph==="reveal"||ph==="answer";
    const remaining=phaseObj?Math.max(1,Math.ceil((phaseObj.endFrame-g)/fps)):0;
    const listening=ph==="listen"||ph==="reveal";
    visual=<div style={{width:1540,textAlign:"center"}}>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:".14em",color:COLORS.accent,marginBottom:18}}>{ph==="listen"?"FIRST LISTEN · NO SUBTITLES":ph==="think"?"LOCK IN YOUR ANSWER":ph==="reveal"?"REPLAY · NOW WITH CHUNKS":ph==="answer"?"ANSWER":"LISTENING CHECK"}</div>
      <div style={{fontSize:54,lineHeight:1.2,fontWeight:830}}>{v.question}</div>
      {listening?<div style={{height:74,display:"flex",alignItems:"center",justifyContent:"center",gap:9,marginTop:22}}>{Array.from({length:24},(_,i)=><div key={i} style={{width:9,height:18+Math.abs(Math.sin((f+i*5)/9))*50,background:i%3===0?COLORS.accent:COLORS.lineStrong,borderRadius:99}}/>)}</div>:null}
      <div style={{display:"flex",gap:34,justifyContent:"center",marginTop:listening?18:44}}>{v.options.map((o,i)=>{const ok=reveal&&i===v.correctIndex;return <div key={o} style={{width:600,padding:"28px 28px",borderRadius:22,border:`4px solid ${ok?COLORS.accent:COLORS.line}`,fontSize:40,fontWeight:ok?850:650,background:ok?COLORS.accentSoft:COLORS.white,transform:`scale(${ok?1.035:1})`,boxShadow:ok?`0 16px 42px rgba(0,139,139,.16)`:"none"}}>{ok?"✓ ":""}{o}</div>;})}</div>
      <div style={{fontFamily:ph==="answer"?"'Noto Sans JP',sans-serif":undefined,fontSize:ph==="think"?74:30,marginTop:30,color:ph==="think"?COLORS.accent:COLORS.muted,fontWeight:ph==="think"?900:700}}>{ph==="prompt"?"Listen for the reason. Don’t read ahead.":ph==="think"?remaining:ph==="answer"?v.answerJa:ph==="listen"?"What did you catch?":""}</div>
    </div>;
  }

  if(scene.visual.type==="recap"){
    const v=scene.visual;
    const activeIdx=Math.max(0,scene.utteranceIds.indexOf(uid??scene.utteranceIds[0]));
    visual=<div style={{width:1540}}><div style={{textAlign:"center",fontSize:20,fontWeight:900,letterSpacing:".13em",color:COLORS.accent,marginBottom:22}}>THREE PHRASES WORTH KEEPING</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>{v.learningPointIds.map((pid,i)=>{const p=getP(manifest,pid);if(!p)return null;const on=i===Math.min(activeIdx,2);return <div key={pid} style={{minHeight:260,border:`3px solid ${on?COLORS.accent:COLORS.line}`,borderRadius:26,padding:"34px 28px",background:on?COLORS.accentSoft:COLORS.white,textAlign:"center",opacity:on?1:.56,transform:`translateY(${on?-8:0}px) scale(${on?1.025:1})`,boxShadow:on?`0 18px 50px rgba(0,139,139,.15)`:"none"}}><div style={{fontSize:20,fontWeight:900,color:COLORS.muted}}>0{i+1}</div><div style={{fontSize:42,fontWeight:900,color:on?COLORS.accent:COLORS.text,marginTop:24}}>{p.phrase}</div><div style={{fontFamily:"'Noto Sans JP',sans-serif",fontSize:27,marginTop:22,color:COLORS.muted}}>{p.meaningJa}</div></div>;})}</div></div>;
  }

  return <div style={{...base,position:"relative",width:"100%",height:"100%",overflow:"hidden",opacity:fadeOut}}>
    <Backdrop frame={f} label={sceneLabel(scene)} seed={seed}/>
    <TopRail manifest={manifest} scene={scene} resolved={resolved} frame={f}/>
    <div style={{...mainArea,opacity:interpolate(f,[0,8],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}),transform:`translateY(${(1-intro)*14}px)`}}>{visual}</div>
    <LearningMoment manifest={manifest} scene={scene} cue={cue}/>
    <div style={subtitleArea}><LearningRibbon manifest={manifest} scene={scene} resolved={resolved} globalFrame={g} phaseName={ph}/></div>
    <div style={{position:"absolute",left:116,bottom:22,width:1688,fontSize:19,color:COLORS.muted,display:"flex",justifyContent:"space-between",opacity:.72}}><span>{manifest.kind==="fixture"?"FIXTURE · not for publication":`As of ${manifest.asOf}`}</span><span>English first · meaning appears after you have time to process</span></div>
  </div>;
};
