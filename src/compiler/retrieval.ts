import type {ResolvedEpisode} from "../contracts/types";

export type RetrievalSegment={clipId:string;sourceClipId:string;utteranceId:string;startSample:number;endSample:number;samples:number;sampleRate:48000};

type ResolvedClip=ResolvedEpisode["clips"][number];

export const resolveRetrievalSegment=(clip:ResolvedClip,utteranceId:string):RetrievalSegment=>{
  const boundary=clip.utterances.find(item=>item.utteranceId===utteranceId);
  if(!boundary)throw new Error(`E_RETRIEVAL: ${utteranceId} is not contained in ${clip.clipId}`);
  if(boundary.startSample<0||boundary.endSample<=boundary.startSample||boundary.endSample>clip.samples)throw new Error(`E_ALIGNMENT: invalid sample boundary for ${utteranceId}`);
  return {clipId:`retrieval-${utteranceId}`,sourceClipId:clip.clipId,utteranceId,startSample:boundary.startSample,endSample:boundary.endSample,samples:boundary.endSample-boundary.startSample,sampleRate:48000};
};

export const findRetrievalSourceClip=(resolved:ResolvedEpisode,utteranceId:string):ResolvedClip=>{
  const matches=resolved.clips.filter(clip=>clip.utterances.some(item=>item.utteranceId===utteranceId));
  if(matches.length!==1)throw new Error(`E_RETRIEVAL: expected exactly one source clip for ${utteranceId}, found ${matches.length}`);
  return matches[0];
};
