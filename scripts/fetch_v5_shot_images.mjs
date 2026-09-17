#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const [planArg="public/generated/v5-shot-plan.json",outDirArg="public/generated/v5-shot-images"]=process.argv.slice(2);
const plan=JSON.parse(await fs.readFile(planArg,"utf8"));
const outDir=path.resolve(outDirArg);
const sourceDir=path.join(outDir,".sources");
await fs.mkdir(outDir,{recursive:true});
await fs.mkdir(sourceDir,{recursive:true});
const fps=30;
const previewSeconds=Number(process.env.V5_PREVIEW_SECONDS??"36");
const maxAssets=Number(process.env.V5_MAX_SHOT_ASSETS??"12");
const shots=(plan.shots??[]).filter(s=>s.startFrame<previewSeconds*fps&&!["phrase","recap"].includes(s.kind)).slice(0,maxAssets);
const API="https://commons.wikimedia.org/w/api.php";
const UA="english-youtube-v5-shot-preview/1.1 (GitHub Actions; educational video builder)";
const cleanHtml=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowedLicense=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Reuse titles already editorially reviewed for the AI/power topic before
// falling back to loose search. This avoids both semantic misses and dozens of
// Commons API requests during a 36-second design loop.
const CURATED={
  "semiconductor chip":"File:Semiconductor Wafer of Microelectronics.jpg",
  "data center server room":"File:PDC server room.jpg",
  "high voltage power lines":"File:High-voltage overhead power lines.jpg",
  "solar farm electricity":"File:Solar Panel Farm.jpg",
  "electricity substation":"File:Electrical Substation Ayer MA Aerial.JPG",
};

async function request(url,{binary=false,attempts=5}={}){
  let lastError;
  for(let attempt=0;attempt<attempts;attempt++){
    const r=await fetch(url,{headers:{"User-Agent":UA}});
    if(r.ok)return binary?Buffer.from(await r.arrayBuffer()):r.json();
    lastError=new Error(`${r.status} ${r.statusText}`);
    if(r.status!==429&&r.status<500)throw lastError;
    await sleep(700*Math.pow(2,attempt));
  }
  throw lastError??new Error("request failed");
}

async function searchTitles(query){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",generator:"search",gsrnamespace:"6",gsrlimit:"12",gsrsearch:`${query} filetype:bitmap`}).toString();
  const data=await request(u);
  return Object.values(data.query?.pages??{}).map(p=>p.title).filter(Boolean);
}
const infoCache=new Map();
async function imageInfo(title){
  if(infoCache.has(title))return infoCache.get(title);
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"imageinfo",iiprop:"url|mime|size|extmetadata",iiurlwidth:"1600",titles:title}).toString();
  const data=await request(u);const page=Object.values(data.query?.pages??{})[0];const ii=page?.imageinfo?.[0];if(!ii)return null;
  const m=ii.extmetadata??{};
  const info={url:ii.thumburl??ii.url,mime:ii.mime,width:ii.thumbwidth??ii.width,height:ii.thumbheight??ii.height,size:ii.size,license:cleanHtml(m.LicenseShortName?.value),artist:cleanHtml(m.Artist?.value),credit:cleanHtml(m.Credit?.value),description:cleanHtml(m.ImageDescription?.value)};
  infoCache.set(title,info);return info;
}
const badTitle=title=>/logo|icon|diagram|map|coat of arms|flag|symbol|screenshot|chart/i.test(title);
const usable=info=>{
  if(!info||!allowedLicense(info.license)||!["image/jpeg","image/png"].includes(info.mime))return false;
  if(Number(info.width||0)<900||Number(info.height||0)<500)return false;
  const ratio=Number(info.width)/Math.max(1,Number(info.height));
  return ratio>=1.18&&ratio<=2.7;
};
async function pick(query){
  const curatedTitle=CURATED[query];
  if(curatedTitle){
    const info=await imageInfo(curatedTitle);
    if(usable(info))return {title:curatedTitle,info,curated:true};
  }
  const titles=await searchTitles(query);
  for(const title of titles){
    if(badTitle(title))continue;
    try{const info=await imageInfo(title);if(usable(info))return {title,info,curated:false};}catch{}
    await sleep(120);
  }
  return null;
}
const sourceFileFor=async selected=>{
  const ext=selected.info.mime==="image/png"?"png":"jpg";
  const key=crypto.createHash("sha1").update(selected.title).digest("hex").slice(0,12);
  const file=path.join(sourceDir,`${key}.${ext}`);
  try{await fs.access(file);return file;}catch{}
  const buf=await request(selected.info.url,{binary:true,attempts:5});
  if(buf.length>12_000_000)throw new Error(`asset too large: ${buf.length}`);
  await fs.writeFile(file,buf);return file;
};
const fallbackQueries=shot=>{
  const q=shot.searchQuery||"high voltage power lines";
  if(CURATED[q])return [q];
  if(/semiconductor|chip|gpu/i.test(q))return ["semiconductor chip",q];
  if(/data center|server/i.test(q))return ["data center server room",q];
  if(/substation/i.test(q))return ["electricity substation",q];
  if(/transmission|power line|grid/i.test(q))return ["high voltage power lines",q];
  if(/solar|generation|power plant/i.test(q))return ["solar farm electricity",q];
  return [q,"data center server room","high voltage power lines"];
};

const generated=[];
for(const shot of shots){
  try{
    let selected=null,usedQuery="";
    for(const query of fallbackQueries(shot)){
      selected=await pick(query);
      if(selected){usedQuery=query;break;}
    }
    if(!selected)continue;
    const ext=selected.info.mime==="image/png"?"png":"jpg";
    const file=`${shot.id}.${ext}`;
    const sourceFile=await sourceFileFor(selected);
    await fs.copyFile(sourceFile,path.join(outDir,file));
    generated.push({shotId:shot.id,file,path:`generated/v5-shot-images/${file}`,kind:"image",provider:"wikimedia-commons",sourcePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(selected.title.replaceAll(" ","_"))}`,license:selected.info.license,artist:selected.info.artist,credit:selected.info.credit,query:usedQuery,title:selected.title,curated:selected.curated});
    await sleep(140);
  }catch(err){console.warn(`[v5-shot-image] ${shot.id} skipped: ${err instanceof Error?err.message:String(err)}`);}
}
await fs.rm(sourceDir,{recursive:true,force:true});
await fs.writeFile(path.join(outDir,"manifest.json"),JSON.stringify({version:"1.1.0",episodeId:plan.episodeId,previewSeconds,generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,requested:shots.length,generated:generated.length,previewSeconds,assets:generated.map(x=>({shotId:x.shotId,query:x.query,title:x.title,curated:x.curated,license:x.license}))}));
