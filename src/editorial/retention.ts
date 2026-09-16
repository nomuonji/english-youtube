import type {EpisodeManifest,Scene} from "../contracts/types";

export type RetentionIssue={code:string;severity:"hard"|"warn";targetId:string;detail:string};
export type RetentionReview={score:number;hardFailures:RetentionIssue[];warnings:RetentionIssue[];metrics:{hookQuestion:boolean;hookWords:number;forwardPullScenes:number;concreteStoryScenes:number;maxVisualRun:number;learningAnchorSpread:number;learningInterruptions:number;lowYieldLearningPoints:number;storyScenes:number}};

const GENERIC_INTRO=/^(today\b|in this video\b|welcome\b|let'?s (talk|look|learn|discuss)\b|this video (is|will)\b)/i;
const FORWARD_PULL=/\b(but|however|yet|the catch|the problem|the question|why|what happens|which means|this is where|surprise|turns out|not so simple|here is the twist|that creates|that leaves|the next constraint)\b/i;
const NUMBER=/\b\d+(?:[.,]\d+)?%?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|percent)\b/i;
const LOW_YIELD=/^(?:is|are|was|were) expected to\b|^keep up with\b|^because of\b|^in order to\b|^as a result\b|^for example\b|^more than\b|^less than\b/i;
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9? ]+/g," ").replace(/\s+/g," ").trim();
const tokens=(s:string)=>new Set(normalize(s).split(" ").filter(w=>w.length>2));
const wordCount=(s:string)=>s.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length??0;

export const hasGenericIntro=(text:string):boolean=>GENERIC_INTRO.test(text.trim());
const tokenOverlap=(a:string,b:string):number=>{const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;let hit=0;for(const x of aa)if(bb.has(x))hit++;return hit/Math.min(aa.size,bb.size);};
const storyScenes=(m:EpisodeManifest)=>m.scenes.filter(s=>s.role==="story");
const sceneText=(m:EpisodeManifest,s:Scene)=>s.utteranceIds.map(id=>m.utterances.find(u=>u.id===id)?.text??"").join(" ");
const finalUtterance=(m:EpisodeManifest,s:Scene)=>m.utterances.find(u=>u.id===s.utteranceIds.at(-1))?.text??"";
const isConcrete=(m:EpisodeManifest,s:Scene):boolean=>["metric","chain","compare","timeline"].includes(s.visual.type)||NUMBER.test(sceneText(m,s));
const maxVisualRun=(scenes:Scene[]):number=>{let max=0,run=0,last="";for(const s of scenes){if(s.visual.type===last)run++;else{last=s.visual.type;run=1;}max=Math.max(max,run);}return max;};

