import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";

const [inputArg="episodes/2026-09-15-ai-power-project/manifest.json",outDirArg="public/generated/experience-ab"]=process.argv.slice(2);
const inputPath=resolve(process.cwd(),inputArg);
const outDir=resolve(process.cwd(),outDirArg);
const base=JSON.parse(readFileSync(inputPath,"utf8"));
const words=(text)=>text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length??0;

const hooks=base.scenes.filter((scene)=>scene.role==="hook");
const stories=base.scenes.filter((scene)=>scene.role==="story");
const phrases=base.scenes.filter((scene)=>scene.role==="phrase").slice(0,3);
const recaps=base.scenes.filter((scene)=>scene.role==="recap");
if(hooks.length<1)throw new Error("A/B source manifest has no hook scene");
if(stories.length<8)throw new Error(`A/B source manifest has only ${stories.length} story scenes`);
if(phrases.length<1)throw new Error("A/B source manifest has no phrase scenes");
if(recaps.length!==1)throw new Error(`A/B source manifest must have exactly one recap; found ${recaps.length}`);

const utteranceById=new Map(base.utterances.map((utterance)=>[utterance.id,utterance]));
const requireUtterance=(id)=>{
  const utterance=utteranceById.get(id);
  if(!utterance)throw new Error(`Scene references missing utterance ${id}`);
  return utterance;
};

// The historical AI-power manifest predates the tighter news-first word budget.
// For a fair renderer A/B we derive one shared editorial cut at runtime rather
// than mutating the reviewed historical manifest or weakening the current gate.
// Anything tied to data reveals, learning points, or scene boundaries is frozen.
const protectedIds=new Set();
for(const scene of stories){
  if(scene.utteranceIds[0])protectedIds.add(scene.utteranceIds[0]);
  if(scene.utteranceIds.at(-1))protectedIds.add(scene.utteranceIds.at(-1));
  const visual=scene.visual;
  if(visual.type==="chain")for(const node of visual.nodes)protectedIds.add(node.revealAtUtteranceId);
  if(visual.type==="compare")for(const row of visual.rows)protectedIds.add(row.revealAtUtteranceId);
  if(visual.type==="timeline")for(const event of visual.events)protectedIds.add(event.revealAtUtteranceId);
}
for(const point of base.learningPoints){
  protectedIds.add(point.sourceUtteranceId);
  const phrase=point.phrase.toLocaleLowerCase("en-US");
  for(const scene of stories){
    for(const id of scene.utteranceIds){
      if(requireUtterance(id).text.toLocaleLowerCase("en-US").includes(phrase))protectedIds.add(id);
    }
  }
}

const fixedScenes=[hooks[0],...phrases,recaps[0]];
const initialIds=[hooks[0],...stories,...phrases,recaps[0]].flatMap((scene)=>scene.utteranceIds);
const initialWords=initialIds.reduce((sum,id)=>sum+words(requireUtterance(id).text),0);
const TARGET_MAX=840;
const TARGET_MIN=800;

const keptByScene=new Map(stories.map((scene)=>[scene.id,[...scene.utteranceIds]]));
const removable=[];
for(const scene of stories){
  for(let index=0;index<scene.utteranceIds.length;index+=1){
    const id=scene.utteranceIds[index];
    if(protectedIds.has(id))continue;
    removable.push({sceneId:scene.id,id,index,wordCount:words(requireUtterance(id).text),sceneLength:scene.utteranceIds.length});
  }
}

// Prefer removing long, genuinely middle exposition from scenes that have more
// editorial slack. Keep at least two utterances in every story scene.
removable.sort((a,b)=>
  (b.sceneLength-a.sceneLength)||
  (b.wordCount-a.wordCount)||
  (Math.abs(a.index-(a.sceneLength-1)/2)-Math.abs(b.index-(b.sceneLength-1)/2))
);

let currentWords=initialWords;
const removed=[];
for(const item of removable){
  if(currentWords<=TARGET_MAX)break;
  const ids=keptByScene.get(item.sceneId);
  if(!ids||ids.length<=2||!ids.includes(item.id))continue;
  // Do not over-trim below the useful A/B band unless necessary to satisfy 850.
  if(currentWords-item.wordCount<TARGET_MIN&&currentWords<=850)continue;
  keptByScene.set(item.sceneId,ids.filter((id)=>id!==item.id));
  currentWords-=item.wordCount;
  removed.push({...item,text:requireUtterance(item.id).text});
}
if(currentWords>850)throw new Error(`Could not safely trim historical source below 850 words; still ${currentWords}`);

const trimmedStories=stories.map((scene)=>({...scene,utteranceIds:keptByScene.get(scene.id)??scene.utteranceIds}));
const scenes=[hooks[0],...trimmedStories,...phrases,recaps[0]];
const orderedUtteranceIds=scenes.flatMap((scene)=>scene.utteranceIds);
const utterances=orderedUtteranceIds.map(requireUtterance);
const spokenWords=utterances.reduce((sum,utterance)=>sum+words(utterance.text),0);

const make=(experienceVersion)=>({
  ...base,
  formatProfile:"news-first",
  experienceVersion,
  revision:base.revision+1,
  scenes,
  utterances,
});

const stable=make("news-first-v3.0");
const candidate=make("news-first-v4.0-candidate");
mkdirSync(outDir,{recursive:true});
writeFileSync(resolve(outDir,"stable-v3.json"),JSON.stringify(stable,null,2)+"\n","utf8");
writeFileSync(resolve(outDir,"candidate-v4.json"),JSON.stringify(candidate,null,2)+"\n","utf8");
writeFileSync(resolve(outDir,"editorial-cut.json"),JSON.stringify({
  sourceManifest:inputArg,
  initialWords,
  spokenWords,
  removed:removed.map(({sceneId,id,wordCount,text})=>({sceneId,id,wordCount,text})),
  protectedUtteranceCount:protectedIds.size,
},null,2)+"\n","utf8");

console.log(JSON.stringify({
  ok:true,
  input:inputArg,
  output:outDirArg,
  scenes:{hook:1,story:trimmedStories.length,phrase:phrases.length,recap:1,total:scenes.length},
  utterances:utterances.length,
  initialWords,
  spokenWords,
  removedUtterances:removed.length,
  stableVersion:stable.experienceVersion,
  candidateVersion:candidate.experienceVersion,
},null,2));
