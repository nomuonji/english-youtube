import React from "react";
import {Composition, registerRoot} from "remotion";
import lessonRaw from "../../fixtures/animation-english/run-into-a-snag.json";
import {LessonVideo} from "./LessonVideo";
import {KineticLessonVideo} from "./KineticLessonVideo";
import {ArcadeRevealVideo, arcadePreviewFrames} from "./ArcadeRevealVideo";
import type {AnimationLesson, AnimationLessonProps} from "./types";
import {validateLesson, validateResolvedLesson} from "./types";

const lesson = lessonRaw as AnimationLesson;
validateLesson(lesson);
let cursor = 0;
const scenes = lesson.scenes.map(scene => {
  const result = {...scene, startFrame: cursor, durationFrames: 120 + scene.holdFrames, speechFrames: 90};
  cursor += result.durationFrames;
  return result;
});
const defaults: AnimationLessonProps = {lesson, fps: 30, durationFrames: cursor, scenes};
validateResolvedLesson(defaults);

const metadata = ({props}: {props: AnimationLessonProps}) => {
  validateResolvedLesson(props);
  return {fps: props.fps, durationInFrames: props.durationFrames, width: 1920, height: 1080};
};

const arcadeFrames = arcadePreviewFrames(defaults);
const arcadeMetadata = ({props}: {props: AnimationLessonProps & {portrait?: boolean}}) => {
  validateResolvedLesson(props);
  return {fps: props.fps, durationInFrames: arcadePreviewFrames(props), width: props.portrait ? 1080 : 1920, height: props.portrait ? 1920 : 1080};
};

const Root: React.FC = () => <><Composition id="AnimationEnglishLesson" component={LessonVideo} fps={30} width={1920} height={1080} durationInFrames={defaults.durationFrames} defaultProps={defaults} calculateMetadata={({props}) => {
  const typed = props as AnimationLessonProps;
  return metadata({props: typed});
}}/><Composition id="AnimationEnglishKinetic" component={KineticLessonVideo} fps={30} width={1920} height={1080} durationInFrames={defaults.durationFrames} defaultProps={defaults} calculateMetadata={({props}) => metadata({props: props as AnimationLessonProps})}/><Composition id="AnimationEnglishArcadeWide" component={ArcadeRevealVideo} fps={30} width={1920} height={1080} durationInFrames={arcadeFrames} defaultProps={defaults} calculateMetadata={({props}) => arcadeMetadata({props: props as AnimationLessonProps})}/><Composition id="AnimationEnglishArcadeShort" component={ArcadeRevealVideo} fps={30} width={1080} height={1920} durationInFrames={arcadeFrames} defaultProps={{...defaults, portrait: true}} calculateMetadata={({props}) => arcadeMetadata({props: props as AnimationLessonProps & {portrait?: boolean}})}/></>;

registerRoot(Root);
