import React from "react";
import {interpolate,spring,useCurrentFrame,useVideoConfig} from "remotion";
import type {Cue,EpisodeManifest,LearningPoint,ResolvedScene,Scene,Utterance} from "../contracts/types";
import {base,COLORS,headerStyle,mainArea,subtitleArea} from "./styles";
import {ChapterCall} from "./ChapterCall";
import {chapterForBeat} from "../chapters";
import {visualJa} from "./visualJa";

type Props={manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene};

const getP=(m:EpisodeManifest,id:string):LearningPoint|undefined=>m.learningPoints.find(i=>i.id===id);
const phaseAt=(g:number,r:ResolvedScene)=>r.phases.find(p=>p.startFrame<=g&&g<p.endFrame);
const cueAt=(g:number,r:ResolvedScene)=>r.cues.find(c=>c.startFrame<=g&&g<c.endFrame);
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const utteranceStart=(r:ResolvedScene,id:string):number|undefined=>{
  const frames=r.cues.filter(c=>c.utteranceId===id).map(c=>c.startFrame);
  if(frames.length)return Math.min(...frames);
  return r.audioEvents.find(e=>e.utteranceId===id)?.startFrame;
};
const revealed=(g:number,r:ResolvedScene,id:string)=>{
  const start=utteranceStart(r,id);
  return start!==undefined&&start<=g;
};
const currentReveal=(g:number,r:ResolvedScene,ids:string[]):string|null=>{
  const xs=ids.map(id=>({id,start:utteranceStart(r,id)})).filter((x):x is {id:string;start:number}=>x.start!==undefined&&x.start<=g);
  if(!xs.length)return null;
  xs.sort((a,b)=>b.start-a.start);
  return xs[0]?.id??null;
};
const sceneLabel=(scene:Scene)=>scene.role==="story"?(scene.beat==="setup"?"WHAT CHANGED":scene.beat==="mechanism"?"HOW IT WORKS":scene.beat==="complication"?"THE CATCH":"WHAT IT MEANS"):scene.role==="retrieval"?"LISTENING CHECK":scene.role==="phrase"?"ENGLISH REPLAY":scene.role==="recap"?"TAKEAWAY":"THE QUESTION";
const pointForCue=(m:EpisodeManifest,cue:Cue|undefined):LearningPoint|undefined=>{
  if(!cue)return undefined;
  const text=cue.text.toLowerCase();
  return m.learningPoints.find(p=>text.includes(p.phrase.toLowerCase()))??m.learningPoints.find(p=>p.sourceUtteranceId===cue.utteranceId);
};
const highlightPhrase=(text:string,phrase?:string)=>{
  if(!phrase)return <>{text}</>;
  const i=text.toLowerCase().indexOf(phrase.toLowerCase());
  if(i<0)return <>{text}</>;
  return <>{text.slice(0,i)}<span style={{color:COLORS.navy,fontWeight:900,background:"#9FE4D9",borderRadius:8,padding:"0 .1em",boxDecorationBreak:"clone",WebkitBoxDecorationBreak:"clone"}}>{text.slice(i,i+phrase.length)}</span>{text.slice(i+phrase.length)}</>;
};

