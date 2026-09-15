import {describe,expect,it} from "vitest";
import fixture from "../../../fixtures/v2.1-demo.json";
import type {EpisodeManifest} from "../../contracts/types";
import {buildSpeechGroup,buildSpeechGroups,chunkStartMark,utteranceEndMark,utteranceStartMark} from "./ssml";

const manifest=fixture as EpisodeManifest;

describe("scene speech groups",()=>{
  it("creates one group per narrated scene and skips retrieval",()=>{
    const groups=buildSpeechGroups(manifest);
    expect(groups).toHaveLength(manifest.scenes.filter(scene=>scene.role!=="retrieval"&&scene.utteranceIds.length>0).length);
    expect(groups.some(group=>group.sceneId==="s-retrieval")).toBe(false);
  });
  it("marks utterance and chunk boundaries in deterministic order",()=>{
    const scene=manifest.scenes.find(item=>item.id==="s-metric");
    if(!scene)throw new Error("fixture scene missing");
    const group=buildSpeechGroup(manifest,scene);
    expect(group).not.toBeNull();
    if(!group)return;
    expect(group.markNames).toEqual([
      utteranceStartMark("u-metric"),
      chunkStartMark("u-metric",0),
      chunkStartMark("u-metric",1),
      chunkStartMark("u-metric",2),
      utteranceEndMark("u-metric"),
    ]);
    expect(group.normalizedSsml.startsWith("<speak>")).toBe(true);
    expect(group.normalizedSsml.endsWith("</speak>")).toBe(true);
  });
  it("escapes XML-sensitive narration",()=>{
    const doc=structuredClone(manifest);
    const utterance=doc.utterances.find(item=>item.id==="u-hook");
    if(!utterance)throw new Error("fixture utterance missing");
    utterance.text="A & B < C";
    utterance.chunks=["A & B < C"];
    const scene=doc.scenes.find(item=>item.id==="s-hook");
    if(!scene)throw new Error("fixture scene missing");
    const group=buildSpeechGroup(doc,scene);
    expect(group?.normalizedSsml).toContain("A &amp; B &lt; C");
    expect(group?.normalizedSsml).not.toContain("A & B < C");
  });
});
