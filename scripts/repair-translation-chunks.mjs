import fs from 'node:fs';

const path='episodes/2026-09-15-ai-power-project/manifest.json';
const manifest=JSON.parse(fs.readFileSync(path,'utf8'));
const targetIds=new Set(['u-c2-2','u-p2-2']);

const splitExact=(text,max=48)=>{
  const chars=Array.from(text);
  const chunks=[];
  for(let i=0;i<chars.length;i+=max){
    chunks.push(chars.slice(i,i+max).join(''));
  }
  return chunks;
};

for(const utterance of manifest.utterances){
  if(targetIds.has(utterance.id)){
    utterance.translationJaChunks=splitExact(utterance.translationJa);
  }
}

for(const id of targetIds){
  const utterance=manifest.utterances.find((item)=>item.id===id);
  if(!utterance) throw new Error(`Missing utterance: ${id}`);
  if(utterance.translationJaChunks.join('')!==utterance.translationJa){
    throw new Error(`Translation chunk repair failed: ${id}`);
  }
}

fs.writeFileSync(path,`${JSON.stringify(manifest,null,2)}\n`);
