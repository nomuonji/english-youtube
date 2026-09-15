#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const [manifestArg="fixtures/v2.1-demo.json",outDirArg="public/generated/broll"] = process.argv.slice(2);
const manifest=JSON.parse(await fs.readFile(manifestArg,"utf8"));
const outDir=path.resolve(outDirArg);
await fs.mkdir(outDir,{recursive:true});
const API="https://commons.wikimedia.org/w/api.php";
const beats=["setup","mechanism","complication","answer"];
const firstScene=new Map();
for(const scene of manifest.scenes){if(scene.role==="story"&&scene.beat&&!firstScene.has(scene.beat))firstScene.set(scene.beat,scene);}
const qText=(manifest.centralQuestion??"").toLowerCase();
const energy=qText.includes("power")||qText.includes("energy")||qText.includes("data center");
const queries=energy?{
  setup:"data center server room",
  mechanism:"electricity power lines grid",
  complication:"electricity transmission power grid",
  answer:"power plant electricity infrastructure"
}:{
  setup:`${manifest.category} technology`,mechanism:`${manifest.category} infrastructure`,complication:`${manifest.category} system`,answer:`${manifest.category} future`
};
const cleanHtml=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowedLicense=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const json=async url=>{const r=await fetch(url,{headers:{"User-Agent":"english-youtube-review/1.0 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();};

async function searchTitles(query){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",generator:"search",gsrnamespace:"6",gsrlimit:"10",gsrsearch:`${query} filetype:video`}).toString();
  const data=await json(u);
  return Object.values(data.query?.pages??{}).map(p=>p.title).filter(Boolean);
}
async function videoInfo(title){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"videoinfo",viprop:"url|mime|size|derivatives",titles:title}).toString();
  const data=await json(u);const page=Object.values(data.query?.pages??{})[0];return page?.videoinfo?.[0]??null;
}
async function metadata(title){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"imageinfo",iiprop:"extmetadata",titles:title}).toString();
  const data=await json(u);const page=Object.values(data.query?.pages??{})[0];const m=page?.imageinfo?.[0]?.extmetadata??{};
  return {license:cleanHtml(m.LicenseShortName?.value),artist:cleanHtml(m.Artist?.value),credit:cleanHtml(m.Credit?.value),description:cleanHtml(m.ImageDescription?.value)};
}
async function pick(title){
  const [vi,meta]=await Promise.all([videoInfo(title),metadata(title)]);
  if(!vi||!allowedLicense(meta.license))return null;
  const ds=(vi.derivatives??[]).filter(d=>d.src&&/video\/(webm|mp4)/i.test(d.type??"")&&Number(d.height||0)>=360&&Number(d.height||0)<=720).sort((a,b)=>Number(b.height||0)-Number(a.height||0));
  const d=ds.find(x=>Number(x.bandwidth||0)<6_000_000)??ds[0];
  if(d)return {url:d.src,type:d.type,meta};
  if(vi.url&&Number(vi.size||0)>0&&Number(vi.size)<25_000_000&&/video\/(webm|mp4)/i.test(vi.mime??""))return {url:vi.url,type:vi.mime,meta};
  return null;
}
async function download(url,file){
  const r=await fetch(url,{headers:{"User-Agent":"english-youtube-review/1.0 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`download ${r.status}`);
  const len=Number(r.headers.get("content-length")||0);if(len>30_000_000)throw new Error(`asset too large: ${len}`);
  const buf=Buffer.from(await r.arrayBuffer());if(buf.length>30_000_000)throw new Error(`asset too large: ${buf.length}`);await fs.writeFile(file,buf);
}

const generated=[];
for(const beat of beats){
  const scene=firstScene.get(beat);if(!scene)continue;
  try{
    const titles=await searchTitles(queries[beat]);
    let selected=null,selectedTitle="";
    for(const title of titles){try{const p=await pick(title);if(p){selected=p;selectedTitle=title;break;}}catch{}}
    if(!selected)continue;
    const ext=/mp4/i.test(selected.type)?"mp4":"webm";
    const file=`${beat}.${ext}`;await download(selected.url,path.join(outDir,file));
    generated.push({sceneId:scene.id,beat,file,path:`generated/broll/${file}`,sourcePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(selectedTitle.replaceAll(" ","_"))}`,license:selected.meta.license,artist:selected.meta.artist,credit:selected.meta.credit,query:queries[beat]});
  }catch(err){console.warn(`[broll] ${beat} skipped: ${err instanceof Error?err.message:String(err)}`);}
}
await fs.writeFile(path.join(outDir,"manifest.json"),JSON.stringify({generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,brollAssets:generated.length,assets:generated.map(x=>({beat:x.beat,file:x.file,license:x.license}))}));
