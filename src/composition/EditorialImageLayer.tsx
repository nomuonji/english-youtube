import React from "react";
import {Img,interpolate,staticFile,useCurrentFrame} from "remotion";

export type EditorialImageAsset={sceneId:string;path:string;purpose:"hook"|"analogy"|"context"};

export const EditorialImageLayer:React.FC<{asset:EditorialImageAsset}>=({asset})=>{
  const frame=useCurrentFrame();
  const opacity=interpolate(frame,[0,10],[0,.68],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const scale=interpolate(frame,[0,240],[1.07,1.015],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{position:"absolute",left:72,right:72,top:132,height:620,borderRadius:34,overflow:"hidden",opacity,zIndex:0,background:"#102A36",pointerEvents:"none"}}>
    <Img src={staticFile(asset.path)} style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${scale})`,filter:"saturate(.92) contrast(1.04) brightness(.78)"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(8,27,36,.04),rgba(8,27,36,.22))"}}/>
  </div>;
};
