import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import type {EpisodeManifest} from "../contracts/types";
import {validateEpisode} from "../contracts/validate";
import {compileEdgeResolved,type EdgeTimingBundle} from "../compiler/edgeTiming";

const [manifestArg="fixtures/v2.1-demo.json",timingArg="public/generated/tts-timing.json",outputArg="public/generated/render-props.json"]=process.argv.slice(2);
const manifestPath=resolve(process.cwd(),manifestArg);
const timingPath=resolve(process.cwd(),timingArg);
const outputPath=resolve(process.cwd(),outputArg);
const rawManifest:unknown=JSON.parse(readFileSync(manifestPath,"utf8"));
const checked=validateEpisode(rawManifest);
if(!checked.ok){console.error(JSON.stringify({ok:false,issues:checked.issues},null,2));process.exit(2);}
const manifest=checked.value as EpisodeManifest;
const timing=JSON.parse(readFileSync(timingPath,"utf8")) as EdgeTimingBundle;
const resolved=compileEdgeResolved(manifest,timing,process.env.GITHUB_SHA??"local-edge-tts");
writeFileSync(outputPath,JSON.stringify({manifest,resolved},null,2)+"\n","utf8");
console.log(JSON.stringify({ok:true,output:outputArg,durationFrames:resolved.durationFrames,durationSeconds:resolved.durationFrames/resolved.fps,clips:resolved.clips.length,manifestHash:resolved.manifestHash}));
