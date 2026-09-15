import React from "react";
import {interpolate,spring,useCurrentFrame,useVideoConfig} from "remotion";
import type {Cue,EpisodeManifest,LearningPoint,ResolvedScene,Scene,Utterance} from "../contracts/types";
import {base,COLORS,headerStyle,mainArea,subtitleArea} from "./styles";
import {ChapterCall} from "./ChapterCall";
import {chapterForBeat} from "../chapters";
import {visualJa} from "./visualJa";

type Props={manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene};

const getU=(m:EpisodeManifest,id:string):Utterance|undefined=>m.utterances.find(i=>i.id===id);
const getP=(m:EpisodeManifest,id:string):LearningPoint|undefined=>m.learningPoints.find(i=>i.id===id);
const phaseAt=(g:number,r:ResolvedScene)=>r.phases.find(p=>p.startFrame<=g&&g<p.endFrame);
const cueAt=(g:number,r:ResolvedScene)=>r.cues.find(c=>c.startFrame<=g&&g<c.endFrame);
const captionCueAt=(g:number,r:ResolvedScene)=>cueAt(g,r)??[...r.cues].filter(c=>c.startFrame<=g).sort((a,b)=>b.startFrame-a.startFrame)[0];
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
const sceneLabel=(scene:Scene)=>scene.role==="story"?(scene.beat==="setup"?"WHAT CHANGED":scene.beat==="mechanism"?"HOW IT WORKS":scene.beat==="complication"?"THE CATCH":"WHAT IT MEANS"):scene.role==="retrieval"?"LISTENING CHECK":scene.role==="phrase"?"USEFUL ENGLISH":scene.role==="recap"?"TAKEAWAYS":"THE QUESTION";
const pointForCue=(m:EpisodeManifest,cue:Cue|undefined):LearningPoint|undefined=>{
  if(!cue)return undefined;
  const text=cue.text.toLowerCase();
  return m.learningPoints.find(p=>text.includes(p.phrase.toLowerCase()))??m.learningPoints.find(p=>p.sourceUtteranceId===cue.utteranceId);
};
const highlightPhrase=(text:string,phrase?:string)=>{
  if(!phrase)return <>{text}</>;
  const i=text.toLowerCase().indexOf(phrase.toLowerCase());
  if(i<0)return <>{text}</>;
  return <>{text.slice(0,i)}<span style={{color:COLORS.navy,fontWeight:900,background:COLORS.accentSoft,borderBottom:`6px solid ${COLORS.accent}`,borderRadius:8,padding:"0 .08em",boxDecorationBreak:"clone",WebkitBoxDecorationBreak:"clone"}}>{text.slice(i,i+phrase.length)}</span>{text.slice(i+phrase.length)}</>;
};

