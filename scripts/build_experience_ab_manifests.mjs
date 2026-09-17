import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {dirname,resolve} from "node:path";

const [inputArg="episodes/2026-09-15-ai-power-project/manifest.json",outDirArg="public/generated/experience-ab"]=process.argv.slice(2);
const inputPath=resolve(process.cwd(),inputArg);
const outDir=resolve(process.cwd(),outDirArg);
const base=JSON.parse(readFileSync(inputPath,"utf8"));

const hooks=base.scenes.filter((scene)=>scene.role==="hook");
const stories=base.scenes.filter((scene)=>scene.role==="story");
const phrases=base.scenes.filter((scene)=>scene.role==="phrase").slice(0,3);
const recaps=base.scenes.filter((scene)=>scene.role==="recap");
if(hooks.length<1)throw new Error("A/B source manifest has no hook scene");
if(stories.length<8)throw new Error(`A/B source manifest has only ${stories.length} story scenes`);
if(phrases.length<1)throw new Error("A/B source manifest has no phrase scenes");
if(recaps.length!==1)throw new Error(`A/B source manifest must have exactly one recap; found ${recaps.length}`);

const scenes=[hooks[0],...stories,...phrases,recaps[0]];
const utteranceById=new Map(base.utterances.map((utterance)=>[utterance.id,utterance]));
const orderedUtteranceIds=scenes.flatMap((scene)=>scene.utteranceIds);
const utterances=orderedUtteranceIds.map((id)=>{
  const utterance=utteranceById.get(id);
  if(!utterance)throw new Error(`Scene references missing utterance ${id}`);
  return utterance;
});

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

const words=(text)=>text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length??0;
const spokenWords=utterances.reduce((sum,utterance)=>sum+words(utterance.text),0);
console.log(JSON.stringify({
  ok:true,
  input:inputArg,
  output:outDirArg,
  scenes:{hook:1,story:stories.length,phrase:phrases.length,recap:1,total:scenes.length},
  utterances:utterances.length,
  spokenWords,
  stableVersion:stable.experienceVersion,
  candidateVersion:candidate.experienceVersion,
},null,2));
