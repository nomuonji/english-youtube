#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import {spawnSync} from "node:child_process";

const [specArg="episodes/2026-09-15-ai-power-project/v3.json",outArg="public/generated/v3/broll"] = process.argv.slice(2);
const spec=JSON.parse(await fs.readFile(specArg,"utf8"));
const outDir=path.resolve(outArg);
await fs.mkdir(outDir,{recursive:true});
const API="https://commons.wikimedia.org/w/api.php";
const UA="english-youtube-v3/1.1 (GitHub Actions; editorial explainer builder)";
const clean=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const allowed=s=>/public domain|cc0|cc by(?:-|\s)|cc-by/i.test(s??"");
const json=async url=>{const r=await fetch(url,{headers:{"User-Agent":UA}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();};
const download=async(url,file,max=18_000_000)=>{const r=await fetch(url,{headers:{"User-Agent":UA}});if(!r.ok)throw new Error(`download ${r.status}`);const len=Number(r.headers.get("content-length")||0);if(len>max)throw new Error(`asset too large: ${len}`);const buf=Buffer.from(await r.arrayBuffer());if(buf.length>max)throw new Error(`asset too large: ${buf.length}`);await fs.writeFile(file,buf);};

// Curated titles are intentional. A loose Commons search previously matched
// "data center server room" to a NASA satellite relay video, which made the
// review artifact factually/visually wrong. These titles are known real-world
// infrastructure media and should only change through editorial review.
const CATALOG={
  "data center server room":{kind:"image",title:"File:PDC server room.jpg"},
  "high voltage power lines":{kind:"image",title:"File:High-voltage overhead power lines.jpg"},
  "solar farm electricity":{kind:"image",title:"File:Solar Panel Farm.jpg"},
  "power plant electricity infrastructure":{kind:"video",title:"File:Elektrárna Poděbrady, video (02).ogv"},
  "electricity substation":{kind:"image",title:"File:Electrical Substation Ayer MA Aerial.JPG"},
  "semiconductor chip":{kind:"image",title:"File:Semiconductor Wafer of Microelectronics.jpg"},
};

const queries=[...new Set(spec.scenes.flatMap(scene=>typeof scene.visual?.query==="string"?[scene.visual.query]:[]))];
const missingCatalog=queries.filter(q=>!CATALOG[q]);
if(missingCatalog.length)throw new Error(`uncurated v3 media queries: ${missingCatalog.join(", ")}`);

async function metadata(title){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"imageinfo",iiprop:"url|mime|size|extmetadata",iiurlwidth:"1920",titles:title}).toString();
  const data=await json(u);const page=Object.values(data.query?.pages??{})[0];const ii=page?.imageinfo?.[0];if(!ii)throw new Error(`missing imageinfo for ${title}`);const m=ii.extmetadata??{};
  return {url:ii.thumburl??ii.url,mime:ii.mime,width:ii.thumbwidth??ii.width,height:ii.thumbheight??ii.height,size:ii.size,license:clean(m.LicenseShortName?.value),artist:clean(m.Artist?.value),credit:clean(m.Credit?.value),description:clean(m.ImageDescription?.value)};
}
async function videoInfo(title){
  const u=new URL(API);u.search=new URLSearchParams({action:"query",format:"json",prop:"videoinfo|imageinfo",viprop:"url|mime|size|derivatives",iiprop:"extmetadata",titles:title}).toString();
  const data=await json(u);const page=Object.values(data.query?.pages??{})[0];const vi=page?.videoinfo?.[0];const m=page?.imageinfo?.[0]?.extmetadata??{};if(!vi)throw new Error(`missing videoinfo for ${title}`);
  const meta={license:clean(m.LicenseShortName?.value),artist:clean(m.Artist?.value),credit:clean(m.Credit?.value),description:clean(m.ImageDescription?.value)};
  const ds=(vi.derivatives??[]).filter(d=>d.src&&/video\/(webm|mp4)/i.test(d.type??"")&&Number(d.height||0)>=360&&Number(d.height||0)<=720).sort((a,b)=>Math.abs(Number(a.height||0)-480)-Math.abs(Number(b.height||0)-480));
  const d=ds.find(x=>Number(x.bandwidth||0)<3_500_000)??ds[0];
  if(d)return {url:d.src,mime:d.type,meta};
  return {url:vi.url,mime:vi.mime,meta};
}
function motionFromStill(input,output,index){
  const zoom=index%2===0?"min(zoom+0.0009,1.08)":"if(lte(zoom,1.0),1.08,max(1.0,zoom-0.0008))";
  const vf=`scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)+sin(on/35)*12':y='ih/2-(ih/zoom/2)+cos(on/45)*8':d=240:s=1920x1080:fps=30,format=yuv420p`;
  const r=spawnSync("ffmpeg",["-hide_banner","-loglevel","error","-y","-loop","1","-i",input,"-vf",vf,"-t","8","-an","-c:v","libx264","-preset","veryfast","-crf","21","-movflags","+faststart",output],{stdio:"inherit"});
  if(r.status!==0)throw new Error(`ffmpeg still motion failed (${r.status})`);
}
function normalizeVideo(input,output){
  const r=spawnSync("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",input,"-t","8","-vf","scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p","-an","-c:v","libx264","-preset","veryfast","-crf","21","-movflags","+faststart",output],{stdio:"inherit"});
  if(r.status!==0)throw new Error(`ffmpeg video normalize failed (${r.status})`);
}

