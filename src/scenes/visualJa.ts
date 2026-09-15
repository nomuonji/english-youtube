const EXACT:Record<string,string>={
  "data centers":"データセンター","data center":"データセンター","power generation":"発電","electricity demand":"電力需要","power demand":"電力需要","grid access":"送電網への接続","grid connection":"送電網への接続","power grid":"送電網","grid":"送電網","utilities":"電力事業者","utility":"電力事業者","servers":"サーバー","server":"サーバー","ai demand":"AI需要","ai data centers":"AIデータセンター","ai-focused data centers":"AI向けデータセンター","electricity":"電力","generation":"発電","infrastructure":"インフラ","equipment":"設備","supply chain":"サプライチェーン","bottleneck":"ボトルネック","financing":"資金調達","chips":"半導体","compute":"計算資源","power availability":"電力確保","project design":"プロジェクト設計","demand growth":"需要増加","commercial":"商業部門","industrial":"産業部門","today":"現在","2030":"2030年","cause and effect":"原因と結果","how the story develops":"流れを整理","use it in context":"文脈で使う","listen and check":"聞いて確認","three phrases to keep":"覚える3表現","current demand":"現在の需要","future demand":"将来の需要","connection queue":"接続待ち","transmission":"送電","power supply":"電力供給","reliable power":"安定した電力","data-center growth":"データセンターの成長"
};

export const visualJa=(value:string):string=>{
  const key=value.trim().toLowerCase();
  if(EXACT[key])return EXACT[key];
  for(const [en,ja] of Object.entries(EXACT)){
    if(key.includes(en)&&key.length<=en.length+18)return ja;
  }
  return "";
};
