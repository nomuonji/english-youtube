import React from "react";
import {Img,interpolate,staticFile,useCurrentFrame} from "remotion";

export type EditorialImageAsset={sceneId:string;path:string;purpose:"hook"|"analogy"|"context"};

export const EditorialImageLayer:React.FC<{asset:EditorialImageAsset}>=({asset})=>{
  const frame=useCurrentFrame();
  const opacity=interpolate(frame,[0,12],[0,.42],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const scale=interpolate(frame,[0,210],[1.045,1.01],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{position:"absolute",left:92,right:92,top:146,height:516,borderRadius:34,overflow:"hidden",opacity,zIndex:0,background:"#e9eeee",pointerEvents:"none"}}>
    <Img src={staticFile(asset.path)} style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${scale})`,filter:"saturate(.82) contrast(.92) brightness(.82)"}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(244,241,232,.22),rgba(244,241,232,.42))"}}/>
  </div>;
};
