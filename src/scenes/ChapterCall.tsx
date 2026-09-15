import React from "react";
import {interpolate,spring,useCurrentFrame,useVideoConfig} from "remotion";
import type {ChapterSpec} from "../chapters";
import {COLORS} from "./styles";

export const ChapterCall:React.FC<{chapter:ChapterSpec}>=({chapter})=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const intro=spring({frame,fps,config:{damping:18,stiffness:120,mass:.8}});
  const line=interpolate(frame,[4,34],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const fade=interpolate(frame,[0,8,74,89],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg, ${COLORS.navy} 0%, #123947 56%, #0b2934 100%)`,color:COLORS.white,opacity:fade,overflow:"hidden"}}>
    <div style={{position:"absolute",width:850,height:850,borderRadius:"50%",background:"rgba(48,201,183,.12)",filter:"blur(40px)",transform:`translate(520px,-240px) scale(${.88+intro*.12})`}}/>
    <div style={{position:"relative",width:1320,textAlign:"center",transform:`translateY(${(1-intro)*28}px)`,opacity:intro}}>
      <div style={{fontSize:24,fontWeight:900,letterSpacing:".16em",color:"#8BE0D5"}}>CHAPTER {chapter.index}</div>
      <div style={{fontSize:104,lineHeight:1.02,fontWeight:930,letterSpacing:"-.045em",marginTop:22}}>{chapter.labelEn}</div>
      <div style={{width:`${Math.round(260*line)}px`,height:6,borderRadius:999,background:"#56d6c5",margin:"34px auto 28px"}}/>
      <div style={{fontFamily:"'Noto Sans JP','Noto Sans CJK JP',sans-serif",fontSize:48,fontWeight:720,letterSpacing:".01em",color:"rgba(255,255,255,.88)"}}>{chapter.labelJa}</div>
    </div>
  </div>;
};
