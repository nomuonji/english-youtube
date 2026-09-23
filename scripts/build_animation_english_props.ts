import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname} from "node:path";
import type {AnimationLesson, AnimationLessonProps, TimedScene} from "../src/animation-english/types";
import {validateLesson, validateResolvedLesson} from "../src/animation-english/types";

type SpeechTiming = {
  fps: number;
  scenes: Array<{id: string; durationFrames: number; speechSeconds: number}>;
};

const [lessonPath, timingPath, audioPrefix, outputPath, bgmSrc] = process.argv.slice(2);
if (!lessonPath || !timingPath || !audioPrefix || !outputPath) {
  throw new Error("Usage: tsx scripts/build_animation_english_props.ts <lesson.json> <tts-timing.json> <public-audio-prefix> <output-props.json>");
}

const lesson = JSON.parse(readFileSync(lessonPath, "utf8")) as AnimationLesson;
const timing = JSON.parse(readFileSync(timingPath, "utf8")) as SpeechTiming;
validateLesson(lesson);
if (timing.fps !== 30 || timing.scenes.length !== lesson.scenes.length) throw new Error("Speech timing does not match lesson");
let cursor = 0;
const scenes: TimedScene[] = lesson.scenes.map((scene, index) => {
  const measured = timing.scenes[index];
  if (measured.id !== scene.id || measured.durationFrames < 1 || measured.speechSeconds <= 0) throw new Error(`Speech timing mismatch: ${scene.id}`);
  const durationFrames = measured.durationFrames + scene.holdFrames;
  const timed: TimedScene = {
    ...scene,
    startFrame: cursor,
    durationFrames,
    speechFrames: Math.ceil(measured.speechSeconds * 30),
    audioPath: `${audioPrefix.replace(/\/$/, "")}/${scene.id}.mp3`,
  };
  cursor += durationFrames;
  return timed;
});
const props: AnimationLessonProps = {lesson, fps: 30, durationFrames: cursor, scenes, ...(bgmSrc ? {bgmSrc} : {})};
validateResolvedLesson(props);
mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(outputPath, JSON.stringify(props, null, 2) + "\n");
console.log(JSON.stringify({outputPath, scenes: scenes.length, durationSeconds: cursor / 30, audioClips: scenes.length}));