const Backdrop=({frame}:{frame:number})=>{
  const x=42+Math.sin(frame/95)*5;
  const y=34+Math.cos(frame/110)*4;
  return <>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at ${x}% ${y}%, rgba(221,243,239,.14), transparent 38%)`,pointerEvents:"none"}}/>
    <div style={{position:"absolute",inset:0,opacity:.035,backgroundImage:"linear-gradient(rgba(16,42,54,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(16,42,54,.12) 1px, transparent 1px)",backgroundSize:"72px 72px",pointerEvents:"none"}}/>
  </>;
};

const chapterFor=(scene:Scene):{step:string;label:string;labelJa:string}=>{
  if(scene.role==="story"){const c=chapterForBeat(scene.beat);if(c)return {step:`${c.index} / 4`,label:c.labelEn,labelJa:c.labelJa};}
  if(scene.role==="hook")return {step:"START",label:"THE QUESTION",labelJa:"今日の問い"};
  if(scene.role==="phrase")return {step:"REPLAY",label:"BUSINESS ENGLISH",labelJa:"実践表現"};
  if(scene.role==="retrieval")return {step:"CHECK",label:"LISTENING CHECK",labelJa:"リスニング確認"};
  if(scene.role==="recap")return {step:"END",label:"THE TAKEAWAY",labelJa:"結論"};
  return {step:"",label:sceneLabel(scene),labelJa:""};
};
const cornerFor=(scene:Scene)=>scene.role==="story"?{en:"STORY",ja:"解説"}:scene.role==="phrase"?{en:"REPLAY",ja:"英語"}:scene.role==="retrieval"?{en:"CHECK",ja:"確認"}:scene.role==="recap"?{en:"TAKEAWAY",ja:"結論"}:{en:"HOOK",ja:"導入"};
const topicFor=(scene:Scene)=>scene.visual.type==="card"?scene.visual.headline:scene.visual.type==="metric"?scene.visual.label:scene.visual.type==="chain"?"Cause and effect":scene.visual.type==="compare"?`${scene.visual.leftTitle} vs ${scene.visual.rightTitle}`:scene.visual.type==="timeline"?"How the story develops":scene.visual.type==="phrase"?"Replay from the story":scene.visual.type==="retrieval"?"Listen and check":"What to remember";

const TopRail=({manifest,scene,resolved,frame}:{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;frame:number})=>{
  const index=Math.max(0,manifest.scenes.findIndex(s=>s.id===scene.id));
  const whole=clamp((index+frame/Math.max(1,resolved.durationFrames-1))/Math.max(1,manifest.scenes.length));
  const chapter=chapterFor(scene);const corner=cornerFor(scene);const topic=topicFor(scene);
  return <>
    <div style={{position:"absolute",left:0,top:0,width:"100%",height:6,background:"rgba(16,42,54,.12)"}}><div style={{height:"100%",width:`${whole*100}%`,background:COLORS.accent}}/></div>
    <div style={{...headerStyle,padding:"0 18px",borderRadius:18,background:"rgba(244,241,232,.86)",boxShadow:"0 8px 28px rgba(16,42,54,.08)"}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <span style={{fontSize:18,fontWeight:900,color:COLORS.accent}}>{chapter.step}</span>
        <div><div style={{fontSize:24,fontWeight:900,color:COLORS.text}}>{chapter.label}</div><div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:15,fontWeight:650,color:COLORS.muted,marginTop:1}}>{chapter.labelJa}</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16,maxWidth:820}}>
        <div style={{padding:"7px 12px",borderRadius:999,background:COLORS.navy,color:COLORS.white,textAlign:"center",minWidth:108}}><div style={{fontSize:14,fontWeight:900,letterSpacing:".08em"}}>{corner.en}</div><div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:12,opacity:.8}}>{corner.ja}</div></div>
        <div style={{minWidth:0}}><div style={{fontSize:21,fontWeight:760,color:COLORS.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{topic}</div></div>
      </div>
    </div>
  </>;
};

const BilingualCaption=({manifest,scene,resolved,globalFrame,phaseName}:{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;globalFrame:number;phaseName:string})=>{
  const hidden=scene.role==="retrieval"&&phaseName!=="reveal"&&phaseName!=="answer";
  const cues=[...resolved.cues].sort((a,b)=>a.startFrame-b.startFrame);
  const cue=hidden?undefined:(cueAt(globalFrame,resolved)??[...cues].filter(c=>c.startFrame<=globalFrame).at(-1));
  const point=pointForCue(manifest,cue);
  const enter=cue?interpolate(globalFrame,[cue.startFrame,cue.startFrame+7],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}):1;
  const y=interpolate(enter,[0,1],[16,0]);
  if(!cue)return <div/>;
  return <div style={{width:"100%",minHeight:138,padding:"20px 38px 18px",borderRadius:24,background:"rgba(7,28,38,.91)",boxShadow:"0 18px 50px rgba(3,18,25,.24)",color:COLORS.white,transform:`translateY(${y}px)`,opacity:interpolate(enter,[0,1],[.35,1])}}>
    {point?<div style={{display:"inline-flex",padding:"5px 10px",borderRadius:999,background:"rgba(159,228,217,.17)",border:"1px solid rgba(159,228,217,.44)",fontSize:13,fontWeight:900,letterSpacing:".1em",color:"#AEEBE2",marginBottom:8}}>BUSINESS ENGLISH · {point.meaningJa}</div>:null}
    <div style={{fontSize:42,lineHeight:1.16,fontWeight:760,letterSpacing:"-.012em",whiteSpace:"normal"}}>{highlightPhrase(cue.text,point?.phrase)}</div>
    <div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:23,lineHeight:1.3,color:"rgba(255,255,255,.72)",fontWeight:540,marginTop:7}}>{cue.translationJa}</div>
  </div>;
};
const BilingualVisualLabel=({text,large=false}:{text:string;large?:boolean})=>{const ja=visualJa(text);return <div style={{textAlign:"center"}}><div style={{fontSize:large?42:28,fontWeight:820,lineHeight:1.15}}>{text}</div>{ja?<div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:large?23:18,color:"currentColor",opacity:.68,fontWeight:650,marginTop:7}}>{ja}</div>:null}</div>;};
const focusStyle=(active:boolean,visible=true):React.CSSProperties=>({opacity:visible?(active?1:.42):0,transform:active?"scale(1.025)":"scale(1)",borderColor:active?COLORS.accent:COLORS.line,boxShadow:active?"0 14px 36px rgba(0,139,139,.18)":"none"});

export const SceneRenderer:React.FC<Props>=({manifest,scene,resolved})=>{
  const f=useCurrentFrame();
  const {fps}=useVideoConfig();
  const g=resolved.startFrame+f;
  const ph=phaseAt(g,resolved)?.name??"normal";
  const intro=spring({frame:f,fps,config:{damping:18,stiffness:115,mass:.9}});
  const fadeOut=interpolate(f,[Math.max(0,resolved.durationFrames-10),Math.max(1,resolved.durationFrames-1)],[1,.94],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  let visual:React.ReactNode=null;
  const activeChapter=scene.role==="story"?chapterForBeat(scene.beat):undefined;
  if(activeChapter&&(resolved.chapterCallFrames??0)>0&&f<(resolved.chapterCallFrames??0))return <ChapterCall chapter={activeChapter}/>;

  if(scene.visual.type==="card"){
    const v=scene.visual;const isHook=scene.role==="hook";const headline=/news peg/i.test(v.headline)?"Why this suddenly matters":v.headline;
    visual=<div style={{width:isHook?1540:1450,maxWidth:"90%",padding:isHook?"58px 78px":"46px 62px",borderRadius:38,background:isHook?"rgba(7,28,38,.78)":"rgba(255,255,255,.90)",color:isHook?COLORS.white:COLORS.text,border:isHook?"1px solid rgba(255,255,255,.18)":`1px solid ${COLORS.line}`,boxShadow:"0 24px 66px rgba(5,24,32,.20)",textAlign:"center",transform:`scale(${.95+intro*.05})`}}>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:".15em",color:isHook?"#9FE4D9":COLORS.accent,marginBottom:18}}>{isHook?"WHY THIS MATTERS NOW":"THE POINT"}</div>
      <div style={{fontSize:isHook?86:66,lineHeight:1.08,fontWeight:900,letterSpacing:"-.035em"}}>{headline}</div>
      {v.body?<div style={{fontSize:isHook?32:34,lineHeight:1.32,marginTop:24,color:isHook?"rgba(255,255,255,.78)":COLORS.muted,fontWeight:540}}>{v.body}</div>:null}
    </div>;
  }

  if(scene.visual.type==="metric"){
    const v=scene.visual;const raw=v.value.match(/^([~]?)(-?\d+(?:\.\d+)?)$/);const p=interpolate(f,[4,34],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});const value=raw?`${raw[1]??""}${(Number(raw[2])*p).toFixed((raw[2].split(".")[1]??"").length)}`:v.value;
    visual=<div style={{width:1360,textAlign:"center",padding:"44px 70px",borderRadius:42,background:"rgba(255,255,255,.91)",border:`1px solid ${COLORS.line}`,boxShadow:"0 22px 62px rgba(5,24,32,.20)"}}>
      <div style={{height:9,width:`${Math.max(8,p*100)}%`,maxWidth:"100%",margin:"0 auto 32px",borderRadius:999,background:COLORS.accent}}/>
      <div style={{fontSize:158,fontWeight:950,lineHeight:1,color:COLORS.accent,letterSpacing:"-.06em"}}>{value}<span style={{fontSize:58,marginLeft:18,color:COLORS.text}}>{v.unit}</span></div>
      <div style={{marginTop:26}}><BilingualVisualLabel text={v.label} large/></div><div style={{fontSize:27,color:COLORS.muted,marginTop:12}}>{v.qualifier}</div>
    </div>;
  }

  if(scene.visual.type==="chain"){
    const v=scene.visual;const current=currentReveal(g,resolved,v.nodes.map(n=>n.revealAtUtteranceId));
    visual=<div style={{width:1540,display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>{v.nodes.map((n,i)=>{const visible=revealed(g,resolved,n.revealAtUtteranceId);const active=current===n.revealAtUtteranceId;return <React.Fragment key={`${n.label}-${i}`}><div style={{minWidth:220,maxWidth:330,padding:"30px 28px",borderRadius:28,border:"3px solid",background:"rgba(255,255,255,.93)",fontSize:30,lineHeight:1.2,textAlign:"center",fontWeight:active?820:650,...focusStyle(active,visible)}}><BilingualVisualLabel text={n.label}/></div>{i<v.nodes.length-1?<div style={{fontSize:42,color:visible?COLORS.accent:COLORS.line}}>→</div>:null}</React.Fragment>;})}</div>;
  }

  if(scene.visual.type==="compare"){
    const v=scene.visual;const current=currentReveal(g,resolved,v.rows.map(r=>r.revealAtUtteranceId));
    visual=<div style={{width:1480,borderRadius:34,overflow:"hidden",border:`1px solid ${COLORS.line}`,background:"rgba(255,255,255,.93)",boxShadow:"0 20px 58px rgba(5,24,32,.20)"}}><div style={{display:"grid",gridTemplateColumns:"280px 1fr 1fr",padding:"22px 30px",background:COLORS.navy,color:COLORS.white,fontSize:28,fontWeight:820}}><div/><BilingualVisualLabel text={v.leftTitle}/><BilingualVisualLabel text={v.rightTitle}/></div>{v.rows.map((r,i)=>{const visible=revealed(g,resolved,r.revealAtUtteranceId),active=current===r.revealAtUtteranceId;return <div key={`${r.aspect}-${i}`} style={{display:"grid",gridTemplateColumns:"280px 1fr 1fr",padding:"22px 30px",fontSize:28,borderTop:`1px solid ${COLORS.line}`,background:active?COLORS.accentSoft:COLORS.white,...focusStyle(active,visible)}}><div style={{fontWeight:820}}><BilingualVisualLabel text={r.aspect}/></div><BilingualVisualLabel text={r.left}/><BilingualVisualLabel text={r.right}/></div>;})}</div>;
  }

  if(scene.visual.type==="timeline"){
    const v=scene.visual;const current=currentReveal(g,resolved,v.events.map(e=>e.revealAtUtteranceId));
    visual=<div style={{width:1500,display:"flex",alignItems:"stretch",gap:20}}>{v.events.map((e,i)=>{const visible=revealed(g,resolved,e.revealAtUtteranceId),active=current===e.revealAtUtteranceId;return <div key={`${e.dateLabel}-${i}`} style={{flex:1,minHeight:220,padding:"30px 26px",borderRadius:28,border:"3px solid",background:"rgba(255,255,255,.93)",...focusStyle(active,visible)}}><div style={{fontSize:22,fontWeight:900,color:COLORS.accent,marginBottom:18}}>{e.dateLabel}</div><div style={{fontSize:30,lineHeight:1.28,fontWeight:active?820:650}}><BilingualVisualLabel text={e.label}/></div></div>;})}</div>;
  }

  if(scene.visual.type==="phrase"){
    const p=getP(manifest,scene.visual.learningPointId);
    visual=p?<div style={{width:1300,textAlign:"center",padding:"54px 72px",borderRadius:40,background:"rgba(11,37,49,.93)",color:COLORS.white,boxShadow:"0 24px 68px rgba(5,24,32,.28)"}}><div style={{fontSize:19,fontWeight:900,letterSpacing:".14em",color:"#9FE4D9"}}>ENGLISH REPLAY · FROM THE STORY</div><div style={{fontSize:86,fontWeight:900,marginTop:18,letterSpacing:"-.035em"}}>{p.phrase}</div><div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:38,marginTop:18,color:"rgba(255,255,255,.80)"}}>{p.meaningJa}</div><div style={{fontSize:20,marginTop:24,color:"rgba(255,255,255,.54)"}}>Listen once. Notice the chunk. Shadow it once.</div></div>:null;
  }

  if(scene.visual.type==="retrieval"){
    const v=scene.visual;const showAnswer=ph==="reveal"||ph==="answer";const think=ph==="think";const phase=phaseAt(g,resolved);const remain=phase?Math.max(0,Math.ceil((phase.endFrame-g)/fps)):0;
    visual=<div style={{width:1380,textAlign:"center",padding:"42px 60px",borderRadius:38,background:COLORS.panel,border:`1px solid ${COLORS.line}`,boxShadow:`0 22px 62px ${COLORS.shadow}`}}><div style={{fontSize:20,fontWeight:900,letterSpacing:".12em",color:COLORS.accent}}>{ph==="listen"?"LISTEN — NO SUBTITLES":think?"WHAT DID IT MEAN?":showAnswer?"CHECK":"LISTENING CHECK"}</div><div style={{fontSize:54,lineHeight:1.2,fontWeight:840,marginTop:20}}>{v.question}</div>{think?<div style={{fontSize:74,fontWeight:900,color:COLORS.accent2,marginTop:24}}>{remain}</div>:null}{!think&&ph!=="listen"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginTop:34}}>{v.options.map((o,i)=><div key={o} style={{padding:"24px 28px",borderRadius:24,border:`3px solid ${showAnswer&&i===v.correctIndex?COLORS.accent:COLORS.line}`,background:showAnswer&&i===v.correctIndex?COLORS.accentSoft:COLORS.white,fontSize:29,fontWeight:showAnswer&&i===v.correctIndex?820:620}}>{o}</div>)}</div>:null}{showAnswer?<div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:29,color:COLORS.muted,marginTop:26}}>{v.answerJa}</div>:null}</div>;
  }

  if(scene.visual.type==="recap"){
    visual=<div style={{width:1500}}><div style={{padding:"32px 46px",borderRadius:30,background:"rgba(11,37,49,.93)",color:COLORS.white,textAlign:"center",boxShadow:"0 20px 60px rgba(5,24,32,.22)"}}><div style={{fontSize:17,fontWeight:900,letterSpacing:".14em",color:"#9FE4D9"}}>STORY TAKEAWAY</div><div style={{fontSize:43,lineHeight:1.22,fontWeight:820,marginTop:12}}>{manifest.answer}</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,marginTop:22}}>{scene.visual.learningPointIds.map((id,i)=>{const p=getP(manifest,id);return <div key={id} style={{padding:"26px 24px",borderRadius:26,background:"rgba(255,255,255,.94)",border:`1px solid ${COLORS.line}`,boxShadow:`0 12px 34px ${COLORS.shadow}`,textAlign:"center",opacity:interpolate(f,[i*10,i*10+12],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})}}><div style={{fontSize:30,fontWeight:850}}>{p?.phrase}</div><div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:22,color:COLORS.muted,marginTop:10}}>{p?.meaningJa}</div></div>;})}</div></div>;
  }

  const mainOpacity=scene.role==="retrieval"&&ph==="listen"?.35:1;
  return <div style={{...base,width:"100%",height:"100%",position:"relative",overflow:"hidden",opacity:fadeOut}}><Backdrop frame={f}/><TopRail manifest={manifest} scene={scene} resolved={resolved} frame={f}/><div style={{...mainArea,opacity:mainOpacity}}>{visual}</div><div style={subtitleArea}><BilingualCaption manifest={manifest} scene={scene} resolved={resolved} globalFrame={g} phaseName={ph}/></div></div>;
};
