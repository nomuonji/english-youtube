# News-first format

Status: current production default (2026-09-16)

`formatProfile: "news-first"` は今後の production episode の標準。旧v2.1 manifestは再現性のため互換維持するが、新規制作では使用しない。

visualの具体基準は `docs/V3_ENGLISH_NEWS_EXPLAINER.md` を参照する。現在のproduction `EpisodeVideo` は `formatProfile: "news-first"` を検出するとaccepted v3 visual baselineへ自動ルーティングする。

## North star

**面白い海外ニュース解説を英語で見ていたら、結果的に実践英語も身につく。**

ニュースと英語教材を50/50で交互に見せない。動画の主役は最初から最後まで story。学習支援は story の理解を助けるUIとして埋め込み、能動練習は story が終わった後の短い replay block にまとめる。

## Audience

- 日本語話者の B2 前後〜C1
- 海外ニュース、テクノロジー、仕事、経済に関心がある成人
- 単純な文法講義より、実際のニュース文脈で reusable English を増やしたい人

専門用語は topic vocabulary として短く意味を補助するが、暗記対象の anchor expression と混同しない。

## Episode shape

目安は **5〜6.5分（300〜390秒）**、spoken wordsは概ね650〜850語。水増ししない。

`episodes/2026-09-15-ai-power-project/v3.json` の90〜120秒版はvisual approval用のpilotであり、productionの尺基準ではない。

```text
0:00  COLD HOOK
       unexpected fact / contrast / stakes
       central question by ~15 sec

       STORY
       WHAT CHANGED
       HOW IT WORKS
       THE CATCH
       WHAT IT MEANS

       ENGLISH REPLAY
       1-3 anchor expressions from the story
       listen once -> notice the chunk -> shadow once

       TAKEAWAY
       story answer + three expressions
```

### Hard rules

- hook直後はstoryへ入る。
- story中に `phrase` / `retrieval` sceneを挟まない。
- `retrieval` sceneはnews-firstでは0件。
- dedicated `phrase` sceneは1〜3件、すべて最後のstoryより後にまとめる。
- recapは最後に1件。
- 既出英文を途中で複数回再生してテンポを止めない。
- 5〜6.5分を埋めるためだけの言い換え・反復をしない。十分なsource-backed substanceがないテーマは採用しない。

## Hook

最初の5〜10秒で次のどれかを見せる。

- unexpected fact
- visual contradiction
- striking scale change
- concrete consequence

挨拶、タイトル読み上げ、`Today we will...`、学習目標説明は禁止。45 wordsを超えるhookは原則作り直す。

hookは強くても、根拠のない危機感・投資煽り・断定を作らない。

## Learning design

### Anchor expressions

正確に3件。B2〜C1の business/news English として再利用価値の高いものを選ぶ。

良い候補:

- put a strain on ...
- come online
- account for half of ...
- be constrained by ...
- secure enough capacity
- raise capital for ...
- face a supply bottleneck

避ける候補:

- is expected to
- keep up with
- because of
- in order to
- for example

単に難しい専門名詞を選ぶのも避ける。`substation` のような語は理解補助として説明できるが、原則anchorにしない。

### Inline support

story中の学習UIは短く、同時に1つだけ。

- 現在の英文chunk
- 日本語補助
- 必要なときだけ `BUSINESS ENGLISH` の小さなannotation

専用単語カードへ切り替えてstoryを止めない。

### English replay

最後に1〜3表現だけ。

1. storyで聞いた文脈を思い出す
2. phrase/chunkに注目
3. 一度だけshadow

長いカウントダウン、同一音声3連続、選択式クイズは標準では使わない。

## Visual direction

Text UIだけを見せ続けない。映像美そのもので競争するのではなく、**意味構造がすぐ分かるvisual rhythm**を作る。

accepted v3 baseline:

- dark cinematic canvas
- full-bleed factual B-roll / editorial image
- strong English headline + smaller Japanese comprehension support
- cyan/electric accent、risk/tensionのみred
- animated metric / chain / compare / timeline
- current chunk中心のpersistent bilingual lower-third
- scene境界でfade-to-blackを反復しない
- BGMは知覚できるがvoice-first、SFXは意味イベントだけ

使うもの:

- factual / licensed B-roll
- editorial image
- kinetic key text
- animated metric
- chain / compare / timeline
- source/evidence framing

3〜8秒程度を目安に、発話内容に同期した小さな変化を作る。ただし時間だけを理由にランダムな切替をしない。

B-rollを白い幕で消さない。字幕・図の可読性を守れる範囲で素材そのものが認識できるコントラストを残す。

## Captions

通常storyでは現在chunkを主役にしたcompact lower-thirdを使う。

- current English: strong
- Japanese support: smaller
- optional anchor annotation: one
- previous/next全文を常時表示しない
- lower-third背景は常設し、cue変更ごとに巨大box全体をmount/unmountしない

字幕はvisualを隠す巨大な白カードにしない。

## Audio

- narratorが常に主役
- BGMは継続するが、知覚できる程度のlow-density tech pulse
- chapter transition / hook / metric reveal / replayなど意味のあるイベントだけSFX
- 毎文にSEを付けない
- 不自然な長い無音や360ms級の文間pauseを連発しない

## Agent generation constraints

新規production manifestは必ず:

```json
{
  "schemaVersion": "2.1.0",
  "formatProfile": "news-first"
}
```

とする。

生成時はstoryを先に完成させ、その後でstory内の実際の表現からlearningPointsを選ぶ。learningPointsに合わせてニュース原稿を不自然に書き換えない。

READY前に:

- schema / semantic validation
- retention review
- cognitive review
- human-facing editorial review

を通す。news-firstのhard failureを旧仕様へ戻して解消してはならない。
