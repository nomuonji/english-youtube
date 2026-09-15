import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import type {EpisodeManifest} from "../contracts/types";
import {validateEpisode} from "../contracts/validate";
import {compileMeasuredResolved,type MeasuredTimingBundle} from "../compiler/measuredTiming";

const [manifestArg="fixtures/v2.1-demo.json",timingArg="public/generated/tts-timing.json",outputArg="public/generated/render-props.json"]=process.argv.slice(2);
const manifestPath=resolve(process.cwd(),manifestArg);
const timingPath=resolve(process.cwd(),timingArg);
const outputPath=resolve(process.cwd(),outputArg);
const rawManifest:unknown=JSON.parse(readFileSync(manifestPath,"utf8"));
const checked=validateEpisode(rawManifest);
if(!checked.ok){console.error(JSON.stringify({ok:false,issues:checked.issues},null,2));process.exit(2);}
const manifest=checked.value as EpisodeManifest;
const timing=JSON.parse(readFileSync(timingPath,"utf8")) as MeasuredTimingBundle;
const resolved=compileMeasuredResolved(manifest,timing,process.env.GITHUB_SHA??"local-measured-tts");
const imagesManifestPath=resolve(process.cwd(),"public/generated/images/manifest.json");
const imageAssets=existsSync(imagesManifestPath)?(JSON.parse(readFileSync(imagesManifestPath,"utf8")).generated??[]).map((item:{sceneId:string;purpose:"hook"|"analogy"|"context";file:string})=>({sceneId:item.sceneId,purpose:item.purpose,path:`generated/images/${item.file}`})):[];
writeFileSync(outputPath,JSON.stringify({manifest,resolved,imageAssets},null,2)+"\n","utf8");
console.log(JSON.stringify({ok:true,provider:timing.provider,output:outputArg,durationFrames:resolved.durationFrames,durationSeconds:resolved.durationFrames/resolved.fps,clips:resolved.clips.length,imageAssets:imageAssets.length,manifestHash:resolved.manifestHash}));
