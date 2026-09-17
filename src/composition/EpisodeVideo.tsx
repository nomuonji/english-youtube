import React from "react";
import {AbsoluteFill,Html5Audio,Sequence,staticFile} from "remotion";
import type {EpisodeManifest,ResolvedEpisode,StoryBeat} from "../contracts/types";
import {resolveExperienceVersion} from "../experience/versions";
import {DocumentarySceneRenderer} from "../scenes/DocumentarySceneRenderer";
import {NewsFirstSceneRenderer} from "../scenes/NewsFirstSceneRenderer";
import {SceneRenderer} from "../scenes/SceneRenderer";
import {ShotFirstVideoLayer} from "../scenes/ShotFirstVideoLayer";
import type {ShotAsset,ShotPlan} from "../shotplan/types";
import {EditorialImageLayer,type EditorialImageAsset} from "./EditorialImageLayer";
import {BrollLayer,type BrollAsset} from "./BrollLayer";

export type EpisodeVideoProps={manifest:EpisodeManifest;resolved:ResolvedEpisode;imageAssets?:EditorialImageAsset[];brollAssets?:BrollAsset[];shotPlan?:ShotPlan;shotAssets?:ShotAsset[]};
const brollForBeat=(assets:BrollAsset[],beat:StoryBeat|null):BrollAsset|undefined=>{
  if(!beat)return undefined;
  const exact=assets.find(item=>item.beat===beat);if(exact)return exact;
  if(beat==="mechanism")return assets.find(item=>item.beat==="setup")??assets.find(item=>item.beat==="complication")??assets[0];
  if(beat==="answer")return assets.find(item=>item.beat==="complication")??assets.find(item=>item.beat==="setup")??assets[0];
  return assets[0];
};

export const EpisodeVideo:React.FC<EpisodeVideoProps>=({manifest,resolved,imageAssets=[],brollAssets=[],shotPlan,shotAssets=[]})=>{
  const experienceVersion=resolveExperienceVersion(manifest);
  const newsFirstV3=experienceVersion==="news-first-v3.0";
  const documentaryV4=experienceVersion==="news-first-v4.0-candidate";
  const shotFirstV5=experienceVersion==="news-first-v5.0-candidate";
  if(shotFirstV5&&!shotPlan)throw new Error("news-first-v5.0-candidate requires shotPlan in render props");
  const modern=newsFirstV3||documentaryV4||shotFirstV5;
  return <AbsoluteFill style={{backgroundColor:modern?"#050A10":"#F4F1E8"}}>
    <Html5Audio src={staticFile("generated/bgm.wav")} volume={shotFirstV5?0.12:documentaryV4?0.12:newsFirstV3?0.14:0.105}/>
    {shotFirstV5&&shotPlan
      ?<ShotFirstVideoLayer manifest={manifest} resolved={resolved} shotPlan={shotPlan} shotAssets={shotAssets}/>
      :resolved.scenes.map(scene=>{
        const rs=resolved.scenes.find(i=>i.sceneId===scene.sceneId);
        const manifestScene=manifest.scenes.find(i=>i.id===scene.sceneId);
        if(!rs||!manifestScene)return null;
        const image=imageAssets.find(item=>item.sceneId===scene.sceneId);
        const broll=brollAssets.find(item=>item.sceneId===scene.sceneId)??(manifestScene.role==="story"?brollForBeat(brollAssets,manifestScene.beat):undefined);
        const hasMedia=Boolean(broll||image);
        return <Sequence key={scene.sceneId} from={rs.startFrame} durationInFrames={rs.durationFrames}>
          {broll?<BrollLayer asset={broll}/>:null}
          {image?<EditorialImageLayer asset={image} fullBleed={modern}/>:null}
          {documentaryV4
            ?<DocumentarySceneRenderer manifest={manifest} scene={manifestScene} resolved={rs} hasMedia={hasMedia}/>
            :newsFirstV3
              ?<NewsFirstSceneRenderer manifest={manifest} scene={manifestScene} resolved={rs} hasMedia={hasMedia}/>
              :<SceneRenderer manifest={manifest} scene={manifestScene} resolved={rs}/>} 
        </Sequence>;
      })}
    {resolved.scenes.flatMap(scene=>scene.audioEvents.map((event,index)=>{const clip=resolved.clips.find(item=>item.clipId===event.clipId);if(!clip)return null;const durationInFrames=Math.max(1,Math.ceil(clip.samples/clip.sampleRate*resolved.fps));return <Sequence key={`${scene.sceneId}-${event.clipId}-${index}`} from={event.startFrame} durationInFrames={durationInFrames}><Html5Audio src={staticFile(clip.path)}/></Sequence>;}))}
    {resolved.scenes.flatMap(scene=>{
      const manifestScene=manifest.scenes.find(s=>s.id===scene.sceneId);if(!manifestScene)return [];
      const events:React.ReactNode[]=[];
      if((scene.chapterCallFrames??0)>0)events.push(<Sequence key={`sfx-chapter-${scene.sceneId}`} from={scene.startFrame} durationInFrames={Math.min(scene.chapterCallFrames??90,90)}><Html5Audio src={staticFile("generated/sfx/chapter-whoosh.wav")} volume={shotFirstV5?0.17:documentaryV4?0.20:newsFirstV3?0.26:0.34}/></Sequence>);
      if(manifestScene.role==="hook")events.push(<Sequence key={`sfx-hook-${scene.sceneId}`} from={scene.startFrame+4} durationInFrames={30}><Html5Audio src={staticFile("generated/sfx/hook-impact.wav")} volume={shotFirstV5?0.22:documentaryV4?0.25:0.30}/></Sequence>);
      if(manifestScene.visual.type==="metric")events.push(<Sequence key={`sfx-metric-${scene.sceneId}`} from={scene.startFrame+12} durationInFrames={24}><Html5Audio src={staticFile("generated/sfx/metric-hit.wav")} volume={shotFirstV5?0.17:documentaryV4?0.20:0.24}/></Sequence>);
      if(manifestScene.role==="phrase")events.push(<Sequence key={`sfx-phrase-${scene.sceneId}`} from={scene.startFrame} durationInFrames={20}><Html5Audio src={staticFile("generated/sfx/phrase-ping.wav")} volume={shotFirstV5?0.16:documentaryV4?0.18:0.24}/></Sequence>);
      if(manifestScene.role==="retrieval")events.push(<Sequence key={`sfx-check-${scene.sceneId}`} from={scene.startFrame} durationInFrames={20}><Html5Audio src={staticFile("generated/sfx/check-cue.wav")} volume={0.20}/></Sequence>);
      return events;
    })}
  </AbsoluteFill>;
};
