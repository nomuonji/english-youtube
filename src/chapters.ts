import type {StoryBeat} from "./contracts/types";

export type ChapterSpec={index:1|2|3|4;beat:StoryBeat;labelEn:string;labelJa:string;callFrames:number};

export const CHAPTERS:ChapterSpec[]=[
  {index:1,beat:"setup",labelEn:"WHAT CHANGED",labelJa:"何が変わったのか",callFrames:90},
  {index:2,beat:"mechanism",labelEn:"HOW IT WORKS",labelJa:"仕組みを理解する",callFrames:90},
  {index:3,beat:"complication",labelEn:"THE CATCH",labelJa:"どこに問題があるのか",callFrames:90},
  {index:4,beat:"answer",labelEn:"WHAT IT MEANS",labelJa:"結局どういうことか",callFrames:90},
];

export const chapterForBeat=(beat:StoryBeat|null|undefined)=>CHAPTERS.find(c=>c.beat===beat);
