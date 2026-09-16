import React from "react";
import {Img,interpolate,staticFile,useCurrentFrame} from "remotion";

export type EditorialImageAsset={sceneId:string;path:string;purpose:"hook"|"analogy"|"context"};

export const EditorialImageLayer:React.FC<{asset:EditorialImageAsset;fullBleed?:boolean}>=({asset,fullBleed=false})=>{
  const frame=useCurrentFrame();
  const opacity=interpolate(frame,[0,10],[0,fullBleed?.92:.68],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const scale=interpolate(frame,[0,240],[fullBleed?1.045:1.07,fullBleed?1.01:1.015],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const frameStyle:React.CSSProperties=fullBleed
    ?{position:"absolute",inset:0,overflow:"hidden",opacity,zIndex:0,background:"#050A10",pointerEvents:"none"}
    :{position:"absolute",left:72,right:72,top:132,height:620,borderRadius:34,overflow:"hidden",opacity,zIndex:0,background:"#102A36",pointerEvents:"none"};
  return <div style={frameStyle}>
    <Img src={staticFile(asset.path)} style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${scale})`,filter:fullBleed?"saturate(.92) contrast(1.08) brightness(.70)":"saturate(.92) contrast(1.04) brightness(.78)"}}/>
    <div style={{position:"absolute",inset:0,background:fullBleed?"linear-gradient(90deg,rgba(3,8,13,.74) 0%,rgba(3,8,13,.18) 56%,rgba(3,8,13,.42) 100%),linear-gradient(180deg,rgba(3,8,13,.08),rgba(3,8,13,.28))":"linear-gradient(180deg,rgba(8,27,36,.04),rgba(8,27,36,.22))"}}/>
  </div>;
};
