import React from "react";
import {Img,interpolate,staticFile,useCurrentFrame} from "remotion";

export type EditorialImageAsset={sceneId:string;path:string;purpose:"hook"|"analogy"|"context"};

export const EditorialImageLayer:React.FC<{asset:EditorialImageAsset}>=({asset})=>{
  const frame=useCurrentFrame();
  const opacity=interpolate(frame,[0,12],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const scale=interpolate(frame,[0,180],[1.025,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{position:"absolute",left:92,right:92,top:138,bottom:302,borderRadius:38,overflow:"hidden",boxShadow:"0 28px 90px rgba(11,37,49,.20)",opacity,zIndex:6,background:"#e9eeee"}}>
    <Img src={staticFile(asset.path)} style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${scale})`}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(8,28,38,.02),rgba(8,28,38,.10))"}}/>
  </div>;
};
