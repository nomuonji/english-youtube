#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const briefsPath=process.argv[2]??"public/generated/image-briefs.json";
const outputDir=process.argv[3]??"public/generated/images";
const accountId=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;

if(!fs.existsSync(briefsPath)){
  console.log(JSON.stringify({ok:true,skipped:true,reason:"briefs_missing",briefsPath}));
  process.exit(0);
}

const payload=JSON.parse(fs.readFileSync(briefsPath,"utf8"));
fs.mkdirSync(outputDir,{recursive:true});
const generated=[];
let cacheHits=0;
let generatedNow=0;
for(const brief of payload.briefs??[]){
  const file=`${brief.sceneId}.jpg`;
  const filePath=path.join(outputDir,file);
  if(fs.existsSync(filePath)&&fs.statSync(filePath).size>100){
    cacheHits++;
    generated.push({sceneId:brief.sceneId,purpose:brief.purpose,file});
    continue;
  }
  if(!accountId||!token)continue;
  const endpoint=`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
  const response=await fetch(endpoint,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({prompt:brief.prompt,seed:brief.seed,steps:4})});
  if(!response.ok)throw new Error(`Cloudflare image generation failed for ${brief.sceneId}: ${response.status} ${await response.text()}`);
  const json=await response.json();
  const image=json?.result?.image??json?.image;
  if(typeof image!=="string"||image.length<100)throw new Error(`Cloudflare returned no image for ${brief.sceneId}`);
  fs.writeFileSync(filePath,Buffer.from(image,"base64"));
  generatedNow++;
  generated.push({sceneId:brief.sceneId,purpose:brief.purpose,file});
}
if(generated.length){fs.writeFileSync(path.join(outputDir,"manifest.json"),JSON.stringify({version:"1.0.0",episodeId:payload.episodeId,generated},null,2)+"\n");}
const missing=(payload.briefs??[]).length-generated.length;
console.log(JSON.stringify({ok:true,skipped:missing>0&&!accountId&&!token,reason:missing>0&&!accountId&&!token?"cloudflare_credentials_missing":undefined,count:generated.length,cacheHits,generatedNow,missing,outputDir,scenes:generated.map((x)=>x.sceneId)}));