const Backdrop=({frame}:{frame:number})=>{
  const x=42+Math.sin(frame/95)*5;
  const y=34+Math.cos(frame/110)*4;
  return <>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at ${x}% ${y}%, rgba(0,139,139,.08), transparent 34%), rgba(244,241,232,.82)`}}/>
    <div style={{position:"absolute",inset:0,opacity:.08,backgroundImage:"linear-gradient(rgba(16,42,54,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,42,54,.08) 1px, transparent 1px)",backgroundSize:"72px 72px"}}/>
  </>;
};

const chapterFor=(scene:Scene):{step:string;label:string;labelJa:string}=>{
  if(scene.role==="story"){const c=chapterForBeat(scene.beat);if(c)return {step:`${c.index} / 4`,label:c.labelEn,labelJa:c.labelJa};}
  if(scene.role==="hook")return {step:"START",label:"THE QUESTION",labelJa:"今日の問い"};
  if(scene.role==="phrase")return {step:"PAUSE",label:"KEY PHRASE",labelJa:"重要表現"};
  if(scene.role==="retrieval")return {step:"PAUSE",label:"LISTENING CHECK",labelJa:"リスニング確認"};
  if(scene.role==="recap")return {step:"END",label:"TAKEAWAYS",labelJa:"まとめ"};
  return {step:"",label:sceneLabel(scene),labelJa:""};
};
const cornerFor=(scene:Scene)=>scene.role==="story"?{en:"STORY",ja:"解説"}:scene.role==="phrase"?{en:"KEY PHRASE",ja:"重要表現"}:scene.role==="retrieval"?{en:"CHECK",ja:"確認"}:scene.role==="recap"?{en:"RECAP",ja:"まとめ"}:{en:"HOOK",ja:"導入"};
const topicFor=(scene:Scene)=>scene.visual.type==="card"?scene.visual.headline:scene.visual.type==="metric"?scene.visual.label:scene.visual.type==="chain"?"Cause and effect":scene.visual.type==="compare"?`${scene.visual.leftTitle} vs ${scene.visual.rightTitle}`:scene.visual.type==="timeline"?"How the story develops":scene.visual.type==="phrase"?"Use it in context":scene.visual.type==="retrieval"?"Listen and check":"Three phrases to keep";

const TopRail=({manifest,scene,resolved,frame}:{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;frame:number})=>{
  const index=Math.max(0,manifest.scenes.findIndex(s=>s.id===scene.id));
  const whole=clamp((index+frame/Math.max(1,resolved.durationFrames-1))/Math.max(1,manifest.scenes.length));
  const chapter=chapterFor(scene);const corner=cornerFor(scene);const topic=topicFor(scene);
  return <>
    <div style={{position:"absolute",left:0,top:0,width:"100%",height:6,background:"rgba(16,42,54,.08)"}}><div style={{height:"100%",width:`${whole*100}%`,background:COLORS.accent}}/></div>
    <div style={{...headerStyle}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <span style={{fontSize:18,fontWeight:900,color:COLORS.accent}}>{chapter.step}</span>
        <div><div style={{fontSize:24,fontWeight:900,color:COLORS.text}}>{chapter.label}</div><div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:16,fontWeight:650,color:COLORS.muted,marginTop:1}}>{chapter.labelJa}</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16,maxWidth:820}}>
        <div style={{padding:"8px 13px",borderRadius:999,background:COLORS.navy,color:COLORS.white,textAlign:"center",minWidth:116}}><div style={{fontSize:15,fontWeight:900,letterSpacing:".08em"}}>{corner.en}</div><div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:13,opacity:.8}}>{corner.ja}</div></div>
        <div style={{fontSize:22,fontWeight:760,color:COLORS.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{topic}</div>
      </div>
    </div>
  </>;
};

const BilingualCaption=({manifest,scene,resolved,globalFrame,phaseName}:{manifest:EpisodeManifest;scene:Scene;resolved:ResolvedScene;globalFrame:number;phaseName:string})=>{
  const hidden=scene.role==="retrieval"&&phaseName!=="reveal"&&phaseName!=="answer";
  const cue=hidden?undefined:captionCueAt(globalFrame,resolved);
  const point=pointForCue(manifest,cue);
  const phrase=point&&cue?.text.toLowerCase().includes(point.phrase.toLowerCase())?point.phrase:undefined;
  return <div style={{width:"100%",height:224,border:`1px solid ${COLORS.line}`,borderRadius:28,background:"rgba(255,255,255,.965)",boxShadow:`0 16px 44px ${COLORS.shadow}`,padding:"24px 52px",display:"flex",flexDirection:"column",justifyContent:"center",gap:10,overflow:"hidden"}}>
    {phrase?<div style={{fontSize:15,fontWeight:950,letterSpacing:".12em",color:COLORS.accent}}>KEY PHRASE · ここに注目</div>:null}
    <div style={{fontSize:48,lineHeight:1.22,fontWeight:700,letterSpacing:"-.012em",minHeight:59,opacity:cue?1:.16}}>{cue?highlightPhrase(cue.text,phrase):" "}</div>
    <div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:29,lineHeight:1.35,color:COLORS.muted,fontWeight:560,minHeight:39,opacity:cue?1:.14}}>{cue?.translationJa??" "}</div>
  </div>;
};
const BilingualVisualLabel=({text,large=false}:{text:string;large?:boolean})=>{const ja=visualJa(text);return <div style={{textAlign:"center"}}><div style={{fontSize:large?42:28,fontWeight:820,lineHeight:1.15}}>{text}</div>{ja?<div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:large?23:18,color:COLORS.muted,fontWeight:650,marginTop:7}}>{ja}</div>:null}</div>;};

const focusStyle=(active:boolean,visible=true):React.CSSProperties=>({
  opacity:visible?(active?1:.44):0,
  transform:active?"scale(1.025)":"scale(1)",
  borderColor:active?COLORS.accent:COLORS.line,
  boxShadow:active?"0 14px 36px rgba(0,139,139,.13)":"none",
});

export const SceneRenderer:React.FC<Props>=({manifest,scene,resolved})=>{
  const f=useCurrentFrame();
  const {fps}=useVideoConfig();
  const g=resolved.startFrame+f;
  const ph=phaseAt(g,resolved)?.name??"normal";
  const cue=cueAt(g,resolved);
  const intro=spring({frame:f,fps,config:{damping:18,stiffness:115,mass:.9}});
  const fadeOut=interpolate(f,[Math.max(0,resolved.durationFrames-10),Math.max(1,resolved.durationFrames-1)],[1,.94],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  let visual:React.ReactNode=null;
  const activeChapter=scene.role==="story"?chapterForBeat(scene.beat):undefined;
  if(activeChapter&&(resolved.chapterCallFrames??0)>0&&f<(resolved.chapterCallFrames??0))return <ChapterCall chapter={activeChapter}/>;

  if(scene.visual.type==="card"){
    const v=scene.visual;
    const isHook=scene.role==="hook";
    const headline=/news peg/i.test(v.headline)?"Why this suddenly matters":v.headline;
    visual=<div style={{width:1500,maxWidth:"88%",padding:isHook?"54px 72px":"48px 66px",borderRadius:38,background:COLORS.panel,border:`1px solid ${COLORS.line}`,boxShadow:`0 22px 62px ${COLORS.shadow}`,textAlign:"center",transform:`scale(${.96+intro*.04})`}}>
      <div style={{fontSize:18,fontWeight:900,letterSpacing:".13em",color:COLORS.accent,marginBottom:20}}>{isHook?"THE QUESTION":"WHY IT MATTERS"}</div>
      <div style={{fontSize:isHook?80:68,lineHeight:1.13,fontWeight:850,letterSpacing:"-.03em"}}>{headline}</div>
      {v.body?<div style={{fontSize:36,lineHeight:1.36,marginTop:26,color:COLORS.muted,fontWeight:520}}>{v.body}</div>:null}
    </div>;
  }

  if(scene.visual.type==="metric"){
    const v=scene.visual;
    const raw=v.value.match(/^([~]?)(-?\d+(?:\.\d+)?)$/);
    const p=interpolate(f,[5,40],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
    const value=raw?`${raw[1]??""}${(Number(raw[2])*p).toFixed((raw[2].split(".")[1]??"").length)}`:v.value;
    visual=<div style={{width:1320,textAlign:"center",padding:"48px 70px",borderRadius:42,background:COLORS.panel,border:`1px solid ${COLORS.line}`,boxShadow:`0 22px 62px ${COLORS.shadow}`}}>
      <div style={{fontSize:150,fontWeight:900,lineHeight:1,color:COLORS.accent,letterSpacing:"-.055em"}}>{value}<span style={{fontSize:60,marginLeft:18,color:COLORS.text}}>{v.unit}</span></div>
      <div style={{marginTop:28}}><BilingualVisualLabel text={v.label} large/></div>
      <div style={{fontSize:28,color:COLORS.muted,marginTop:12}}>{v.qualifier}</div>
    </div>;
  }

  if(scene.visual.type==="chain"){
    const v=scene.visual;
    const current=currentReveal(g,resolved,v.nodes.map(n=>n.revealAtUtteranceId));
    visual=<div style={{width:1500,display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>{v.nodes.map((n,i)=>{
      const visible=revealed(g,resolved,n.revealAtUtteranceId);
      const active=current===n.revealAtUtteranceId;
      return <React.Fragment key={`${n.label}-${i}`}>
        <div style={{minWidth:220,maxWidth:330,padding:"30px 28px",borderRadius:28,border:"3px solid",background:COLORS.white,fontSize:30,lineHeight:1.2,textAlign:"center",fontWeight:active?820:650,transition:"none",...focusStyle(active,visible)}}><BilingualVisualLabel text={n.label}/></div>
        {i<v.nodes.length-1?<div style={{fontSize:42,color:visible?COLORS.accent:COLORS.line}}>→</div>:null}
      </React.Fragment>;
    })}</div>;
  }

  if(scene.visual.type==="compare"){
    const v=scene.visual;
    const current=currentReveal(g,resolved,v.rows.map(r=>r.revealAtUtteranceId));
    visual=<div style={{width:1450,borderRadius:34,overflow:"hidden",border:`1px solid ${COLORS.line}`,background:COLORS.panel,boxShadow:`0 20px 58px ${COLORS.shadow}`}}>
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr 1fr",padding:"22px 30px",background:COLORS.navy,color:COLORS.white,fontSize:28,fontWeight:820}}><div/><BilingualVisualLabel text={v.leftTitle}/><BilingualVisualLabel text={v.rightTitle}/></div>
      {v.rows.map((r,i)=>{const visible=revealed(g,resolved,r.revealAtUtteranceId),active=current===r.revealAtUtteranceId;return <div key={`${r.aspect}-${i}`} style={{display:"grid",gridTemplateColumns:"280px 1fr 1fr",padding:"22px 30px",fontSize:28,borderTop:`1px solid ${COLORS.line}`,background:active?COLORS.accentSoft:COLORS.white,...focusStyle(active,visible)}}><div style={{fontWeight:820}}><BilingualVisualLabel text={r.aspect}/></div><BilingualVisualLabel text={r.left}/><BilingualVisualLabel text={r.right}/></div>;})}
    </div>;
  }

  if(scene.visual.type==="timeline"){
    const v=scene.visual;
    const current=currentReveal(g,resolved,v.events.map(e=>e.revealAtUtteranceId));
    visual=<div style={{width:1470,display:"flex",alignItems:"stretch",gap:20}}>{v.events.map((e,i)=>{const visible=revealed(g,resolved,e.revealAtUtteranceId),active=current===e.revealAtUtteranceId;return <div key={`${e.dateLabel}-${i}`} style={{flex:1,minHeight:220,padding:"30px 26px",borderRadius:28,border:"3px solid",background:COLORS.white,...focusStyle(active,visible)}}><div style={{fontSize:22,fontWeight:900,color:COLORS.accent,marginBottom:18}}>{e.dateLabel}</div><div style={{fontSize:30,lineHeight:1.28,fontWeight:active?820:650}}><BilingualVisualLabel text={e.label}/></div></div>;})}</div>;
  }

  if(scene.visual.type==="phrase"){
    const p=getP(manifest,scene.visual.learningPointId);
    visual=p?<div style={{width:1260,textAlign:"center",padding:"56px 70px",borderRadius:40,background:COLORS.navy,color:COLORS.white,boxShadow:"0 24px 68px rgba(11,37,49,.22)"}}>
      <div style={{fontSize:20,fontWeight:900,letterSpacing:".12em",color:"#8BE0D5"}}>USEFUL ENGLISH</div>
      <div style={{fontSize:88,fontWeight:900,marginTop:20,letterSpacing:"-.035em"}}>{p.phrase}</div>
      <div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:40,marginTop:20,color:"rgba(255,255,255,.84)"}}>{p.meaningJa}</div>
    </div>:null;
  }

  if(scene.visual.type==="retrieval"){
    const v=scene.visual;
    const showAnswer=ph==="reveal"||ph==="answer";
    const think=ph==="think";
    const phase=phaseAt(g,resolved);
    const remain=phase?Math.max(0,Math.ceil((phase.endFrame-g)/fps)):0;
    visual=<div style={{width:1380,textAlign:"center",padding:"42px 60px",borderRadius:38,background:COLORS.panel,border:`1px solid ${COLORS.line}`,boxShadow:`0 22px 62px ${COLORS.shadow}`}}>
      <div style={{fontSize:20,fontWeight:900,letterSpacing:".12em",color:COLORS.accent}}>{ph==="listen"?"LISTEN — NO SUBTITLES":think?"WHAT DID IT MEAN?":showAnswer?"CHECK":"LISTENING CHECK"}</div>
      <div style={{fontSize:54,lineHeight:1.2,fontWeight:840,marginTop:20}}>{v.question}</div>
      {think?<div style={{fontSize:74,fontWeight:900,color:COLORS.accent2,marginTop:24}}>{remain}</div>:null}
      {!think&&ph!=="listen"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginTop:34}}>{v.options.map((o,i)=><div key={o} style={{padding:"24px 28px",borderRadius:24,border:`3px solid ${showAnswer&&i===v.correctIndex?COLORS.accent:COLORS.line}`,background:showAnswer&&i===v.correctIndex?COLORS.accentSoft:COLORS.white,fontSize:29,fontWeight:showAnswer&&i===v.correctIndex?820:620}}>{o}</div>)}</div>:null}
      {showAnswer?<div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:29,color:COLORS.muted,marginTop:26}}>{v.answerJa}</div>:null}
    </div>;
  }

  if(scene.visual.type==="recap"){
    visual=<div style={{width:1400,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>{scene.visual.learningPointIds.map((id,i)=>{const p=getP(manifest,id);return <div key={id} style={{padding:"38px 30px",borderRadius:30,background:COLORS.white,border:`1px solid ${COLORS.line}`,boxShadow:`0 16px 44px ${COLORS.shadow}`,textAlign:"center",opacity:interpolate(f,[i*12,i*12+14],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})}}><div style={{fontSize:35,fontWeight:850}}>{p?.phrase}</div><div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:25,color:COLORS.muted,marginTop:15}}>{p?.meaningJa}</div></div>;})}</div>;
  }

  const mainOpacity=scene.role==="retrieval"&&ph==="listen"?.35:1;
  return <div style={{...base,width:"100%",height:"100%",position:"relative",overflow:"hidden",opacity:fadeOut}}>
    <Backdrop frame={f}/>
    <TopRail manifest={manifest} scene={scene} resolved={resolved} frame={f}/>
    <div style={{...mainArea,opacity:mainOpacity}}>{visual}</div>
    <div style={subtitleArea}><BilingualCaption manifest={manifest} scene={scene} resolved={resolved} globalFrame={g} phaseName={ph}/></div>
  </div>;
};
