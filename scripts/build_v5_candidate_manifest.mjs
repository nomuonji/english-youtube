#!/usr/bin/env node
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";

const [inputArg="episodes/2026-09-15-ai-power-project/manifest.json",outDirArg="public/generated/v5-candidate"]=process.argv.slice(2);
const run=spawnSync(process.execPath,["scripts/build_experience_ab_manifests.mjs",inputArg,outDirArg],{stdio:"inherit"});
if(run.status!==0)process.exit(run.status??1);
const stablePath=resolve(process.cwd(),outDirArg,"stable-v3.json");
const outPath=resolve(process.cwd(),outDirArg,"candidate-v5.json");
const manifest=JSON.parse(readFileSync(stablePath,"utf8"));
manifest.experienceVersion="news-first-v5.0-candidate";
writeFileSync(outPath,JSON.stringify(manifest,null,2)+"\n","utf8");
console.log(JSON.stringify({ok:true,output:outPath,experienceVersion:manifest.experienceVersion,revision:manifest.revision}));
