import React from "react";
import {AbsoluteFill,Html5Audio,Sequence,staticFile} from "remotion";
import type {EpisodeManifest,ResolvedEpisode,StoryBeat} from "../contracts/types";
import {SceneRenderer} from "../scenes/SceneRenderer";
import {EditorialImageLayer,type EditorialImageAsset} from "./EditorialImageLayer";
import {BrollLayer,type BrollAsset} from "./BrollLayer";

export type EpisodeVideoProps={manifest:EpisodeManifest;resolved:ResolvedEpisode;imageAssets?:EditorialImageAsset[];brollAssets?:BrollAsset[]};
const brollForBeat=(assets:BrollAsset[],beat:StoryBeat|null):BrollAsset|undefined=>{
  if(!beat)return undefined;
  const exact=assets.find(item=>item.beat===beat);if(exact)return exact;
  if(beat==="mechanism")return assets.find(item=>item.beat==="setup")??assets.find(item=>item.beat==="complication")??assets[0];
  if(beat==="answer")return assets.find(item=>item.beat==="complication")??assets.find(item=>item.beat==="setup")??assets[0];
  return assets[0];
};

export const EpisodeVideo:React.FC<EpisodeVideoProps>=({manifest,resolved,imageAssets=[],brollAssets=[]})=><AbsoluteFill style={{backgroundColor:"#F4F1E8"}}>
  <Html5Audio src={staticFile("generated/bgm.wav")} volume={0.105}/>
  {resolved.scenes.map(scene=>{
    const rs=resolved.scenes.find(i=>i.sceneId===scene.sceneId);
    const manifestScene=manifest.scenes.find(i=>i.id===scene.sceneId);
    if(!rs||!manifestScene)return null;
    const image=imageAssets.find(item=>item.sceneId===scene.sceneId);
    const broll=brollAssets.find(item=>item.sceneId===scene.sceneId)??(manifestScene.role==="story"?brollForBeat(brollAssets,manifestScene.beat):undefined);
    return <Sequence key={scene.sceneId} from={rs.startFrame} durationInFrames={rs.durationFrames}>{broll?<BrollLayer asset={broll}/>:null}{image?<EditorialImageLayer asset={image}/>:null}<SceneRenderer manifest={manifest} scene={manifestScene} resolved={rs}/></Sequence>;
  })}
  {resolved.scenes.flatMap(scene=>scene.audioEvents.map((event,index)=>{const clip=resolved.clips.find(item=>item.clipId===event.clipId);if(!clip)return null;const durationInFrames=Math.max(1,Math.ceil(clip.samples/clip.sampleRate*resolved.fps));return <Sequence key={`${scene.sceneId}-${event.clipId}-${index}`} from={event.startFrame} durationInFrames={durationInFrames}><Html5Audio src={staticFile(clip.path)}/></Sequence>;}))}
  {resolved.scenes.flatMap(scene=>{
    const manifestScene=manifest.scenes.find(s=>s.id===scene.sceneId);if(!manifestScene)return [];
    const events:React.ReactNode[]=[];
    if((scene.chapterCallFrames??0)>0)events.push(<Sequence key={`sfx-chapter-${scene.sceneId}`} from={scene.startFrame} durationInFrames={Math.min(scene.chapterCallFrames??90,90)}><Html5Audio src={staticFile("generated/sfx/chapter-whoosh.wav")} volume={0.34}/></Sequence>);
    if(manifestScene.role==="hook")events.push(<Sequence key={`sfx-hook-${scene.sceneId}`} from={scene.startFrame+4} durationInFrames={30}><Html5Audio src={staticFile("generated/sfx/hook-impact.wav")} volume={0.30}/></Sequence>);
    if(manifestScene.visual.type==="metric")events.push(<Sequence key={`sfx-metric-${scene.sceneId}`} from={scene.startFrame+12} durationInFrames={24}><Html5Audio src={staticFile("generated/sfx/metric-hit.wav")} volume={0.24}/></Sequence>);
    if(manifestScene.role==="phrase")events.push(<Sequence key={`sfx-phrase-${scene.sceneId}`} from={scene.startFrame} durationInFrames={20}><Html5Audio src={staticFile("generated/sfx/phrase-ping.wav")} volume={0.24}/></Sequence>);
    if(manifestScene.role==="retrieval")events.push(<Sequence key={`sfx-check-${scene.sceneId}`} from={scene.startFrame} durationInFrames={20}><Html5Audio src={staticFile("generated/sfx/check-cue.wav")} volume={0.20}/></Sequence>);
    return events;
  })}
</AbsoluteFill>;
