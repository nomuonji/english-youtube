#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

const [briefsArg="public/generated/image-briefs.json",outDirArg="public/generated/images"] = process.argv.slice(2);
const briefsPayload=JSON.parse(await fs.readFile(briefsArg,"utf8"));
const outDir=path.resolve(outDirArg);
await fs.mkdir(outDir,{recursive:true});
const API="https://commons.wikimedia.org/w/api.php";
const cleanHtml=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowedLicense=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const json=async url=>{const r=await fetch(url,{headers:{"User-Agent":"english-youtube-review/1.0 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();};

async function searchTitles(query){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",generator:"search",gsrnamespace:"6",gsrlimit:"14",gsrsearch:`${query} filetype:bitmap`}).toString();
  const data=await json(u);
  return Object.values(data.query?.pages??{}).map(p=>p.title).filter(Boolean);
}
async function imageInfo(title){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"imageinfo",iiprop:"url|mime|size|extmetadata",iiurlwidth:"1600",titles:title}).toString();
  const data=await json(u);const page=Object.values(data.query?.pages??{})[0];const ii=page?.imageinfo?.[0];if(!ii)return null;
  const m=ii.extmetadata??{};
  return {url:ii.thumburl??ii.url,mime:ii.mime,width:ii.thumbwidth??ii.width,height:ii.thumbheight??ii.height,size:ii.size,license:cleanHtml(m.LicenseShortName?.value),artist:cleanHtml(m.Artist?.value),credit:cleanHtml(m.Credit?.value),description:cleanHtml(m.ImageDescription?.value)};
}
async function pick(query){
  const titles=await searchTitles(query);
  for(const title of titles){
    try{
      const info=await imageInfo(title);
      if(!info||!allowedLicense(info.license)||info.mime!=="image/jpeg")continue;
      if(Number(info.width||0)<900||Number(info.height||0)<500)continue;
      return {title,info};
    }catch{}
  }
  return null;
}
async function download(url,file){
  const r=await fetch(url,{headers:{"User-Agent":"english-youtube-review/1.0 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`download ${r.status}`);
  const len=Number(r.headers.get("content-length")||0);if(len>12_000_000)throw new Error(`asset too large: ${len}`);
  const buf=Buffer.from(await r.arrayBuffer());if(buf.length>12_000_000)throw new Error(`asset too large: ${buf.length}`);await fs.writeFile(file,buf);
}

const manifestPath=path.join(outDir,"manifest.json");
let generated=[];
if(fssync.existsSync(manifestPath)){
  try{generated=JSON.parse(await fs.readFile(manifestPath,"utf8")).generated??[];}catch{}
}
const have=new Set(generated.map(x=>x.sceneId));
let added=0;
for(const brief of briefsPayload.briefs??[]){
  if(have.has(brief.sceneId))continue;
  try{
    const query=brief.searchQuery||"technology infrastructure";
    const selected=await pick(query);
    if(!selected)continue;
    const file=`${brief.sceneId}.jpg`;
    await download(selected.info.url,path.join(outDir,file));
    generated.push({sceneId:brief.sceneId,purpose:brief.purpose,file,provider:"wikimedia-commons",sourcePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(selected.title.replaceAll(" ","_"))}`,license:selected.info.license,artist:selected.info.artist,credit:selected.info.credit,query});
    have.add(brief.sceneId);added++;
  }catch(err){console.warn(`[commons-image] ${brief.sceneId} skipped: ${err instanceof Error?err.message:String(err)}`);}
}
if(generated.length)await fs.writeFile(manifestPath,JSON.stringify({version:"1.1.0",episodeId:briefsPayload.episodeId,generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,count:generated.length,added,missing:Math.max(0,(briefsPayload.briefs??[]).length-generated.length),assets:generated.map(x=>({sceneId:x.sceneId,provider:x.provider??"cloudflare",license:x.license??"generated"}))}));
