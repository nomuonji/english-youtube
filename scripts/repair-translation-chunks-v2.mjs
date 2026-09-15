import fs from 'node:fs';

const path='episodes/2026-09-15-ai-power-project/manifest.json';
const manifest=JSON.parse(fs.readFileSync(path,'utf8'));
const targetIds=new Set(['u-c2-2','u-p2-2']);

const splitIntoExactCount=(text,count,max=48)=>{
  const chars=Array.from(text);
  if(count<1) throw new Error('Invalid chunk count');
  const base=Math.floor(chars.length/count);
  const remainder=chars.length%count;
  const chunks=[];
  let offset=0;
  for(let i=0;i<count;i++){
    const size=base+(i<remainder?1:0);
    const chunk=chars.slice(offset,offset+size).join('');
    if(chunk.length>max) throw new Error(`Chunk exceeds ${max} chars`);
    chunks.push(chunk);
    offset+=size;
  }
  if(chunks.join('')!==text) throw new Error('Chunk split did not preserve text');
  return chunks;
};

for(const utterance of manifest.utterances){
  if(targetIds.has(utterance.id)){
    utterance.translationJaChunks=splitIntoExactCount(
      utterance.translationJa,
      utterance.chunks.length
    );
  }
}

for(const id of targetIds){
  const utterance=manifest.utterances.find((item)=>item.id===id);
  if(!utterance) throw new Error(`Missing utterance: ${id}`);
  if(utterance.translationJaChunks.length!==utterance.chunks.length){
    throw new Error(`Chunk count mismatch remains: ${id}`);
  }
  if(utterance.translationJaChunks.join('')!==utterance.translationJa){
    throw new Error(`Translation chunk repair failed: ${id}`);
  }
}

fs.writeFileSync(path,`${JSON.stringify(manifest,null,2)}\n`);
