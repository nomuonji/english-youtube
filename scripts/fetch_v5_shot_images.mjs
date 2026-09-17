#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const [planArg="public/generated/v5-shot-plan.json",outDirArg="public/generated/v5-shot-images"]=process.argv.slice(2);
const plan=JSON.parse(await fs.readFile(planArg,"utf8"));
const outDir=path.resolve(outDirArg);
await fs.mkdir(outDir,{recursive:true});
const fps=30;
const previewSeconds=Number(process.env.V5_PREVIEW_SECONDS??"42");
const maxAssets=Number(process.env.V5_MAX_SHOT_ASSETS??"12");
const shots=(plan.shots??[]).filter(s=>s.startFrame<previewSeconds*fps&&!["phrase","recap"].includes(s.kind)).slice(0,maxAssets);
const API="https://commons.wikimedia.org/w/api.php";
const cleanHtml=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowedLicense=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const json=async url=>{const r=await fetch(url,{headers:{"User-Agent":"english-youtube-v5-shot-preview/1.0 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();};

async function searchTitles(query){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",generator:"search",gsrnamespace:"6",gsrlimit:"18",gsrsearch:`${query} filetype:bitmap`}).toString();
  const data=await json(u);
  return Object.values(data.query?.pages??{}).map(p=>p.title).filter(Boolean);
}
async function imageInfo(title){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"imageinfo",iiprop:"url|mime|size|extmetadata",iiurlwidth:"1600",titles:title}).toString();
  const data=await json(u);const page=Object.values(data.query?.pages??{})[0];const ii=page?.imageinfo?.[0];if(!ii)return null;
  const m=ii.extmetadata??{};
  return {url:ii.thumburl??ii.url,mime:ii.mime,width:ii.thumbwidth??ii.width,height:ii.thumbheight??ii.height,size:ii.size,license:cleanHtml(m.LicenseShortName?.value),artist:cleanHtml(m.Artist?.value),credit:cleanHtml(m.Credit?.value),description:cleanHtml(m.ImageDescription?.value)};
}
const badTitle=title=>/logo|icon|diagram|map|coat of arms|flag|symbol|screenshot|chart/i.test(title);
async function pick(query,used){
  const titles=await searchTitles(query);
  for(const title of titles){
    if(used.has(title)||badTitle(title))continue;
    try{
      const info=await imageInfo(title);
      if(!info||!allowedLicense(info.license)||!["image/jpeg","image/png"].includes(info.mime))continue;
      if(Number(info.width||0)<1000||Number(info.height||0)<560)continue;
      const ratio=Number(info.width)/Math.max(1,Number(info.height));
      if(ratio<1.25||ratio>2.5)continue;
      return {title,info};
    }catch{}
  }
  return null;
}
async function download(url,file){
  const r=await fetch(url,{headers:{"User-Agent":"english-youtube-v5-shot-preview/1.0 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`download ${r.status}`);
  const len=Number(r.headers.get("content-length")||0);if(len>12_000_000)throw new Error(`asset too large: ${len}`);
  const buf=Buffer.from(await r.arrayBuffer());if(buf.length>12_000_000)throw new Error(`asset too large: ${buf.length}`);await fs.writeFile(file,buf);
}
const fallbackQueries=shot=>{
  const q=shot.searchQuery||"technology infrastructure electricity";
  if(/semiconductor|chip|gpu/i.test(q))return [q,"semiconductor wafer close up","computer server hardware"];
  if(/data center|server/i.test(q))return [q,"data center server room","server racks computing"];
  if(/substation|transmission|power line|grid/i.test(q))return [q,"high voltage power lines","electrical substation"];
  if(/finance|stock|investment/i.test(q))return [q,"stock exchange trading floor","financial district technology"];
  return [q,"electricity infrastructure","data center electricity"];
};

const used=new Set();const generated=[];
for(const shot of shots){
  try{
    let selected=null,usedQuery="";
    for(const query of fallbackQueries(shot)){
      selected=await pick(query,used);
      if(selected){usedQuery=query;break;}
    }
    if(!selected)continue;
    used.add(selected.title);
    const ext=selected.info.mime==="image/png"?"png":"jpg";
    const file=`${shot.id}.${ext}`;
    await download(selected.info.url,path.join(outDir,file));
    generated.push({shotId:shot.id,file,path:`generated/v5-shot-images/${file}`,kind:"image",provider:"wikimedia-commons",sourcePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(selected.title.replaceAll(" ","_"))}`,license:selected.info.license,artist:selected.info.artist,credit:selected.info.credit,query:usedQuery});
  }catch(err){console.warn(`[v5-shot-image] ${shot.id} skipped: ${err instanceof Error?err.message:String(err)}`);}
}
await fs.writeFile(path.join(outDir,"manifest.json"),JSON.stringify({version:"1.0.0",episodeId:plan.episodeId,previewSeconds,generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,requested:shots.length,generated:generated.length,previewSeconds,assets:generated.map(x=>({shotId:x.shotId,query:x.query,license:x.license}))}));
