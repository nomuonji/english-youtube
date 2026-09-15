import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {sha256Canonical} from "../contracts/hash";
import {validateEpisode} from "../contracts/validate";

const path=process.argv[2]??"fixtures/v2.1-demo.json";
try{const absolute=resolve(process.cwd(),path);const value:unknown=JSON.parse(readFileSync(absolute,"utf8"));const result=validateEpisode(value);if(!result.ok){console.error(JSON.stringify({ok:false,path,issues:result.issues},null,2));process.exitCode=2;}else{console.log(JSON.stringify({ok:true,path,episodeId:result.value.episodeId,revision:result.value.revision,scenes:result.value.scenes.length,manifestHash:sha256Canonical(result.value)}));}}catch(error){console.error(JSON.stringify({ok:false,path,error:error instanceof Error?error.message:String(error)}));process.exitCode=2;}
