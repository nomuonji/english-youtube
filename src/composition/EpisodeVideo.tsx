import React from "react";
import {AbsoluteFill,Html5Audio,Sequence,staticFile} from "remotion";
import type {EpisodeManifest,ResolvedEpisode} from "../contracts/types";
import {SceneRenderer} from "../scenes/SceneRenderer";

export type EpisodeVideoProps={manifest:EpisodeManifest;resolved:ResolvedEpisode};
export const EpisodeVideo:React.FC<EpisodeVideoProps>=({manifest,resolved})=><AbsoluteFill>
  {resolved.scenes.map(scene=>{const rs=resolved.scenes.find(i=>i.sceneId===scene.sceneId);const manifestScene=manifest.scenes.find(i=>i.id===scene.sceneId);if(!rs||!manifestScene)return null;return <Sequence key={scene.sceneId} from={rs.startFrame} durationInFrames={rs.durationFrames}><SceneRenderer manifest={manifest} scene={manifestScene} resolved={rs}/></Sequence>;})}
  {resolved.scenes.flatMap(scene=>scene.audioEvents.map((event,index)=>{const clip=resolved.clips.find(item=>item.clipId===event.clipId);if(!clip)return null;const durationInFrames=Math.max(1,Math.ceil(clip.samples/clip.sampleRate*resolved.fps));return <Sequence key={`${scene.sceneId}-${event.clipId}-${index}`} from={event.startFrame} durationInFrames={durationInFrames}><Html5Audio src={staticFile(clip.path)}/></Sequence>;}))}
</AbsoluteFill>;
