import React from "react";
import {Html5Video,interpolate,staticFile,useCurrentFrame} from "remotion";

export type BrollAsset={sceneId:string;beat:"hook"|"setup"|"mechanism"|"complication"|"answer";path:string;sourcePage:string;license:string;artist:string;credit:string;query:string};

export const BrollLayer:React.FC<{asset:BrollAsset}>=({asset})=>{
  const frame=useCurrentFrame();
  const scale=interpolate(frame,[0,240],[1.085,1.025],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const x=interpolate(frame,[0,240],[-1.4,1.4],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{position:"absolute",inset:0,overflow:"hidden",background:"#102A36"}}>
    <Html5Video src={staticFile(asset.path)} muted loop style={{width:"100%",height:"100%",objectFit:"cover",filter:"saturate(.9) contrast(1.08) brightness(.74)",transform:`translateX(${x}%) scale(${scale})`}}/>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(8,27,36,.12) 0%,rgba(8,27,36,.18) 58%,rgba(8,27,36,.42) 100%)"}}/>
  </div>;
};
