export type StageIcon = "server" | "grid" | "power" | "factory" | "process" | "package";

export type ExplainerStage = {
  id: string;
  label: string;
  icon: StageIcon;
  revealFrame: number;
};

export type ExplainerCue = {
  startFrame: number;
  endFrame: number;
  text: string;
};

export type ExplainerConfig = {
  version: "1.0.0";
  id: string;
  fps: number;
  durationFrames: number;
  title: string;
  question: string;
  questionFrame: number;
  eyebrow: string;
  topic: string;
  stages: [ExplainerStage, ExplainerStage, ExplainerStage];
  flowDirection: "left-to-right" | "right-to-left";
  cues: ExplainerCue[];
  audioSrc?: string;
  sourceNote?: string;
  sourceManifestHash?: string;
};

export const validateExplainerConfig = (config: ExplainerConfig): void => {
  if (config.version !== "1.0.0") throw new Error("Unsupported explainer config version");
  if (!config.id || !config.title || !config.question || !config.eyebrow) throw new Error("Missing explainer text");
  if (!Number.isInteger(config.fps) || config.fps < 1 || !Number.isInteger(config.durationFrames) || config.durationFrames < config.fps) throw new Error("Invalid timing");
  if (!Array.isArray(config.stages) || config.stages.length !== 3 || new Set(config.stages.map(stage => stage.id)).size !== 3) throw new Error("Exactly three unique stages are required");
  if (config.flowDirection !== "left-to-right" && config.flowDirection !== "right-to-left") throw new Error("Invalid flow direction");
  const icons: StageIcon[] = ["server", "grid", "power", "factory", "process", "package"];
  for (const stage of config.stages) {
    if (!stage.label || !icons.includes(stage.icon) || !Number.isInteger(stage.revealFrame) || stage.revealFrame < 0 || stage.revealFrame >= config.durationFrames) throw new Error(`Invalid stage ${stage.id}`);
  }
  if (!Number.isInteger(config.questionFrame) || config.questionFrame < 0 || config.questionFrame >= config.durationFrames) throw new Error("Invalid question timing");
  for (const cue of config.cues) {
    if (!cue.text || !Number.isInteger(cue.startFrame) || !Number.isInteger(cue.endFrame) || cue.startFrame < 0 || cue.endFrame <= cue.startFrame || cue.endFrame > config.durationFrames) throw new Error("Invalid caption cue");
  }
  if (config.cues.some((cue, index) => index > 0 && cue.startFrame < config.cues[index - 1].endFrame)) throw new Error("Caption cues overlap");
};
