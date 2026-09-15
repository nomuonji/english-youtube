import React from "react";
import {OffthreadVideo,staticFile} from "remotion";

export type BrollAsset={sceneId:string;beat:"setup"|"mechanism"|"complication"|"answer";path:string;sourcePage:string;license:string;artist:string;credit:string;query:string};

export const BrollLayer:React.FC<{asset:BrollAsset}>=({asset})=> <div style={{position:"absolute",inset:0,overflow:"hidden",background:"#dce7e8"}}>
  <OffthreadVideo src={staticFile(asset.path)} muted loop style={{width:"100%",height:"100%",objectFit:"cover",filter:"saturate(.65) contrast(.9) brightness(.78)",transform:"scale(1.04)"}}/>
  <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(244,249,248,.78) 0%,rgba(244,249,248,.86) 54%,rgba(244,249,248,.97) 100%)"}}/>
</div>;
