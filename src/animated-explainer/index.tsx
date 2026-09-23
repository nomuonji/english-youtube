import React from "react";
import {Composition, registerRoot} from "remotion";
import aiPowerConfig from "../../fixtures/animated-explainer/ai-power-opening.json";
import {ExplainerVideo, type ExplainerVideoProps} from "./ExplainerVideo";
import type {ExplainerConfig} from "./types";
import {validateExplainerConfig} from "./types";

const config = aiPowerConfig.config as ExplainerConfig;
validateExplainerConfig(config);

const Root: React.FC = () => <Composition
  id="AnimatedExplainer"
  component={ExplainerVideo}
  width={1920}
  height={1080}
  fps={config.fps}
  durationInFrames={config.durationFrames}
  defaultProps={{config}}
  calculateMetadata={({props}) => {
    const typed = props as ExplainerVideoProps;
    validateExplainerConfig(typed.config);
    return {fps: typed.config.fps, durationInFrames: typed.config.durationFrames, width: 1920, height: 1080};
  }}
/>;

registerRoot(Root);
