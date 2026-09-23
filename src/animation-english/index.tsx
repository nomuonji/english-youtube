import React from "react";
import {Composition, registerRoot} from "remotion";
import lessonRaw from "../../fixtures/animation-english/run-into-a-snag.json";
import {LessonVideo} from "./LessonVideo";
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

const Root: React.FC = () => <Composition id="AnimationEnglishLesson" component={LessonVideo} fps={30} width={1920} height={1080} durationInFrames={defaults.durationFrames} defaultProps={defaults} calculateMetadata={({props}) => {
  const typed = props as AnimationLessonProps;
  validateResolvedLesson(typed);
  return {fps: typed.fps, durationInFrames: typed.durationFrames, width: 1920, height: 1080};
}}/>;

registerRoot(Root);
