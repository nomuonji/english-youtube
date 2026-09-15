import React from "react";
import {AbsoluteFill,Sequence} from "remotion";
import type {EpisodeManifest,ResolvedEpisode} from "../contracts/types";
import {SceneRenderer} from "../scenes/SceneRenderer";

export type EpisodeVideoProps={manifest:EpisodeManifest;resolved:ResolvedEpisode};
export const EpisodeVideo:React.FC<EpisodeVideoProps>=({manifest,resolved})=><AbsoluteFill>{manifest.scenes.map(scene=>{const rs=resolved.scenes.find(i=>i.sceneId===scene.id);if(!rs)return null;return <Sequence key={scene.id} from={rs.startFrame} durationInFrames={rs.durationFrames}><SceneRenderer manifest={manifest} scene={scene} resolved={rs}/></Sequence>;})}</AbsoluteFill>;
