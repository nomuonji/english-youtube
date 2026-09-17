import type {EpisodeManifest,ExperienceVersion} from "../contracts/types";

export const STABLE_EXPERIENCE_VERSION:ExperienceVersion="news-first-v3.0";

export const EXPERIENCE_VERSIONS={
  "news-first-v3.0":{
    status:"stable",
    formatProfile:"news-first",
    renderer:"NewsFirstSceneRenderer",
    durationSeconds:[300,390] as const,
    description:"Accepted long-form production baseline derived from the approved v3 visual pilot.",
  },
  "news-first-v4.0-candidate":{
    status:"candidate",
    formatProfile:"news-first",
    renderer:"DocumentarySceneRenderer",
    durationSeconds:[300,390] as const,
    description:"Documentary-first candidate with evidence-led visuals, adaptive Japanese support, and a compact end replay.",
  },
} as const satisfies Record<ExperienceVersion,{
  status:"stable"|"candidate"|"retired";
  formatProfile:"news-first";
  renderer:string;
  durationSeconds:readonly [number,number];
  description:string;
}>;

export type ResolvedExperienceVersion="legacy-v2.1"|ExperienceVersion;

/**
 * Compatibility resolver only. New production manifests must pin experienceVersion.
 * Never change the behavior behind an existing version ID. Add a new ID instead.
 */
export const resolveExperienceVersion=(manifest:EpisodeManifest):ResolvedExperienceVersion=>{
  if(manifest.experienceVersion)return manifest.experienceVersion;
  if(manifest.formatProfile==="news-first")return STABLE_EXPERIENCE_VERSION;
  return "legacy-v2.1";
};
