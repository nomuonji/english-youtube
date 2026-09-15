import {readFileSync} from "node:fs";
import {dirname,relative,resolve} from "node:path";
import {sha256Canonical} from "../contracts/hash";
import {validateEpisode} from "../contracts/validate";

type Ready={runId:string;episodeId:string;revision:number;manifestHash:string;generatedAt:string};
const readyPath=process.argv[2];
if(!readyPath){console.error("usage: npm run check-ready -- runs/YYYY-MM-DD/<runId>/READY.json");process.exit(2);}
const root=process.cwd();const absoluteReady=resolve(root,readyPath);const relativeReady=relative(root,absoluteReady).replaceAll("\\","/");
if(relativeReady.startsWith("..")||!/^runs\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9._-]+\/READY\.json$/.test(relativeReady)){console.error(JSON.stringify({ok:false,code:"E_READY_PATH",path:readyPath}));process.exit(2);}
const ready=JSON.parse(readFileSync(absoluteReady,"utf8")) as Ready;
const manifestPath=resolve(root,"episodes",ready.episodeId,"manifest.json");
const manifestValue:unknown=JSON.parse(readFileSync(manifestPath,"utf8"));
const validation=validateEpisode(manifestValue);
if(!validation.ok){console.error(JSON.stringify({ok:false,code:"E_READY_MANIFEST",issues:validation.issues},null,2));process.exit(2);}
const manifest=validation.value;const hash=sha256Canonical(manifest);const errors:string[]=[];
if(manifest.episodeId!==ready.episodeId)errors.push("episodeId mismatch");if(manifest.revision!==ready.revision)errors.push("revision mismatch");if(hash!==ready.manifestHash)errors.push("manifestHash mismatch");
if(errors.length){console.error(JSON.stringify({ok:false,code:"E_READY_HASH",errors,expected:ready.manifestHash,actual:hash},null,2));process.exit(2);}
console.log(JSON.stringify({ok:true,runId:ready.runId,episodeId:ready.episodeId,revision:ready.revision,manifestHash:hash,readyDirectory:dirname(relativeReady)}));
