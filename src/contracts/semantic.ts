import type {EpisodeManifest, Scene, ValidationIssue, Visual} from "./types";

const words=(text:string):string[]=>text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)??[];
const issue=(code:string,targetId:string,detail:string):ValidationIssue=>({code,targetId,detail});
const visualMatchesRole=(scene:Scene):boolean=>scene.role==="phrase"||scene.role==="retrieval"||scene.role==="recap"?scene.visual.type===scene.role:["card","metric","chain","compare","timeline"].includes(scene.visual.type);
const visualClaimIds=(visual:Visual):string[]=>"claimIds" in visual?visual.claimIds:[];
const revealIds=(visual:Visual):string[]=>visual.type==="chain"?visual.nodes.map(i=>i.revealAtUtteranceId):visual.type==="compare"?visual.rows.map(i=>i.revealAtUtteranceId):visual.type==="timeline"?visual.events.map(i=>i.revealAtUtteranceId):[];

export const semanticValidate=(doc:EpisodeManifest):ValidationIssue[]=>{
  const issues:ValidationIssue[]=[];
  const newsFirst=doc.formatProfile==="news-first";
  const makeMap=<T extends {id:string}>(items:T[],group:string):Map<string,T>=>{const map=new Map<string,T>();for(const item of items){if(map.has(item.id))issues.push(issue("E_DUPLICATE_ID",item.id,`duplicate ${group} id`));map.set(item.id,item);}return map;};
  const sources=makeMap(doc.sources,"source");
  const claims=makeMap(doc.claims,"claim");
  const utterances=makeMap(doc.utterances,"utterance");
  const points=makeMap(doc.learningPoints,"learning point");
  makeMap(doc.scenes,"scene");

  const newsClaim=claims.get(doc.newsPeg.eventClaimId);
  if(!newsClaim||newsClaim.evidence.length===0)issues.push(issue("E_NEWS_PEG","newsPeg","eventClaimId must reference an evidenced claim"));

  for(const claim of doc.claims)for(const evidence of claim.evidence)if(!sources.has(evidence.sourceId))issues.push(issue("E_REFERENCE",claim.id,`unknown source ${evidence.sourceId}`));
  for(const utterance of doc.utterances){
    for(const claimId of utterance.claimIds)if(!claims.has(claimId))issues.push(issue("E_REFERENCE",utterance.id,`unknown claim ${claimId}`));
    if(utterance.chunks.join(" ")!==utterance.text)issues.push(issue("E_TEXT",utterance.id,"chunks joined with spaces must equal text"));
    if(utterance.translationJaChunks.length!==utterance.chunks.length)issues.push(issue("E_TEXT",utterance.id,"translation chunks must match English chunk count"));
    if(utterance.translationJaChunks.join("")!==utterance.translationJa)issues.push(issue("E_TEXT",utterance.id,"translation chunks must concatenate to translationJa"));
    if(words(utterance.text).length>26)issues.push(issue("E_TEXT",utterance.id,"utterance exceeds 26 words"));
    utterance.chunks.forEach((chunk,index)=>{if(words(chunk).length>16)issues.push(issue("E_TEXT",`${utterance.id}:chunk-${index+1}`,"learning chunk exceeds 16 English words"));});
  }

  const owner=new Map<string,number>(); const ownershipOrder:string[]=[];
  doc.scenes.forEach((scene,sceneIndex)=>{
    if(!visualMatchesRole(scene))issues.push(issue("E_ROLE",scene.id,`role ${scene.role} does not match visual ${scene.visual.type}`));
    if((scene.role==="story")!==(scene.beat!==null))issues.push(issue("E_ROLE",scene.id,"only story scenes may have a beat"));
    if(scene.role==="retrieval"&&scene.utteranceIds.length!==0)issues.push(issue("E_ROLE",scene.id,"retrieval must not own utterances"));
    if(scene.role==="recap"&&scene.utteranceIds.length!==3)issues.push(issue("E_ROLE",scene.id,"recap must own exactly three utterances"));
    for(const claimId of visualClaimIds(scene.visual))if(!claims.has(claimId))issues.push(issue("E_REFERENCE",scene.id,`visual references unknown claim ${claimId}`));
    const positions=new Map(scene.utteranceIds.map((id,index)=>[id,index]));let last=-1;
    for(const revealId of revealIds(scene.visual)){const pos=positions.get(revealId);if(pos===undefined||pos<last)issues.push(issue("E_REVEAL",scene.id,`invalid reveal reference ${revealId}`));else last=pos;}
    if(scene.glossLearningPointId!==null&&!points.has(scene.glossLearningPointId))issues.push(issue("E_REFERENCE",scene.id,`unknown learning point ${scene.glossLearningPointId}`));
    for(const uid of scene.utteranceIds){if(!utterances.has(uid)){issues.push(issue("E_REFERENCE",scene.id,`unknown utterance ${uid}`));continue;}if(owner.has(uid))issues.push(issue("E_OWNERSHIP",uid,"utterance belongs to more than one scene"));owner.set(uid,sceneIndex);ownershipOrder.push(uid);}
  });
  const utteranceOrder=doc.utterances.map(i=>i.id);
  if(ownershipOrder.length!==utteranceOrder.length||ownershipOrder.some((id,i)=>id!==utteranceOrder[i]))issues.push(issue("E_ORDER","utterances","scene ownership order must exactly match utterances array"));

  const phraseScenes=doc.scenes.filter(s=>s.role==="phrase");
  const retrievalScenes=doc.scenes.filter(s=>s.role==="retrieval");
  const recapScenes=doc.scenes.filter(s=>s.role==="recap");
  if(doc.scenes[0]?.role!=="hook"||doc.scenes.at(-1)?.role!=="recap")issues.push(issue("E_STRUCTURE","scenes","hook must be first and recap must be last"));
  if(recapScenes.length!==1)issues.push(issue("E_STRUCTURE","scenes","exactly one recap scene is required"));

  if(newsFirst){
    if(phraseScenes.length<1||phraseScenes.length>3)issues.push(issue("E_STRUCTURE","scenes","news-first requires one to three phrase scenes in the final learning block"));
    if(retrievalScenes.length!==0)issues.push(issue("E_STRUCTURE","scenes","news-first production does not use retrieval scenes; keep the story uninterrupted and move deliberate practice to the final replay block"));
    const storyIndexes=doc.scenes.map((s,i)=>s.role==="story"?i:-1).filter(i=>i>=0);
    const lastStoryIndex=storyIndexes.at(-1)??-1;
    const firstContent=doc.scenes.find((_,i)=>i>0);
    if(firstContent&&firstContent.role!=="story")issues.push(issue("E_STRUCTURE",firstContent.id,"news-first must enter the story immediately after the hook"));
    for(const scene of phraseScenes){const index=doc.scenes.indexOf(scene);if(index<=lastStoryIndex)issues.push(issue("E_STRUCTURE",scene.id,"news-first phrase scenes must be grouped after the final story scene"));}
  }else{
    if(phraseScenes.length<1||phraseScenes.length>2)issues.push(issue("E_STRUCTURE","scenes","legacy v2.1 requires one or two phrase scenes"));
    if(retrievalScenes.length!==1)issues.push(issue("E_STRUCTURE","scenes","legacy v2.1 requires exactly one retrieval scene"));
  }

  const phrasePointIds=new Set<string>();
  for(const scene of phraseScenes){if(scene.visual.type!=="phrase")continue;if(!points.has(scene.visual.learningPointId))issues.push(issue("E_REFERENCE",scene.id,`unknown learning point ${scene.visual.learningPointId}`));if(phrasePointIds.has(scene.visual.learningPointId))issues.push(issue("E_LEARNING",scene.id,"phrase scenes must use different learning points"));phrasePointIds.add(scene.visual.learningPointId);}

  for(const point of doc.learningPoints){
    const source=utterances.get(point.sourceUtteranceId);const sourceSceneIndex=owner.get(point.sourceUtteranceId);
    if(!source||sourceSceneIndex===undefined){issues.push(issue("E_LEARNING",point.id,"source utterance is missing or unowned"));continue;}
    const sourceScene=doc.scenes[sourceSceneIndex];
    if(sourceScene.role!=="story")issues.push(issue("E_LEARNING",point.id,"learning point source must be a story utterance"));
    if(!source.text.toLocaleLowerCase("en-US").includes(point.phrase.toLocaleLowerCase("en-US")))issues.push(issue("E_LEARNING",point.id,"phrase must occur continuously in source utterance"));
    if(!phrasePointIds.has(point.id)&&sourceScene.glossLearningPointId!==point.id)issues.push(issue("E_LEARNING",point.id,"learning point without phrase scene must be glossed at its source story scene"));
    for(const scene of phraseScenes)if(scene.visual.type==="phrase"&&scene.visual.learningPointId===point.id&&doc.scenes.indexOf(scene)<=sourceSceneIndex)issues.push(issue("E_LEARNING",point.id,"phrase scene must come after source story scene"));
  }

  for(const scene of retrievalScenes){if(scene.visual.type!=="retrieval")continue;const sourceIndex=owner.get(scene.visual.sourceUtteranceId);const retrievalIndex=doc.scenes.indexOf(scene);if(sourceIndex===undefined||sourceIndex>=retrievalIndex||doc.scenes[sourceIndex]?.role!=="story")issues.push(issue("E_RETRIEVAL",scene.id,"retrieval must reuse a prior story utterance"));}
  const recap=recapScenes[0];
  if(recap?.visual.type==="recap"){const expected=[...points.keys()].sort().join("|");const actual=[...recap.visual.learningPointIds].sort().join("|");if(expected!==actual)issues.push(issue("E_LEARNING",recap.id,"recap must include all three learning points exactly once"));}

  if(doc.kind==="production"){
    const uniqueGroups=new Set(doc.sources.map(s=>s.independenceGroup));
    if(doc.sources.length<3||uniqueGroups.size<2||!doc.sources.some(s=>s.isPrimary))issues.push(issue("E_EVIDENCE","sources","production requires 3 sources, 2 independent groups, and 1 primary source"));
    if(doc.claims.some(c=>c.certainty==="disputed"))issues.push(issue("E_EVIDENCE","claims","disputed claims are not allowed in initial production"));
    const generated=Date.parse(doc.generatedAt),asOf=Date.parse(doc.asOf);
    if(asOf>generated||generated-asOf>86400000)issues.push(issue("E_FRESHNESS","asOf","production asOf must be no later than generatedAt and within 24 hours"));
    for(const source of doc.sources)if(Date.parse(source.retrievedAt)>generated)issues.push(issue("E_FRESHNESS",source.id,"retrievedAt cannot be after generatedAt"));

    const storyScenes=doc.scenes.filter(s=>s.role==="story");
    const minStories=8,maxStories=newsFirst?16:20;
    if(storyScenes.length<minStories||storyScenes.length>maxStories)issues.push(issue("E_STRUCTURE","scenes",`production requires ${minStories} to ${maxStories} story scenes${newsFirst?" for news-first":""}`));
    type Beat="setup"|"mechanism"|"complication"|"answer";const beatOrder:Beat[]=["setup","mechanism","complication","answer"];let previous=-1;
    for(const beat of beatOrder){const count=storyScenes.filter(s=>s.beat===beat).length;const maxPerBeat=newsFirst?4:5;if(count<2||count>maxPerBeat)issues.push(issue("E_BEAT",beat,`each story beat must have 2 to ${maxPerBeat} scenes`));}
    for(const scene of storyScenes){const current=beatOrder.indexOf(scene.beat as Beat);if(current<previous)issues.push(issue("E_BEAT",scene.id,"story beats must be in order"));previous=current;}
    if(new Set(doc.scenes.map(s=>s.visual.type)).size<4)issues.push(issue("E_STRUCTURE","scenes","production requires at least four visual types"));

    const storyText=storyScenes.flatMap(s=>s.utteranceIds).map(id=>utterances.get(id)?.text??"").join("\n").toLocaleLowerCase("en-US");
    for(const point of doc.learningPoints){const matches=storyText.split(point.phrase.toLocaleLowerCase("en-US")).length-1;if(matches<2)issues.push(issue("E_LEARNING",point.id,"each learning point must occur at least twice in story narration"));}

    const spokenTexts=doc.utterances.map(i=>i.text);
    if(!newsFirst)for(const scene of retrievalScenes)if(scene.visual.type==="retrieval"){const source=utterances.get(scene.visual.sourceUtteranceId);if(source)spokenTexts.push(source.text,source.text);}
    const count=spokenTexts.reduce((sum,text)=>sum+words(text).length,0);
    const minWords=newsFirst?650:760,maxWords=newsFirst?850:980;
    if(count<minWords||count>maxWords)issues.push(issue("E_WORDS","utterances",`spoken word count ${count} is outside ${minWords}-${maxWords}`));
  }
  return issues;
};
