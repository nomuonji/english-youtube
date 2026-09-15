import type {EpisodeManifest,Scene} from "../contracts/types";

export type CognitiveIssue={code:string;severity:"hard"|"warn";targetId:string;detail:string};
export type CognitiveReview={score:number;hardFailures:CognitiveIssue[];warnings:CognitiveIssue[];metrics:{maxVisualItems:number;denseVisualScenes:number;longCardScenes:number;storyScenes:number}};

const words=(s:string)=>s.trim().split(/\s+/).filter(Boolean).length;
const visualItems=(scene:Scene):number=>{
  switch(scene.visual.type){
    case "chain": return scene.visual.nodes.length;
    case "compare": return scene.visual.rows.length;
    case "timeline": return scene.visual.events.length;
    case "recap": return scene.visual.learningPointIds.length;
    default: return 1;
  }
};
const visualTextWords=(scene:Scene):number=>{
  switch(scene.visual.type){
    case "card": return words(`${scene.visual.headline} ${scene.visual.body}`);
    case "metric": return words(`${scene.visual.value} ${scene.visual.unit} ${scene.visual.label} ${scene.visual.qualifier}`);
    case "chain": return scene.visual.nodes.reduce((n,x)=>n+words(x.label),0);
    case "compare": return words(`${scene.visual.leftTitle} ${scene.visual.rightTitle}`)+scene.visual.rows.reduce((n,x)=>n+words(`${x.aspect} ${x.left} ${x.right}`),0);
    case "timeline": return scene.visual.events.reduce((n,x)=>n+words(`${x.dateLabel} ${x.label}`),0);
    case "retrieval": return words(scene.visual.question)+scene.visual.options.reduce((n,x)=>n+words(x),0);
    default: return 0;
  }
};

export const reviewCognitiveLoad=(m:EpisodeManifest):CognitiveReview=>{
  const issues:CognitiveIssue[]=[];
  const hard=(code:string,targetId:string,detail:string)=>issues.push({code,severity:"hard",targetId,detail});
  const warn=(code:string,targetId:string,detail:string)=>issues.push({code,severity:"warn",targetId,detail});
  let maxVisualItems=0,denseVisualScenes=0,longCardScenes=0;

  for(const scene of m.scenes){
    const items=visualItems(scene);
    const visualWords=visualTextWords(scene);
    maxVisualItems=Math.max(maxVisualItems,items);

    if(scene.visual.type==="chain"&&items>5)hard("C_CHAIN_DENSE",scene.id,`chain has ${items} nodes; split the explanation so the viewer follows one causal step at a time`);
    if(scene.visual.type==="compare"&&items>4)hard("C_COMPARE_DENSE",scene.id,`compare has ${items} rows; keep at most four readable rows`);
    if(scene.visual.type==="timeline"&&items>5)hard("C_TIMELINE_DENSE",scene.id,`timeline has ${items} events; split or simplify it`);
    if(visualWords>34){denseVisualScenes++;warn("C_VISUAL_TEXT",scene.id,`visual contains about ${visualWords} words; reduce on-screen reading while narration is active`);}
    if(scene.visual.type==="card"&&words(scene.visual.body)>20){longCardScenes++;warn("C_CARD_BODY",scene.id,"card body is long; prefer a strong image/diagram plus one short takeaway");}
    if(scene.role==="story"&&scene.utteranceIds.length>5)warn("C_SCENE_LONG",scene.id,`story scene contains ${scene.utteranceIds.length} utterances; consider splitting the beat for a clearer visual reset`);
  }

  let score=100;
  score-=issues.filter(i=>i.severity==="hard").length*20;
  score-=issues.filter(i=>i.severity==="warn").length*5;
  score=Math.max(0,score);
  return {score,hardFailures:issues.filter(i=>i.severity==="hard"),warnings:issues.filter(i=>i.severity==="warn"),metrics:{maxVisualItems,denseVisualScenes,longCardScenes,storyScenes:m.scenes.filter(s=>s.role==="story").length}};
};
