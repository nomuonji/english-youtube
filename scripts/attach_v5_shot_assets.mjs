#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [propsArg="public/generated/v5-render-props.no-assets.json",assetsArg="public/generated/v5-shot-images/manifest.json",outArg="public/generated/v5-render-props.json"]=process.argv.slice(2);
const props=JSON.parse(fs.readFileSync(propsArg,"utf8"));
let generated=[];
if(fs.existsSync(assetsArg))generated=JSON.parse(fs.readFileSync(assetsArg,"utf8")).generated??[];
const shotAssets=generated.map(item=>({
  shotId:item.shotId,
  path:item.path,
  kind:item.kind??"image",
  sourcePage:item.sourcePage,
  license:item.license,
  artist:item.artist,
  credit:item.credit,
  query:item.query,
}));
fs.mkdirSync(path.dirname(outArg),{recursive:true});
fs.writeFileSync(outArg,JSON.stringify({...props,shotAssets},null,2)+"\n");
console.log(JSON.stringify({ok:true,assets:shotAssets.length,output:outArg}));
