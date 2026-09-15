import {readFileSync} from "node:fs";
import {dirname,relative,resolve} from "node:path";
import {sha256Canonical} from "../contracts/hash";
import {validateEpisode} from "../contracts/validate";

type Marker={runId:string;episodeId:string;revision:number;manifestHash:string};
type Approval=Marker & {approvedAt:string;note?:string};

const approvalPath=process.argv[2];
if(!approvalPath){
  console.error("usage: npm run check-approval -- runs/YYYY-MM-DD/<runId>/APPROVED.json");
  process.exit(2);
}

const root=process.cwd();
const absoluteApproval=resolve(root,approvalPath);
const relativeApproval=relative(root,absoluteApproval).replaceAll("\\","/");
if(relativeApproval.startsWith("..")||!/^runs\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9._-]+\/APPROVED\.json$/.test(relativeApproval)){
  console.error(JSON.stringify({ok:false,code:"E_APPROVAL_PATH",path:approvalPath}));
  process.exit(2);
}

const approval=JSON.parse(readFileSync(absoluteApproval,"utf8")) as Approval;
const readyPath=resolve(dirname(absoluteApproval),"READY.json");
let ready:Marker;
try{
  ready=JSON.parse(readFileSync(readyPath,"utf8")) as Marker;
}catch{
  console.error(JSON.stringify({ok:false,code:"E_APPROVAL_READY_MISSING",readyPath:relative(root,readyPath).replaceAll("\\","/")}));
  process.exit(2);
}

const manifestPath=resolve(root,"episodes",approval.episodeId,"manifest.json");
const manifestValue:unknown=JSON.parse(readFileSync(manifestPath,"utf8"));
const validation=validateEpisode(manifestValue);
if(!validation.ok){
  console.error(JSON.stringify({ok:false,code:"E_APPROVAL_MANIFEST",issues:validation.issues},null,2));
  process.exit(2);
}

const manifest=validation.value;
const hash=sha256Canonical(manifest);
const errors:string[]=[];
for(const field of ["runId","episodeId","revision","manifestHash"] as const){
  if(approval[field]!==ready[field]) errors.push(`${field} differs from READY.json`);
}
if(manifest.episodeId!==approval.episodeId) errors.push("episodeId mismatch");
if(manifest.revision!==approval.revision) errors.push("revision mismatch");
if(hash!==approval.manifestHash) errors.push("manifestHash mismatch");
if(!approval.approvedAt || Number.isNaN(Date.parse(approval.approvedAt))) errors.push("approvedAt must be an ISO date-time");

if(errors.length){
  console.error(JSON.stringify({ok:false,code:"E_APPROVAL_INVALID",errors,expectedHash:approval.manifestHash,actualHash:hash},null,2));
  process.exit(2);
}

console.log(JSON.stringify({ok:true,runId:approval.runId,episodeId:approval.episodeId,revision:approval.revision,manifestHash:hash,approvalDirectory:dirname(relativeApproval)}));
