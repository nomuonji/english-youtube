import React from "react";
import {Composition} from "remotion";
import fixture from "../../fixtures/v2.1-demo.json";
import v3SpecRaw from "../../episodes/2026-09-15-ai-power-project/v3.json";
import type {EpisodeManifest} from "../contracts/types";
import {buildDemoResolved} from "../fixtures/buildDemoResolved";
import {EpisodeVideo,type EpisodeVideoProps} from "./EpisodeVideo";
import {TechExplainerV3,type TechExplainerV3Props,type V3Spec} from "../v3/TechExplainerV3";

const manifest=fixture as EpisodeManifest;
const resolved=buildDemoResolved(manifest);
const v3Spec=v3SpecRaw as V3Spec;
const v3Scenes=v3Spec.scenes.map((scene,index)=>({id:scene.id,startFrame:index*150,durationFrames:150,audioPath:`generated/v3/audio/${scene.id}.mp3`}));
const v3Default:TechExplainerV3Props={spec:v3Spec,timing:{fps:30,durationFrames:v3Scenes.length*150,scenes:v3Scenes},brollAssets:[]};

export const RemotionRoot:React.FC=()=> <>
  <Composition
    id="EpisodeVideo"
    component={EpisodeVideo}
    durationInFrames={resolved.durationFrames}
    fps={resolved.fps}
    width={resolved.width}
    height={resolved.height}
    defaultProps={{manifest,resolved}}
    calculateMetadata={({props})=>{const typed=props as EpisodeVideoProps;return {durationInFrames:typed.resolved.durationFrames,fps:typed.resolved.fps,width:typed.resolved.width,height:typed.resolved.height};}}
  />
  <Composition
    id="TechExplainerV3"
    component={TechExplainerV3}
    durationInFrames={v3Default.timing.durationFrames}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={v3Default}
    calculateMetadata={({props})=>{const typed=props as TechExplainerV3Props;return {durationInFrames:typed.timing.durationFrames,fps:30,width:1920,height:1080};}}
  />
</>;
