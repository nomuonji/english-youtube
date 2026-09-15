import React from "react";
import {Composition} from "remotion";
import fixture from "../../fixtures/v2.1-demo.json";
import type {EpisodeManifest} from "../contracts/types";
import {buildDemoResolved} from "../fixtures/buildDemoResolved";
import {EpisodeVideo,type EpisodeVideoProps} from "./EpisodeVideo";

const manifest=fixture as EpisodeManifest;
const resolved=buildDemoResolved(manifest);
export const RemotionRoot:React.FC=()=> <Composition<EpisodeVideoProps>
  id="EpisodeVideo"
  component={EpisodeVideo}
  durationInFrames={resolved.durationFrames}
  fps={resolved.fps}
  width={resolved.width}
  height={resolved.height}
  defaultProps={{manifest,resolved}}
  calculateMetadata={({props})=>({durationInFrames:props.resolved.durationFrames,fps:props.resolved.fps,width:props.resolved.width,height:props.resolved.height})}
/>;
