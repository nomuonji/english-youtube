import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
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

const runOptional=(command:string,args:string[])=>{
  const r=spawnSync(command,args,{stdio:"inherit",env:process.env});
  if(r.status!==0)console.warn(`[optional-assets] ${command} ${args.join(" ")} exited ${r.status}; continuing without that asset layer`);
};
runOptional("python3",["scripts/generate_sfx.py"]);
if(process.env.ALLOW_BROLL_FETCH==="true"&&!existsSync(resolve(process.cwd(),"public/generated/broll/manifest.json"))){
  runOptional("node",["scripts/fetch_commons_broll.mjs",manifestArg,"public/generated/broll"]);
}

const resolved=compileMeasuredResolved(manifest,timing,process.env.GITHUB_SHA??"local-measured-tts");
const imagesManifestPath=resolve(process.cwd(),"public/generated/images/manifest.json");
const imageAssets=existsSync(imagesManifestPath)?(JSON.parse(readFileSync(imagesManifestPath,"utf8")).generated??[]).map((item:{sceneId:string;purpose:"hook"|"analogy"|"context";file:string})=>({sceneId:item.sceneId,purpose:item.purpose,path:`generated/images/${item.file}`})):[];
const brollManifestPath=resolve(process.cwd(),"public/generated/broll/manifest.json");
const brollAssets=existsSync(brollManifestPath)?(JSON.parse(readFileSync(brollManifestPath,"utf8")).generated??[]):[];
writeFileSync(outputPath,JSON.stringify({manifest,resolved,imageAssets,brollAssets},null,2)+"\n","utf8");
console.log(JSON.stringify({ok:true,provider:timing.provider,output:outputArg,durationFrames:resolved.durationFrames,durationSeconds:resolved.durationFrames/resolved.fps,clips:resolved.clips.length,imageAssets:imageAssets.length,brollAssets:brollAssets.length,manifestHash:resolved.manifestHash}));
