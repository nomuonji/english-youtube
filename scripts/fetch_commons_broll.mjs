#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const [manifestArg="fixtures/v2.1-demo.json",outDirArg="public/generated/broll"] = process.argv.slice(2);
const manifest=JSON.parse(await fs.readFile(manifestArg,"utf8"));
const outDir=path.resolve(outDirArg);
await fs.mkdir(outDir,{recursive:true});
const API="https://commons.wikimedia.org/w/api.php";
const cleanHtml=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowedLicense=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const json=async url=>{const r=await fetch(url,{headers:{"User-Agent":"english-youtube-review/1.1 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();};
const sceneText=scene=>scene.utteranceIds.map(id=>manifest.utterances.find(u=>u.id===id)?.text??"").join(" ").toLowerCase();

const queryFor=scene=>{
  const t=sceneText(scene);
  if(/server|data cent|computing|cloud/.test(t))return "data center server racks computing";
  if(/substation/.test(t))return "electric substation high voltage";
  if(/transmission|grid connection|power line|electric grid/.test(t))return "electricity transmission grid power lines";
  if(/power plant|power generation|nuclear|renewable|solar|wind/.test(t))return "electric power generation power plant";
  if(/chip|gpu|semiconductor/.test(t))return "computer GPU semiconductor servers";
  if(/construction|build|permit|years/.test(t))return "electric infrastructure construction transmission";
  if(/ipo|invest|financ|capital|shares/.test(t))return "stock exchange finance investment technology";
  if(/factory|industrial|manufactur/.test(t))return "industrial electricity factory infrastructure";
  if(scene.role==="hook")return "data center server room electricity";
  if(scene.beat==="mechanism")return "electricity infrastructure grid";
  if(scene.beat==="complication")return "electricity transmission construction";
  if(scene.beat==="answer")return "power plant electricity infrastructure";
  return `${String(manifest.category??"technology").replaceAll("_"," ")} technology infrastructure`;
};

const story=manifest.scenes.filter(s=>s.role==="story");
const selectedScenes=[];
const hook=manifest.scenes.find(s=>s.role==="hook");
if(hook)selectedScenes.push(hook);
for(const beat of ["setup","mechanism","complication","answer"]){
  const scenes=story.filter(s=>s.beat===beat);
  if(scenes[0])selectedScenes.push(scenes[0]);
}
for(const beat of ["mechanism","complication"]){
  const scenes=story.filter(s=>s.beat===beat);
  if(scenes[1])selectedScenes.push(scenes[1]);
}

async function searchTitles(query){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",generator:"search",gsrnamespace:"6",gsrlimit:"12",gsrsearch:`${query} filetype:video`}).toString();
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
  const d=ds.find(x=>Number(x.bandwidth||0)<4_500_000)??ds[0];
  if(d)return {url:d.src,type:d.type,meta};
  if(vi.url&&Number(vi.size||0)>0&&Number(vi.size)<18_000_000&&/video\/(webm|mp4)/i.test(vi.mime??""))return {url:vi.url,type:vi.mime,meta};
  return null;
}
async function download(url,file){
  const r=await fetch(url,{headers:{"User-Agent":"english-youtube-review/1.1 (GitHub Actions; educational video builder)"}});if(!r.ok)throw new Error(`download ${r.status}`);
  const len=Number(r.headers.get("content-length")||0);if(len>22_000_000)throw new Error(`asset too large: ${len}`);
  const buf=Buffer.from(await r.arrayBuffer());if(buf.length>22_000_000)throw new Error(`asset too large: ${buf.length}`);await fs.writeFile(file,buf);
}

const generated=[];
const usedTitles=new Set();
for(const scene of selectedScenes){
  const query=queryFor(scene);
  try{
    const titles=await searchTitles(query);
    let selected=null,selectedTitle="";
    for(const title of titles){
      if(usedTitles.has(title))continue;
      try{const p=await pick(title);if(p){selected=p;selectedTitle=title;break;}}catch{}
    }
    if(!selected)continue;
    usedTitles.add(selectedTitle);
    const ext=/mp4/i.test(selected.type)?"mp4":"webm";
    const safe=String(scene.id).replace(/[^A-Za-z0-9._-]/g,"-");
    const file=`${safe}.${ext}`;
    await download(selected.url,path.join(outDir,file));
    generated.push({sceneId:scene.id,beat:scene.role==="hook"?"hook":scene.beat,file,path:`generated/broll/${file}`,sourcePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(selectedTitle.replaceAll(" ","_"))}`,license:selected.meta.license,artist:selected.meta.artist,credit:selected.meta.credit,query});
  }catch(err){console.warn(`[broll] ${scene.id} skipped: ${err instanceof Error?err.message:String(err)}`);}
}
await fs.writeFile(path.join(outDir,"manifest.json"),JSON.stringify({version:"2.0.0",generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,brollAssets:generated.length,assets:generated.map(x=>({sceneId:x.sceneId,beat:x.beat,file:x.file,license:x.license,query:x.query}))}));
