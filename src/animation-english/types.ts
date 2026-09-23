export type LessonMode = "story" | "notice" | "transfer" | "speak" | "recall" | "answer";
export type LessonWorld = "street" | "office";
export type LessonAction = "drive" | "blocked" | "reroute" | "launch-blocked";

export type LessonScene = {
  id: string;
  mode: LessonMode;
  world: LessonWorld;
  action: LessonAction;
  narrationEn: string;
  captionEn: string;
  holdFrames: number;
};

export type AnimationLesson = {
  version: "animation-english/1.0";
  id: string;
  status: "candidate" | "ready";
  title: string;
  level: "B1" | "B2" | "C1";
  voice: string;
  rate: string;
  pitch: string;
  target: {
    phrase: string;
    emphasis: string;
    meaningEn: string;
    meaningJa: string;
    transferSituation: string;
  };
  scenes: LessonScene[];
};

export type TimedScene = LessonScene & {
  startFrame: number;
  durationFrames: number;
  speechFrames: number;
  audioPath?: string;
};

export type AnimationLessonProps = {
  lesson: AnimationLesson;
  fps: number;
  durationFrames: number;
  scenes: TimedScene[];
  bgmSrc?: string;
};

export const validateLesson = (lesson: AnimationLesson): void => {
  if (lesson.version !== "animation-english/1.0" || !lesson.id || !lesson.title) throw new Error("Invalid lesson identity");
  if (!["B1", "B2", "C1"].includes(lesson.level) || !lesson.voice) throw new Error("Invalid learner or voice setting");
  if (!lesson.target.phrase || !lesson.target.emphasis || !lesson.target.phrase.toLowerCase().includes(lesson.target.emphasis.toLowerCase()) || !lesson.target.meaningEn || !lesson.target.meaningJa) throw new Error("Missing learning target");
  if (lesson.scenes.length < 4 || new Set(lesson.scenes.map(scene => scene.id)).size !== lesson.scenes.length) throw new Error("Scenes must have unique IDs");
  const modes = lesson.scenes.map(scene => scene.mode);
  const notice = modes.indexOf("notice"), transfer = modes.indexOf("transfer"), speak = modes.indexOf("speak"), recall = modes.indexOf("recall");
  if (modes[0] !== "story" || notice < 1 || transfer <= notice || speak <= transfer || recall <= speak || modes.at(-1) !== "answer") throw new Error("Lesson must show, explain, transfer, speak and recall the target in order");
  for (const scene of lesson.scenes) {
    if (!scene.narrationEn || !scene.captionEn || !Number.isInteger(scene.holdFrames) || scene.holdFrames < 0) throw new Error(`Invalid scene ${scene.id}`);
    if ((scene.mode === "speak" || scene.mode === "recall") && scene.holdFrames < 30) throw new Error(`Practice needs at least one second of response time: ${scene.id}`);
    if ((scene.world === "street" && scene.action === "launch-blocked") || (scene.world === "office" && scene.action !== "launch-blocked")) throw new Error(`World/action mismatch: ${scene.id}`);
  }
};

export const validateResolvedLesson = (props: AnimationLessonProps): void => {
  validateLesson(props.lesson);
  if (props.fps !== 30 || props.scenes.length !== props.lesson.scenes.length) throw new Error("Invalid resolved lesson timing");
  let cursor = 0;
  for (const [index, scene] of props.scenes.entries()) {
    if (scene.id !== props.lesson.scenes[index].id || scene.startFrame !== cursor || scene.durationFrames < scene.speechFrames || scene.speechFrames < 1) throw new Error(`Broken timing: ${scene.id}`);
    cursor += scene.durationFrames;
  }
  if (cursor !== props.durationFrames) throw new Error("Resolved lesson duration mismatch");
};
