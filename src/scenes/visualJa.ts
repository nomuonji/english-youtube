const EXACT:Record<string,string>={
  "data centers":"データセンター","data center":"データセンター","power generation":"発電","electricity demand":"電力需要","power demand":"電力需要","grid access":"送電網への接続","grid connection":"送電網への接続","power grid":"送電網","grid":"送電網","utilities":"電力事業者","utility":"電力事業者","servers":"サーバー","server":"サーバー","ai demand":"AI需要","ai data centers":"AIデータセンター","ai-focused data centers":"AI向けデータセンター","electricity":"電力","generation":"発電","infrastructure":"インフラ","equipment":"設備","supply chain":"サプライチェーン","bottleneck":"ボトルネック","financing":"資金調達","chips":"半導体","compute":"計算資源","power availability":"電力確保","project design":"プロジェクト設計","demand growth":"需要増加","commercial":"商業部門","industrial":"産業部門","today":"現在","2030":"2030年","cause and effect":"原因と結果","how the story develops":"流れを整理","use it in context":"文脈で使う","listen and check":"聞いて確認","three phrases to keep":"覚える3表現","current demand":"現在の需要","future demand":"将来の需要","connection queue":"接続待ち","transmission":"送電","power supply":"電力供給","reliable power":"安定した電力","data-center growth":"データセンターの成長",
  "ai data-center electricity growth, 2025":"AIデータセンターの電力需要増加（2025年）","data-center electricity":"データセンターの電力消費","global share":"世界の電力消費に占める割合",
  "ai chips compute":"AI半導体が計算する","cooling removes heat":"冷却で熱を逃がす","many systems draw power":"多くの設備が電力を使う","power is a design constraint":"電力確保が設計上の制約になる",
  "substation":"変電所","data-center campus":"データセンター拠点","digital side":"デジタル側","physical side":"物理インフラ側","scaling":"拡張の速さ","software can move fast":"ソフトウェアはすぐ拡張できる","grid upgrades take time":"送電網の増強には時間がかかる","constraint":"制約","more compute wanted":"計算能力を増やしたい","connection must keep up":"系統接続も追いつく必要がある","response":"対応","add servers":"サーバーを追加","add substations / storage / generation":"変電所・蓄電・発電も追加",
  "data-center electricity demand +17%":"データセンターの電力需要が17%増加","grid and equipment bottlenecks matter now":"送電網と設備のボトルネックが重要に","central outlook: ~950 twh":"中心予測：約950TWh","u.s. demand growth from data centers":"米国のデータセンター由来の需要増加",
  "national view":"国全体で見る","local view":"地域で見る","share":"割合","can look modest":"小さく見えることもある","can be a huge local load":"地域では巨大な負荷になり得る","exists somewhere":"どこかに電力はある","must arrive at this site":"この拠点まで届ける必要がある","planning":"計画","annual demand":"年間需要","grid connection + equipment":"系統接続＋設備",
  "compute plan":"計算能力の計画","reliable electricity":"安定した電力","grid / generation investment":"送電網・発電への投資","ai becomes an energy project":"AIがエネルギープロジェクト化する","old mental model":"従来の考え方","new project reality":"新しい現実","power":"電力","utility bill":"電気料金","site constraint":"立地上の制約","mostly servers":"主にサーバー","grid + storage + generation options":"送電網・蓄電・発電まで検討","finance":"資金計画","compute first":"計算能力を先に考える","energy affects schedule and capital":"エネルギーが工期と資金を左右する"
};

export const visualJa=(value:string):string=>{
  const key=value.trim().toLowerCase();
  if(EXACT[key])return EXACT[key];
  for(const [en,ja] of Object.entries(EXACT)){
    if(key.includes(en)&&key.length<=en.length+18)return ja;
  }
  return "";
};
