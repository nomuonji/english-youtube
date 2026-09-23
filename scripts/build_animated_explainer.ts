import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname} from "node:path";
import type {EpisodeVideoProps} from "../src/composition/EpisodeVideo";
import type {ExplainerConfig, StageIcon} from "../src/animated-explainer/types";
import {validateExplainerConfig} from "../src/animated-explainer/types";

type CueRef = {utteranceId: string; chunkIndex: number};
type Storyboard = {
  id: string;
  title: string;
  question: string;
  eyebrow: string;
  topic: string;
  flowDirection: ExplainerConfig["flowDirection"];
  sourceNote?: string;
  stages: Array<{id: string; label: string; icon: StageIcon; at: CueRef; startAtZero?: boolean}>;
  questionAt: CueRef;
  captions: CueRef[];
  tailFrames: number;
};

const [measuredPropsPath, storyboardPath, outputPath] = process.argv.slice(2);
if (!measuredPropsPath || !storyboardPath || !outputPath) {
  throw new Error("Usage: tsx scripts/build_animated_explainer.ts <measured-props.json> <storyboard.json> <output-props.json>");
}

const measured = JSON.parse(readFileSync(measuredPropsPath, "utf8")) as EpisodeVideoProps;
const storyboard = JSON.parse(readFileSync(storyboardPath, "utf8")) as Storyboard;
const allCues = measured.resolved.scenes.flatMap(scene => scene.cues);
const cueFor = ({utteranceId, chunkIndex}: CueRef) => {
  const cue = allCues.find(item => item.utteranceId === utteranceId && item.chunkIndices.includes(chunkIndex));
  if (!cue) throw new Error(`Measured cue missing: ${utteranceId}:${chunkIndex}`);
  return cue;
};
const captionCues = storyboard.captions.map(ref => cueFor(ref));
const lastEnd = Math.max(...captionCues.map(cue => cue.endFrame));
if (!Number.isInteger(storyboard.tailFrames) || storyboard.tailFrames < 0) throw new Error("Invalid tailFrames");

const config: ExplainerConfig = {
  version: "1.0.0",
  id: storyboard.id,
  fps: measured.resolved.fps,
  durationFrames: lastEnd + storyboard.tailFrames,
  title: storyboard.title,
  question: storyboard.question,
  questionFrame: cueFor(storyboard.questionAt).startFrame,
  eyebrow: storyboard.eyebrow,
  topic: storyboard.topic,
  flowDirection: storyboard.flowDirection,
  sourceNote: storyboard.sourceNote,
  sourceManifestHash: measured.resolved.manifestHash,
  stages: storyboard.stages.map(stage => ({
    id: stage.id,
    label: stage.label,
    icon: stage.icon,
    revealFrame: stage.startAtZero ? 0 : cueFor(stage.at).startFrame,
  })) as ExplainerConfig["stages"],
  cues: captionCues.map(cue => ({startFrame: cue.startFrame, endFrame: cue.endFrame, text: cue.text})),
};
validateExplainerConfig(config);
mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(outputPath, JSON.stringify({config}, null, 2) + "\n");
console.log(JSON.stringify({outputPath, episodeId: measured.manifest.episodeId, manifestHash: config.sourceManifestHash, frames: config.durationFrames, cueCount: config.cues.length}));
