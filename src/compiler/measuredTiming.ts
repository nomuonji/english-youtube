import type {EpisodeManifest,ResolvedEpisode,ResolvedScene} from "../contracts/types";
import {sha256Canonical} from "../contracts/hash";

export type MeasuredTimingUtterance={
  utteranceId:string;
  startSample:number;
  endSample:number;
  chunkBoundariesSamples:number[];
  chunkEndSamples:number[];
};
export type MeasuredTimingClip={
  clipId:string;
  sceneId:string;
  path:string;
  sha256:string;
  sampleRate:number;
  samples:number;
  utterances:MeasuredTimingUtterance[];
};
export type MeasuredTimingBundle={
  version:"1.0.0";
  provider:string;
  providerVersion:string;
  voice:string;
  rate?:string;
  speed?:number;
  sampleRate:number;
  clips:MeasuredTimingClip[];
};

const FPS=30;
const LEAD_FRAMES=12;
const TAIL_FRAMES=18;
const samplesToFrames=(samples:number,sampleRate:number):number=>Math.max(0,Math.round(samples/sampleRate*FPS));
const clipFrames=(clip:MeasuredTimingClip):number=>Math.max(1,Math.ceil(clip.samples/clip.sampleRate*FPS));

const assertClip=(clip:MeasuredTimingClip):void=>{
  if(!Number.isInteger(clip.sampleRate)||clip.sampleRate<=0)throw new Error(`E_SAMPLE_RATE: invalid sample rate for ${clip.clipId}`);
  if(!Number.isInteger(clip.samples)||clip.samples<=0)throw new Error(`E_SAMPLES: invalid sample length for ${clip.clipId}`);
};

const buildCues=(manifest:EpisodeManifest,clip:MeasuredTimingClip,audioStartFrame:number,onlyUtteranceId?:string):ResolvedScene["cues"]=>{
  const cues:ResolvedScene["cues"]=[];
  for(const timed of clip.utterances){
    if(onlyUtteranceId&&timed.utteranceId!==onlyUtteranceId)continue;
    const utterance=manifest.utterances.find(item=>item.id===timed.utteranceId);
    if(!utterance)throw new Error(`E_REFERENCE: timing references missing utterance ${timed.utteranceId}`);
    if(timed.chunkBoundariesSamples.length!==utterance.chunks.length||timed.chunkEndSamples.length!==utterance.chunks.length){
      throw new Error(`E_TIMING: chunk count mismatch for ${timed.utteranceId}`);
    }
    utterance.chunks.forEach((chunk,index)=>{
      const startSample=timed.chunkBoundariesSamples[index];
      const endSample=timed.chunkEndSamples[index];
      if(startSample===undefined||endSample===undefined||startSample<0||endSample<=startSample||endSample>clip.samples){
        throw new Error(`E_TIMING: invalid chunk samples for ${timed.utteranceId}:${index}`);
      }
      const startFrame=audioStartFrame+samplesToFrames(startSample,clip.sampleRate);
      const endFrame=Math.max(startFrame+1,audioStartFrame+samplesToFrames(endSample,clip.sampleRate));
      cues.push({startFrame,endFrame,utteranceId:utterance.id,chunkIndices:[index],text:chunk,translationJa:utterance.translationJaChunks[index]??utterance.translationJa});
    });
  }
  return cues;
};

export const compileMeasuredResolved=(manifest:EpisodeManifest,timing:MeasuredTimingBundle,engineCommit:string):ResolvedEpisode=>{
  if(!timing.provider.trim())throw new Error("E_PROVIDER: missing TTS provider");
  if(!Number.isInteger(timing.sampleRate)||timing.sampleRate<=0)throw new Error(`E_SAMPLE_RATE: invalid bundle sample rate ${timing.sampleRate}`);
  timing.clips.forEach(assertClip);
  let cursor=0;
  const scenes:ResolvedScene[]=[];
  for(const scene of manifest.scenes){
    if(scene.role==="retrieval"&&scene.visual.type==="retrieval"){
      const clip=timing.clips.find(item=>item.sceneId===scene.id&&item.clipId===`retrieval-${scene.id}`);
      if(!clip)throw new Error(`E_TIMING: retrieval clip missing for ${scene.id}`);
      const duration=clipFrames(clip);
      const prompt=75,think=75,answer=90;
      const start=cursor;
      const listenStart=start+prompt;
      const revealStart=listenStart+duration+think;
      const end=revealStart+duration+answer;
      const phases:ResolvedScene["phases"]=[
        {name:"prompt",startFrame:start,endFrame:listenStart},
        {name:"listen",startFrame:listenStart,endFrame:listenStart+duration},
        {name:"think",startFrame:listenStart+duration,endFrame:revealStart},
        {name:"reveal",startFrame:revealStart,endFrame:revealStart+duration},
        {name:"answer",startFrame:revealStart+duration,endFrame:end},
      ];
      scenes.push({sceneId:scene.id,startFrame:start,durationFrames:end-start,audioEvents:[
        {clipId:clip.clipId,utteranceId:scene.visual.sourceUtteranceId,startFrame:listenStart},
        {clipId:clip.clipId,utteranceId:scene.visual.sourceUtteranceId,startFrame:revealStart},
      ],cues:buildCues(manifest,clip,revealStart,scene.visual.sourceUtteranceId),phases});
      cursor=end;
      continue;
    }
    if(scene.utteranceIds.length===0)throw new Error(`E_TIMING: non-retrieval scene without utterance ${scene.id}`);
    const clip=timing.clips.find(item=>item.sceneId===scene.id&&item.clipId===`speech-${scene.id}`);
    if(!clip)throw new Error(`E_TIMING: speech clip missing for ${scene.id}`);
    const start=cursor;
    const audioStart=start+LEAD_FRAMES;
    const durationFrames=LEAD_FRAMES+clipFrames(clip)+TAIL_FRAMES;
    scenes.push({sceneId:scene.id,startFrame:start,durationFrames,audioEvents:[{clipId:clip.clipId,utteranceId:scene.utteranceIds[0],startFrame:audioStart}],cues:buildCues(manifest,clip,audioStart),phases:[{name:"normal",startFrame:start,endFrame:start+durationFrames}]});
    cursor+=durationFrames;
  }
  return {
    version:"2.1.0",episodeId:manifest.episodeId,revision:manifest.revision,manifestHash:sha256Canonical(manifest),engineCommit,
    fps:30,width:1920,height:1080,durationFrames:cursor,
    clips:timing.clips.map(clip=>({clipId:clip.clipId,sceneId:clip.sceneId,path:clip.path,sha256:clip.sha256,sampleRate:clip.sampleRate,samples:clip.samples,utterances:clip.utterances.map(item=>({utteranceId:item.utteranceId,startSample:item.startSample,endSample:item.endSample,chunkBoundariesSamples:item.chunkBoundariesSamples}))})),
    scenes,
  };
};
