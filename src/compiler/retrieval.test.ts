import {describe,expect,it} from "vitest";
import type {ResolvedEpisode} from "../contracts/types";
import {findRetrievalSourceClip,resolveRetrievalSegment} from "./retrieval";

const clip:ResolvedEpisode["clips"][number]={clipId:"speech-s-story",sceneId:"s-story",path:"audio/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.wav",sha256:"a".repeat(64),sampleRate:48000,samples:960000,utterances:[{utteranceId:"u-one",startSample:0,endSample:336000,chunkBoundariesSamples:[0,168000,336000]},{utteranceId:"u-two",startSample:360000,endSample:840000,chunkBoundariesSamples:[360000,600000,840000]}]};
const resolved:ResolvedEpisode={version:"2.1.0",episodeId:"2026-09-15-test",revision:1,manifestHash:"m",engineCommit:"e",fps:30,width:1920,height:1080,durationFrames:600,clips:[clip],scenes:[]};

describe("retrieval segment",()=>{
  it("cuts the exact source utterance sample interval",()=>{const source=findRetrievalSourceClip(resolved,"u-two");const segment=resolveRetrievalSegment(source,"u-two");expect(segment.startSample).toBe(360000);expect(segment.endSample).toBe(840000);expect(segment.samples).toBe(480000);expect(segment.sampleRate).toBe(48000);});
  it("rejects a missing source utterance",()=>{expect(()=>findRetrievalSourceClip(resolved,"missing")).toThrow(/E_RETRIEVAL/);});
  it("rejects invalid source boundaries",()=>{const broken=structuredClone(clip);broken.utterances[0].endSample=broken.samples+1;expect(()=>resolveRetrievalSegment(broken,"u-one")).toThrow(/E_ALIGNMENT/);});
});