export const reviewRetention=(m:EpisodeManifest):RetentionReview=>{
  const issues:RetentionIssue[]=[];
  const hard=(code:string,targetId:string,detail:string)=>issues.push({code,severity:"hard",targetId,detail});
  const warn=(code:string,targetId:string,detail:string)=>issues.push({code,severity:"warn",targetId,detail});
  const newsFirst=m.formatProfile==="news-first";
  const hook=m.scenes.find(s=>s.role==="hook");
  const hookText=hook?sceneText(m,hook):"";
  const hookWords=wordCount(hookText);
  const hookQuestion=hookText.includes("?")&&tokenOverlap(hookText,m.centralQuestion)>=.35;
  if(!hook)hard("R_HOOK","scenes","hook scene is missing");
  else{
    const first=m.utterances.find(u=>u.id===hook.utteranceIds[0])?.text??"";
    if(hasGenericIntro(first))hard("R_HOOK_GENERIC",hook.id,"hook begins like a lesson or presentation instead of a story");
    if(!hookQuestion)hard("R_HOOK_QUESTION",hook.id,"central question is not clearly asked in the narrated hook");
    const limit=newsFirst?45:65;
    if(hookWords>limit)warn("R_HOOK_LONG",hook.id,`hook is ${hookWords} words; ${newsFirst?"news-first target is roughly 8-15 seconds":"target is a fast 15-25 second opening"}`);
  }

  const stories=storyScenes(m);
  const forward=stories.filter(s=>FORWARD_PULL.test(finalUtterance(m,s))).length;
  const concrete=stories.filter(s=>isConcrete(m,s)).length;
  const visualRun=maxVisualRun(stories);
  if(stories.length&&forward/Math.max(1,stories.length)<.45)warn("R_FORWARD_PULL","scenes",`only ${forward}/${stories.length} story scenes end with contrast, a question, a consequence, or another forward pull`);
  if(stories.length&&concrete/Math.max(1,stories.length)<.7)warn("R_CONCRETE","scenes",`only ${concrete}/${stories.length} story scenes have a concrete number or explanatory visual structure`);
  if(visualRun>=3)warn("R_VISUAL_RUN","scenes",`${visualRun} consecutive story scenes use the same visual type`);

  const sourceSceneIndices=m.learningPoints.map(p=>m.scenes.findIndex(s=>s.role==="story"&&s.utteranceIds.includes(p.sourceUtteranceId))).filter(i=>i>=0).sort((a,b)=>a-b);
  const learningAnchorSpread=sourceSceneIndices.length>=2?(sourceSceneIndices.at(-1)!-sourceSceneIndices[0])/Math.max(1,m.scenes.length-1):0;
  if(learningAnchorSpread<.3)warn("R_LEARNING_SPREAD","learningPoints","learning anchors are clustered; distribute useful-English discoveries across the story");

  const storyIndexes=m.scenes.map((scene,index)=>scene.role==="story"?index:-1).filter(index=>index>=0);
  const firstStory=storyIndexes[0]??-1,lastStory=storyIndexes.at(-1)??-1;
  const learningInterruptions=firstStory>=0&&lastStory>=firstStory?m.scenes.slice(firstStory,lastStory+1).filter(scene=>scene.role==="phrase"||scene.role==="retrieval").length:0;
  const lowYieldLearningPoints=m.learningPoints.filter(point=>LOW_YIELD.test(point.phrase.trim())).length;

  if(newsFirst){
    if(learningInterruptions>0)hard("R_LEARNING_INTERRUPTION","scenes",`${learningInterruptions} dedicated learning scene(s) interrupt the story; move deliberate practice after the final story scene`);
    if(m.scenes.some(scene=>scene.role==="retrieval"))hard("R_RETRIEVAL","scenes","news-first should not replay the same sentence mid-video; use a short end replay instead");
    const firstAfterHook=m.scenes[1];
    if(firstAfterHook&&firstAfterHook.role!=="story")hard("R_STORY_FIRST",firstAfterHook.id,"enter the story immediately after the hook");
    const phraseIndexes=m.scenes.map((scene,index)=>scene.role==="phrase"?index:-1).filter(index=>index>=0);
    if(phraseIndexes.some(index=>index<=lastStory))hard("R_REPLAY_POSITION","scenes","English replay scenes must form one final block after the story");
    if(lowYieldLearningPoints>0)warn("R_LOW_YIELD_ENGLISH","learningPoints",`${lowYieldLearningPoints} anchor expression(s) look like basic grammar/general phrases; prefer B2-C1 business/news collocations that are reusable beyond this topic`);
    const storyShare=stories.length/Math.max(1,m.scenes.length);
    if(storyShare<.6)warn("R_STORY_SHARE","scenes",`story scenes are only ${(storyShare*100).toFixed(0)}% of the episode; the video should feel like a news explainer first`);
  }else{
    const retrievalIndex=m.scenes.findIndex(s=>s.role==="retrieval");
    if(retrievalIndex>=0){const p=retrievalIndex/Math.max(1,m.scenes.length-1);if(p<.55||p>.88)warn("R_RETRIEVAL_POSITION",m.scenes[retrievalIndex]?.id??"retrieval",`listening check appears at ${(p*100).toFixed(0)}%; target is roughly 65-85%`);}
  }

  let score=100;
  score-=issues.filter(i=>i.severity==="hard").length*18;
  score-=issues.filter(i=>i.severity==="warn").length*6;
  if(forward>=Math.ceil(stories.length*.6))score+=4;
  if(concrete===stories.length&&stories.length)score+=3;
  score=Math.max(0,Math.min(100,score));
  return {score,hardFailures:issues.filter(i=>i.severity==="hard"),warnings:issues.filter(i=>i.severity==="warn"),metrics:{hookQuestion,hookWords,forwardPullScenes:forward,concreteStoryScenes:concrete,maxVisualRun:visualRun,learningAnchorSpread:Number(learningAnchorSpread.toFixed(3)),learningInterruptions,lowYieldLearningPoints,storyScenes:stories.length}};
};
