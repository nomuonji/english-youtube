#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const [planArg="public/generated/v5-shot-plan.json",outDirArg="public/generated/v5-shot-images"]=process.argv.slice(2);
const plan=JSON.parse(await fs.readFile(planArg,"utf8"));
const outDir=path.resolve(outDirArg);
const cacheDir=path.resolve(process.env.V5_COMMONS_CACHE_DIR??".cache/v5-commons");
await fs.mkdir(outDir,{recursive:true});
await fs.mkdir(cacheDir,{recursive:true});
const fps=30;
const previewSeconds=Number(process.env.V5_PREVIEW_SECONDS??"36");
const maxAssets=Number(process.env.V5_MAX_SHOT_ASSETS??"12");
const shots=(plan.shots??[]).filter(s=>s.startFrame<previewSeconds*fps&&!["phrase","recap"].includes(s.kind)).slice(0,maxAssets);
const API="https://commons.wikimedia.org/w/api.php";
const UA="english-youtube-v5-shot-preview/1.4 (GitHub Actions; educational video builder)";
const cleanHtml=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowedLicense=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const keyFor=title=>crypto.createHash("sha1").update(title).digest("hex").slice(0,16);

const CURATED={
  "semiconductor wafer close up":[
    "File:Semiconductor Wafer of Microelectronics.jpg",
    "File:Micro-chips wafer.jpg",
    "File:Micro-chips wafer (83846).jpg",
  ],
  "data center server racks aisle":[
    "File:PDC server room.jpg",
    "File:Datacenter Server Racks (22370909788).jpg",
    "File:Server Room (22397102849).jpg",
    "File:A view of the server room at The National Archives.jpg",
    "File:SpinVFX Server Room.jpg",
  ],
  "server room racks aisle":[
    "File:Datacenter Server Racks (22370909788).jpg",
    "File:Server Room (22397102849).jpg",
    "File:139 Server Room 01.jpg",
  ],
  "electrical substation aerial":[
    "File:Electrical Substation Ayer MA Aerial.JPG",
    "File:Muurame electrical substation transformer.jpg",
    "File:Transformer at substation.jpg",
  ],
  "electrical substation control equipment":[
    "File:Muurame electrical substation transformer.jpg",
    "File:Transformer at substation.jpg",
    "File:Electrical Substation Ayer MA Aerial.JPG",
  ],
  "electrical switchyard high voltage":[
    "File:Transformer at substation.jpg",
    "File:Muurame electrical substation transformer.jpg",
  ],
  "high voltage transmission tower landscape":[
    "File:High-voltage overhead power lines.jpg",
    "File:High voltage transmission towers and lines.jpg",
    "File:Transmission towers of a high-voltage overhead powerlines File 01.jpg",
    "File:Transmission towers of a high-voltage overhead powerlines File 02.jpg",
  ],
  "high voltage electricity transmission towers":[
    "File:High voltage transmission towers and lines.jpg",
    "File:Transmission towers of a high-voltage overhead powerlines File 01.jpg",
    "File:Transmission towers of a high-voltage overhead powerlines File 02.jpg",
    "File:High-voltage overhead power lines.jpg",
  ],
  "high voltage power lines landscape":[
    "File:Transmission towers of a high-voltage overhead powerlines File 01.jpg",
    "File:Transmission towers of a high-voltage overhead powerlines File 02.jpg",
    "File:High voltage transmission towers and lines.jpg",
  ],
  "solar photovoltaic farm aerial":[
    "File:Solar Panel Farm.jpg",
    "File:Photovoltaic Panels at the Travers Solar Farm.jpg",
    "File:Photovoltaic Panels at a Solar Farm Near Vulcan, Alberta.jpg",
  ],
  "photovoltaic panels power station":[
    "File:Photovoltaic Panels at the Travers Solar Farm.jpg",
    "File:Solar Panel Farm.jpg",
  ],
  "stock exchange trading floor":[
    "File:Stock-exchange-trading-floor.jpg",
    "File:NY stock exchange traders floor LC-U9-10548-6.jpg",
    "File:Stockexchange.jpg",
  ],
  "stock market trading floor":[
    "File:NY stock exchange traders floor LC-U9-10548-6.jpg",
    "File:Stock-exchange-trading-floor.jpg",
    "File:Stockexchange.jpg",
  ],
  "financial market trading floor":[
    "File:Stock-exchange-trading-floor.jpg",
    "File:NY stock exchange traders floor LC-U9-10548-6.jpg",
  ],
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
  const metaPath=path.join(cacheDir,`${keyFor(title)}.json`);
  try{
    const cached=JSON.parse(await fs.readFile(metaPath,"utf8"));
    if(cached?.title===title&&cached?.info){infoCache.set(title,cached.info);return cached.info;}
  }catch{}
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"imageinfo",iiprop:"url|mime|size|extmetadata",iiurlwidth:"1600",titles:title}).toString();
  const data=await request(u);const page=Object.values(data.query?.pages??{})[0];const ii=page?.imageinfo?.[0];if(!ii)return null;
  const m=ii.extmetadata??{};
  const info={url:ii.thumburl??ii.url,mime:ii.mime,width:ii.thumbwidth??ii.width,height:ii.thumbheight??ii.height,size:ii.size,license:cleanHtml(m.LicenseShortName?.value),artist:cleanHtml(m.Artist?.value),credit:cleanHtml(m.Credit?.value),description:cleanHtml(m.ImageDescription?.value)};
  infoCache.set(title,info);
  await fs.writeFile(metaPath,JSON.stringify({title,info},null,2)+"\n");
  return info;
}
const badTitle=title=>/logo|icon|diagram|map|coat of arms|flag|symbol|screenshot|chart/i.test(title);
const usable=info=>{
  if(!info||!allowedLicense(info.license)||!["image/jpeg","image/png"].includes(info.mime))return false;
  if(Number(info.width||0)<900||Number(info.height||0)<500)return false;
  const ratio=Number(info.width)/Math.max(1,Number(info.height));
  return ratio>=1.18&&ratio<=2.7;
};
async function pick(query,usedTitles){
  for(const curatedTitle of CURATED[query]??[]){
    if(usedTitles.has(curatedTitle))continue;
    try{
      const info=await imageInfo(curatedTitle);
      if(usable(info))return {title:curatedTitle,info,curated:true};
    }catch{}
  }
  const titles=await searchTitles(query);
  for(const title of titles){
    if(usedTitles.has(title)||badTitle(title))continue;
    try{const info=await imageInfo(title);if(usable(info))return {title,info,curated:false};}catch{}
    await sleep(90);
  }
  return null;
}
const sourceFileFor=async selected=>{
  const ext=selected.info.mime==="image/png"?"png":"jpg";
  const file=path.join(cacheDir,`${keyFor(selected.title)}.${ext}`);
  try{const stat=await fs.stat(file);if(stat.size>0)return file;}catch{}
  const buf=await request(selected.info.url,{binary:true,attempts:5});
  if(buf.length>12_000_000)throw new Error(`asset too large: ${buf.length}`);
  await fs.writeFile(file,buf);return file;
};
const fallbackQueries=shot=>{
  const q=shot.searchQuery||"high voltage transmission tower landscape";
  const out=[q];
  if(/semiconductor|wafer|chip|gpu/i.test(q))out.push("microchip wafer manufacturing","computer processor hardware close up");
  else if(/data center|server/i.test(q))out.push("server room racks aisle","supercomputer data center interior","computer servers cooling aisle");
  else if(/substation|switchyard|transformer/i.test(q))out.push("electrical switchyard high voltage","power transformer substation","electric grid transformer station");
  else if(/transmission|power line|tower|pylon|grid/i.test(q))out.push("electricity pylons landscape","high voltage power lines landscape","electric power grid control room");
  else if(/solar|photovoltaic/i.test(q))out.push("photovoltaic panels power station","solar panels field aerial","renewable energy solar farm");
  else if(/stock|financial|trading|market|exchange/i.test(q))out.push("stock market trading floor","stock exchange building interior","financial district trading screens");
  else if(/power plant|generator|turbine/i.test(q))out.push("electric power station turbine hall","power generator turbine","electricity generating station interior");
  else if(/construction/i.test(q))out.push("power line construction","electrical infrastructure construction");
  out.push("high voltage transmission tower landscape","data center server racks aisle");
  return [...new Set(out)];
};

