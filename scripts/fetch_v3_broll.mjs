#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const [specArg="episodes/2026-09-15-ai-power-project/v3.json",outArg="public/generated/v3/broll"] = process.argv.slice(2);
const spec=JSON.parse(await fs.readFile(specArg,"utf8"));
const outDir=path.resolve(outArg);
await fs.mkdir(outDir,{recursive:true});
const API="https://commons.wikimedia.org/w/api.php";
const UA="english-youtube-v3/1.0 (GitHub Actions; editorial explainer builder)";
const clean=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowed=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const json=async url=>{const r=await fetch(url,{headers:{"User-Agent":UA}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();};

const queries=[...new Set(spec.scenes.flatMap(scene=>{
  const v=scene.visual??{};
  return typeof v.query==="string"?[v.query]:[];
}))];

async function searchTitles(query){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",generator:"search",gsrnamespace:"6",gsrlimit:"14",gsrsearch:`${query} filetype:video`}).toString();
  const data=await json(u);
  return Object.values(data.query?.pages??{}).map(p=>p.title).filter(Boolean);
}
async function info(title){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"videoinfo|imageinfo",viprop:"url|mime|size|derivatives",iiprop:"extmetadata",titles:title}).toString();
  const data=await json(u);const page=Object.values(data.query?.pages??{})[0];
  const vi=page?.videoinfo?.[0];const m=page?.imageinfo?.[0]?.extmetadata??{};
  const meta={license:clean(m.LicenseShortName?.value),artist:clean(m.Artist?.value),credit:clean(m.Credit?.value)};
  if(!vi||!allowed(meta.license))return null;
  const derivatives=(vi.derivatives??[])
    .filter(d=>d.src&&/video\/(webm|mp4)/i.test(d.type??"")&&Number(d.height||0)>=360&&Number(d.height||0)<=720)
    .sort((a,b)=>Math.abs(Number(a.height||0)-480)-Math.abs(Number(b.height||0)-480));
  const d=derivatives.find(x=>Number(x.bandwidth||0)<3_500_000)??derivatives[0];
  if(d)return {url:d.src,type:d.type,meta};
  if(vi.url&&Number(vi.size||0)>0&&Number(vi.size)<18_000_000&&/video\/(webm|mp4)/i.test(vi.mime??""))return {url:vi.url,type:vi.mime,meta};
  return null;
}
async function download(url,file){
  const r=await fetch(url,{headers:{"User-Agent":UA}});if(!r.ok)throw new Error(`download ${r.status}`);
  const len=Number(r.headers.get("content-length")||0);if(len>20_000_000)throw new Error(`asset too large: ${len}`);
  const buf=Buffer.from(await r.arrayBuffer());if(buf.length>20_000_000)throw new Error(`asset too large: ${buf.length}`);await fs.writeFile(file,buf);
}

const generated=[];
for(let i=0;i<queries.length;i++){
  const query=queries[i];
  try{
    const titles=await searchTitles(query);let chosen=null,chosenTitle="";
    for(const title of titles){try{const x=await info(title);if(x){chosen=x;chosenTitle=title;break;}}catch{}}
    if(!chosen){console.warn(`[v3-broll] no licensed video for ${query}`);continue;}
    const ext=/mp4/i.test(chosen.type)?"mp4":"webm";
    const file=`broll-${String(i+1).padStart(2,"0")}.${ext}`;
    await download(chosen.url,path.join(outDir,file));
    generated.push({query,file,path:`generated/v3/broll/${file}`,sourcePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(chosenTitle.replaceAll(" ","_"))}`,license:chosen.meta.license,artist:chosen.meta.artist,credit:chosen.meta.credit});
    console.log(`[v3-broll] ${query} -> ${file}`);
  }catch(err){console.warn(`[v3-broll] ${query} skipped: ${err instanceof Error?err.message:String(err)}`);}
}
await fs.writeFile(path.join(outDir,"manifest.json"),JSON.stringify({version:"3.0.0",generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,queries:queries.length,assets:generated.length}));
