import {describe,expect,it} from "vitest";
import fixture from "../../fixtures/v2.1-demo.json";
import {validateEpisode} from "./validate";
import type {EpisodeManifest} from "./types";

const clone=():EpisodeManifest=>structuredClone(fixture) as EpisodeManifest;

describe("EpisodeManifest v2.1",()=>{
  it("accepts the legacy v2.1 fixture",()=>{expect(validateEpisode(clone()).ok).toBe(true);});
  it("rejects an unknown news peg claim",()=>{const doc=clone();doc.newsPeg.eventClaimId="missing-claim";const result=validateEpisode(doc);expect(result.ok).toBe(false);if(!result.ok)expect(result.issues.some(i=>i.code==="E_NEWS_PEG")).toBe(true);});
  it("requires a source gloss for learning points without a phrase scene",()=>{const doc=clone();const scene=doc.scenes.find(i=>i.id==="s-chain");if(!scene)throw new Error("fixture scene missing");scene.glossLearningPointId=null;const result=validateEpisode(doc);expect(result.ok).toBe(false);if(!result.ok)expect(result.issues.some(i=>i.code==="E_LEARNING"&&i.targetId==="lp-depend")).toBe(true);});
  it("rejects a phrase scene before its source utterance",()=>{const doc=clone();const phrase=doc.scenes.find(i=>i.id==="s-phrase");if(!phrase)throw new Error("fixture scene missing");doc.scenes=[doc.scenes[0],phrase,...doc.scenes.slice(1).filter(i=>i.id!=="s-phrase")];const result=validateEpisode(doc);expect(result.ok).toBe(false);if(!result.ok)expect(result.issues.some(i=>i.code==="E_LEARNING"||i.code==="E_ORDER")).toBe(true);});
  it("rejects arbitrary schema keys",()=>{const doc=clone() as EpisodeManifest&{css?:string};doc.css="body{}";const result=validateEpisode(doc);expect(result.ok).toBe(false);if(!result.ok)expect(result.issues.some(i=>i.code==="E_SCHEMA")).toBe(true);});
  it("rejects retrieval from a future utterance",()=>{const doc=clone();const retrieval=doc.scenes.find(i=>i.role==="retrieval");if(!retrieval||retrieval.visual.type!=="retrieval")throw new Error("fixture retrieval missing");retrieval.visual.sourceUtteranceId="u-recap-one";const result=validateEpisode(doc);expect(result.ok).toBe(false);if(!result.ok)expect(result.issues.some(i=>i.code==="E_RETRIEVAL")).toBe(true);});
  it("does not allow the legacy interrupted lesson structure to opt into news-first",()=>{const doc=clone();doc.formatProfile="news-first";const result=validateEpisode(doc);expect(result.ok).toBe(false);if(!result.ok){expect(result.issues.some(i=>i.code==="E_STRUCTURE"&&i.detail.includes("retrieval"))).toBe(true);expect(result.issues.some(i=>i.code==="E_STRUCTURE"&&i.detail.includes("after the final story scene"))).toBe(true);}});
});
