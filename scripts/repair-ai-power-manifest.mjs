import fs from 'node:fs';

const path='episodes/2026-09-15-ai-power-project/manifest.json';
const manifest=JSON.parse(fs.readFileSync(path,'utf8'));
const byUtterance=Object.fromEntries(manifest.utterances.map((u)=>[u.id,u]));
const byScene=Object.fromEntries(manifest.scenes.map((s)=>[s.id,s]));

byUtterance['u-c2-2'].chunks=[
  'IEA expects data centers',
  'to account for about half',
  'of U.S. electricity-demand growth through 2030.'
];
byUtterance['u-c2-2'].translationJaChunks=[
  'IEAはデータセンターが、',
  '2030年までの米国の電力需要増加の約半分を',
  '占めると予想しています。'
];

byUtterance['u-a3-3'].chunks=[
  'Those questions can reveal whether',
  'an ambitious data-center plan is physically realistic,',
  'not just financially exciting.'
];
byUtterance['u-a3-3'].translationJaChunks=[
  'その問いによって、',
  '野心的なデータセンター計画が資金面だけでなく',
  '物理的にも現実的か見えてきます。'
];

byScene['s-mech-compute'].visual.nodes[3].label='Power is a design constraint';
byScene['s-retrieval'].visual.options=['Electricity infrastructure','Office rent'];

fs.writeFileSync(path,`${JSON.stringify(manifest,null,2)}\n`);
