import {describe,expect,it} from "vitest";
import fixture from "../../fixtures/v2.1-demo.json";
import type {EpisodeManifest} from "../contracts/types";
import {hasGenericIntro,reviewRetention} from "./retention";

const clone=():EpisodeManifest=>structuredClone(fixture) as EpisodeManifest;

describe("retention review",()=>{
  it("detects generic presentation intros",()=>{
    expect(hasGenericIntro("Today we will learn about AI.")).toBe(true);
    expect(hasGenericIntro("What if electricity becomes the AI bottleneck?")).toBe(false);
  });

  it("returns bounded metrics for a valid legacy manifest",()=>{
    const review=reviewRetention(clone());
    expect(review.score).toBeGreaterThanOrEqual(0);
    expect(review.score).toBeLessThanOrEqual(100);
    expect(review.metrics.storyScenes).toBeGreaterThan(0);
    expect(review.metrics.learningAnchorSpread).toBeGreaterThanOrEqual(0);
    expect(review.metrics.learningAnchorSpread).toBeLessThanOrEqual(1);
    expect(review.metrics.hookWords).toBeGreaterThan(0);
  });

  it("hard-fails a narrated hook that never asks the central question",()=>{
    const doc=clone();
    const hook=doc.scenes.find(scene=>scene.role==="hook");
    if(!hook)throw new Error("fixture hook missing");
    for(const id of hook.utteranceIds){
      const u=doc.utterances.find(item=>item.id===id);
      if(u){u.text="This is a statement about the topic.";u.chunks=[u.text];u.translationJa="これは話題についての説明です。";u.translationJaChunks=[u.translationJa];}
    }
    const review=reviewRetention(doc);
    expect(review.hardFailures.some(issue=>issue.code==="R_HOOK_QUESTION")).toBe(true);
  });

  it("rejects the old mid-story learning interruptions under news-first",()=>{
    const doc=clone();
    doc.formatProfile="news-first";
    const review=reviewRetention(doc);
    expect(review.metrics.learningInterruptions).toBeGreaterThan(0);
    expect(review.hardFailures.some(issue=>issue.code==="R_LEARNING_INTERRUPTION")).toBe(true);
    expect(review.hardFailures.some(issue=>issue.code==="R_RETRIEVAL")).toBe(true);
  });

  it("flags low-yield beginner anchor phrases for news-first",()=>{
    const doc=clone();
    doc.formatProfile="news-first";
    doc.learningPoints[0].phrase="is expected to";
    const review=reviewRetention(doc);
    expect(review.metrics.lowYieldLearningPoints).toBeGreaterThan(0);
    expect(review.warnings.some(issue=>issue.code==="R_LOW_YIELD_ENGLISH")).toBe(true);
  });
});
