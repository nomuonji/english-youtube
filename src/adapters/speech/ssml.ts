import type {EpisodeManifest, Scene, Utterance} from "../../contracts/types";

export type SpeechGroupSpec={
  clipId:string;
  sceneId:string;
  utteranceIds:string[];
  normalizedSsml:string;
  markNames:string[];
};

const xmlEscape=(value:string):string=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const mark=(name:string):string=>`<mark name="${xmlEscape(name)}"/>`;
export const utteranceStartMark=(id:string):string=>`u:${id}:start`;
export const utteranceEndMark=(id:string):string=>`u:${id}:end`;
export const chunkStartMark=(id:string,index:number):string=>`u:${id}:c:${index}`;

const utteranceToSsml=(utterance:Utterance):{ssml:string;marks:string[]}=>{
  const marks:string[]=[];
  const pieces:string[]=[];
  const start=utteranceStartMark(utterance.id);marks.push(start);pieces.push(mark(start));
  utterance.chunks.forEach((chunk,index)=>{const chunkMark=chunkStartMark(utterance.id,index);marks.push(chunkMark);pieces.push(mark(chunkMark),xmlEscape(chunk));});
  const end=utteranceEndMark(utterance.id);marks.push(end);pieces.push(mark(end));
  return {ssml:pieces.join(" "),marks};
};

export const sceneNeedsSpeech=(scene:Scene):boolean=>scene.role!=="retrieval"&&scene.utteranceIds.length>0;

export const buildSpeechGroup=(manifest:EpisodeManifest,scene:Scene):SpeechGroupSpec|null=>{
  if(!sceneNeedsSpeech(scene))return null;
  const utterances=scene.utteranceIds.map(id=>manifest.utterances.find(item=>item.id===id)).filter((item):item is Utterance=>Boolean(item));
  if(utterances.length!==scene.utteranceIds.length)throw new Error(`E_REFERENCE: missing utterance in scene ${scene.id}`);
  const parts=utterances.map(utteranceToSsml);
  const normalizedSsml=`<speak>${parts.map(part=>part.ssml).join(" ")}</speak>`;
  return {clipId:`speech-${scene.id}`,sceneId:scene.id,utteranceIds:[...scene.utteranceIds],normalizedSsml,markNames:parts.flatMap(part=>part.marks)};
};

export const buildSpeechGroups=(manifest:EpisodeManifest):SpeechGroupSpec[]=>manifest.scenes.map(scene=>buildSpeechGroup(manifest,scene)).filter((group):group is SpeechGroupSpec=>group!==null);
