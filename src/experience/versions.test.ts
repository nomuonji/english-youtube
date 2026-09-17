import {describe,expect,it} from "vitest";
import {EXPERIENCE_VERSIONS,STABLE_EXPERIENCE_VERSION,resolveExperienceVersion} from "./versions";
import type {EpisodeManifest} from "../contracts/types";

const manifest=(experienceVersion?:EpisodeManifest["experienceVersion"]):EpisodeManifest=>({
  schemaVersion:"2.1.0",formatProfile:"news-first",experienceVersion,kind:"fixture",episodeId:"2026-09-17-version-test",revision:1,generatedAt:"2026-09-17T00:00:00Z",asOf:"2026-09-17T00:00:00Z",category:"technology",
  newsPeg:{eventClaimId:"claim",eventDate:"2026-09-17",whyNow:"test"},centralQuestion:"test",answer:"test",sources:[],claims:[],utterances:[],learningPoints:[] as unknown as EpisodeManifest["learningPoints"],scenes:[],packaging:{candidates:[{titleJa:"a",thumbnailJa:"a"},{titleJa:"b",thumbnailJa:"b"},{titleJa:"c",thumbnailJa:"c"}],selectedIndex:0},
});

describe("experience versions",()=>{
  it("keeps v3.0 as the stable default while v4 is only a candidate",()=>{
    expect(STABLE_EXPERIENCE_VERSION).toBe("news-first-v3.0");
    expect(EXPERIENCE_VERSIONS["news-first-v3.0"].status).toBe("stable");
    expect(EXPERIENCE_VERSIONS["news-first-v4.0-candidate"].status).toBe("candidate");
  });
  it("resolves an explicitly pinned v4 candidate without promoting it",()=>{
    expect(resolveExperienceVersion(manifest("news-first-v4.0-candidate"))).toBe("news-first-v4.0-candidate");
    expect(resolveExperienceVersion(manifest())).toBe("news-first-v3.0");
  });
});