const usedTitles=new Set();
const generated=[];
let cacheMediaHits=0;
for(const shot of shots){
  try{
    let selected=null,usedQuery="";
    for(const query of fallbackQueries(shot)){
      selected=await pick(query,usedTitles);
      if(selected){usedQuery=query;break;}
    }
    if(!selected){
      console.warn(`[v5-shot-image] ${shot.id} skipped: no distinct licensed media found`);
      continue;
    }
    usedTitles.add(selected.title);
    const ext=selected.info.mime==="image/png"?"png":"jpg";
    const cachedPath=path.join(cacheDir,`${keyFor(selected.title)}.${ext}`);
    try{const stat=await fs.stat(cachedPath);if(stat.size>0)cacheMediaHits++;}catch{}
    const file=`${shot.id}.${ext}`;
    const sourceFile=await sourceFileFor(selected);
    await fs.copyFile(sourceFile,path.join(outDir,file));
    generated.push({shotId:shot.id,file,path:`generated/v5-shot-images/${file}`,kind:"image",provider:"wikimedia-commons",sourcePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(selected.title.replaceAll(" ","_"))}`,license:selected.info.license,artist:selected.info.artist,credit:selected.info.credit,query:usedQuery,title:selected.title,curated:selected.curated});
    await sleep(50);
  }catch(err){console.warn(`[v5-shot-image] ${shot.id} skipped: ${err instanceof Error?err.message:String(err)}`);}
}
await fs.writeFile(path.join(outDir,"manifest.json"),JSON.stringify({version:"1.4.0",episodeId:plan.episodeId,previewSeconds,generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,requested:shots.length,generated:generated.length,uniqueTitles:new Set(generated.map(x=>x.title)).size,cacheMediaHits,previewSeconds,assets:generated.map(x=>({shotId:x.shotId,query:x.query,title:x.title,curated:x.curated,license:x.license}))}));
