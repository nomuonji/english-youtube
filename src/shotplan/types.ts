export type ShotKind =
  | "cold-open"
  | "question"
  | "broll"
  | "evidence"
  | "metric"
  | "mechanism"
  | "contrast"
  | "phrase"
  | "recap";

export type ShotCaptionMode = "en" | "en-ja" | "none";
export type ShotFocus = "left" | "center" | "right";

export type ShotCamera = {
  scaleFrom:number;
  scaleTo:number;
  xFrom:number;
  xTo:number;
  yFrom:number;
  yTo:number;
};

export type ShotPlanShot = {
  id:string;
  sceneId:string;
  startFrame:number;
  durationFrames:number;
  kind:ShotKind;
  utteranceIds:string[];
  claimIds:string[];
  headline:string;
  subhead?:string;
  sourceLabel?:string;
  sourceTitle?:string;
  metric?:{value:string;unit:string;label:string};
  searchQuery:string;
  captionMode:ShotCaptionMode;
  japaneseAnchor?:string;
  focus:ShotFocus;
  camera:ShotCamera;
};

export type ShotPlan = {
  version:"1.0.0";
  experienceVersion:"news-first-v5.0-candidate";
  episodeId:string;
  revision:number;
  manifestHash:string;
  generatedAt:string;
  shots:ShotPlanShot[];
};

export type ShotAsset = {
  shotId:string;
  path:string;
  kind:"image"|"video";
  sourcePage?:string;
  license?:string;
  artist?:string;
  credit?:string;
  query?:string;
};