const generated=[];
for(let i=0;i<queries.length;i++){
  const query=queries[i];const entry=CATALOG[query];
  const page=`https://commons.wikimedia.org/wiki/${encodeURIComponent(entry.title.replaceAll(" ","_"))}`;
  try{
    const output=`broll-${String(i+1).padStart(2,"0")}.mp4`;const outputPath=path.join(outDir,output);
    if(entry.kind==="image"){
      const info=await metadata(entry.title);if(!allowed(info.license))throw new Error(`license rejected: ${info.license}`);if(!/image\/(jpeg|png)/i.test(info.mime??""))throw new Error(`unsupported image ${info.mime}`);
      const ext=/png/i.test(info.mime)?"png":"jpg";const still=path.join(outDir,`source-${String(i+1).padStart(2,"0")}.${ext}`);
      await download(info.url,still,14_000_000);motionFromStill(still,outputPath,i);await fs.rm(still,{force:true});
      generated.push({query,kind:"motion-still",file:output,path:`generated/v3/broll/${output}`,title:entry.title,sourcePage:page,license:info.license,artist:info.artist,credit:info.credit});
    }else{
      const info=await videoInfo(entry.title);if(!allowed(info.meta.license))throw new Error(`license rejected: ${info.meta.license}`);
      const raw=path.join(outDir,`source-${String(i+1).padStart(2,"0")}.video`);await download(info.url,raw,24_000_000);normalizeVideo(raw,outputPath);await fs.rm(raw,{force:true});
      generated.push({query,kind:"video",file:output,path:`generated/v3/broll/${output}`,title:entry.title,sourcePage:page,license:info.meta.license,artist:info.meta.artist,credit:info.meta.credit});
    }
    console.log(`[v3-media] ${query} -> ${entry.title} -> ${output}`);
  }catch(err){throw new Error(`[v3-media] ${query}: ${err instanceof Error?err.message:String(err)}`);}
}
if(generated.length!==queries.length)throw new Error(`v3 media coverage incomplete: ${generated.length}/${queries.length}`);
await fs.writeFile(path.join(outDir,"manifest.json"),JSON.stringify({version:"3.1.0",generated},null,2)+"\n");
console.log(JSON.stringify({ok:true,queries:queries.length,assets:generated.length,titles:generated.map(x=>x.title)}));
