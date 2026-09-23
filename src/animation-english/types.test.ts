import {describe, expect, it} from "vitest";
import sample from "../../fixtures/animation-english/run-into-a-snag.json";
import type {AnimationLesson, AnimationLessonProps} from "./types";
import {validateLesson, validateResolvedLesson} from "./types";

const lesson = sample as AnimationLesson;

describe("animation English contract", () => {
  it("accepts a lesson with a story, transfer and speaking/recall time", () => {
    expect(() => validateLesson(lesson)).not.toThrow();
  });

  it("rejects lessons that ask for recall before transfer", () => {
    const wrong = {...lesson, scenes: [...lesson.scenes]};
    const transfer = wrong.scenes.findIndex(scene => scene.mode === "transfer");
    const recall = wrong.scenes.findIndex(scene => scene.mode === "recall");
    [wrong.scenes[transfer], wrong.scenes[recall]] = [wrong.scenes[recall], wrong.scenes[transfer]];
    expect(() => validateLesson(wrong)).toThrow(/in order/);
  });

  it("rejects timing that disconnects the next visual from its voice", () => {
    let cursor = 0;
    const scenes = lesson.scenes.map(scene => {
      const timed = {...scene, startFrame: cursor, durationFrames: 120, speechFrames: 80};
      cursor += 120;
      return timed;
    });
    const props: AnimationLessonProps = {lesson, fps: 30, durationFrames: cursor, scenes};
    expect(() => validateResolvedLesson(props)).not.toThrow();
    scenes[1] = {...scenes[1], startFrame: scenes[1].startFrame + 1};
    expect(() => validateResolvedLesson(props)).toThrow(/Broken timing/);
  });
});
