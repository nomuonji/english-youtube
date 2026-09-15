# v2.1 設計修正

2026-09-15。第三者レビュー後のv2を再レビューし、実装前に以下を修正する。ここに書かれた項目は、既存v2文書の同一論点と衝突する場合に優先する。その他のv2仕様は維持する。

## 1. 定期エージェントからActionsを起動する方法

日次エージェントは `workflow_dispatch` を直接呼べることを前提にしない。編集・検査・freezeが完了したら、最後のGit変更として次の不変READYマーカーを作成する。

```text
runs/YYYY-MM-DD/<runId>/READY.json
```

内容は最低限 `runId / episodeId / revision / manifestHash / generatedAt`。READYは一度作ったら書き換えず、revisionが変わる場合は新しいrunIdで新規作成する。

`prepare-preview.yml` の主トリガーは main へのpushかつ `runs/**/READY.json` の追加。workflowはREADYが指すmanifest/hash/commitを再検査してからprepareを開始する。通常のepisode JSON更新だけではprepareを開始しない。

M0で、現在利用するGitHub接続からREADYをcommitしたときにpush workflowが実際に起動することをprobeする。起動しない場合はREADYを残してblockedとし、手動 `workflow_dispatch` をfallbackにする。別サービスを無断追加しない。

Actions自身が `GITHUB_TOKEN` で作ったcommitの連鎖起動には依存しない。

## 2. TTS単位をutteranceからscene speech groupへ変更

`1 utterance = 1 TTS request` は廃止する。通常は1つのstory/hook/phrase/recap sceneに含まれる連続ナレーションを1つのspeech groupとして合成する。自然なprosodyを優先しつつ、境界はSSML markで取得する。

speech groupには次のmarkを入れる。

- 各utterance開始
- 各意味chunk開始
- 必要ならutterance終了境界

mark欠落・重複・逆順は `E_ALIGNMENT`。文字数比による時刻補完は禁止。

retrievalは、既出story speech group内の対象utteranceの実測sample境界から決定的に切り出したWAVを1つ作り、その同一assetをlisten/revealで再利用する。retrieval用に新しいTTSを生成しない。

TTS cache keyは少なくとも `voiceProfileHash + normalizedSSML` を含む。sceneの一文だけ変わった場合はそのscene speech groupだけ再生成する。

resolved bundleでは、clipをutterance単位ではなくspeech group単位で保持し、各clip内にutterance/chunkのsample境界を保存する。caption timingはこの境界から生成する。

## 3. 学習sceneの固定度を下げる

learningPointsは正確に3つ、retrievalは正確に1回、recapは正確に1回を維持する。

専用 `phrase` sceneは **1〜2回** とする。3つのlearning pointすべてに専用sceneを要求しない。

- phrase sceneで扱うpoint: 1〜2件
- phrase sceneで扱わないpoint: sourceUtteranceを含む最初のstory sceneで `glossLearningPointId` として表示
- phrase sceneが1件だけの場合、残る2件はそれぞれ初出storyでglossする
- recapでは3件すべてを回収する

semanticValidateは、phrase sceneで扱われていないlearning pointごとに、`sourceUtteranceId` の所有story sceneがそのpointを `glossLearningPointId` に指定していることを必須検査する。これを満たさない場合は `E_LEARNING`。

phrase sceneの配置窓は、1件なら全体25〜65%、2件なら従来どおり概ね25〜45%と45〜65%を初期目安にする。retrievalは65〜85%を維持する。実測TTS後に判定する。

## 4. news pegを正式なmanifest契約へ追加

ニュース解説がevergreen解説へ流れすぎないよう、manifestに `newsPeg` を必須追加する。

```json
{
  "newsPeg": {
    "eventClaimId": "claim-id",
    "eventDate": "2026-09-15",
    "whyNow": "Why this development makes the central question worth explaining now."
  }
}
```

`eventDate` は不明ならnull。捏造しない。`eventClaimId` は既存claimを参照し、そのclaimは少なくとも1つのevidenceを持つ。productionではhook/setupの75秒以内にnews pegの主体・出来事・知る理由が理解できることを編集レビューで確認する。

構造は常に以下とする。

```text
NEWS PEG
  -> CENTRAL QUESTION
  -> EVERGREEN EXPLANATION
  -> ANSWER / LIMITS
```

時事性だけで尺を作らず、背景説明だけでnews pegを失わない。

## 5. Text UIのcurrent focus

8プリミティブは増やさない。代わりに、音声が現在説明している項目を視線誘導として強調する。

- chain: 現在説明中のnodeを強調
- compare: 現在説明中のrowを強調
- timeline: 現在説明中のeventを強調
- metric: value/qualifierのうち現在説明中の意味を強調

focusは新しい自由payloadとしてagentに書かせない。既存 `revealAtUtteranceId` とutterance timingからrendererが決定する。次のitemがrevealされるまで直前itemをcurrentとする。色だけで意味を変えず、border/weight/opacity差も併用する。

## 6. v2.1の実装ゲート

M0へ追加:

- scheduled agent相当のGitHub接続からREADY commit -> push workflow起動を実測
- 3〜5文を1speech groupとしてTTSし、utterance/chunk mark精度と自然さを確認

M1へ追加:

- `newsPeg.eventClaimId` の参照検査
- phrase scene 1件/2件の両方をaccept
- phrase未使用learning pointの初出gloss必須検査
- speech-group resolved contractとretrieval切り出し境界検査

M2へ追加:

- chain/compare/timelineのcurrent focusを代表frameで検査
- 同じspeech groupから字幕cueとretrieval segmentが一致することを検査

M3へ追加:

- READY path filter以外のepisode commitでprepareが起動しないこと
- READYのhash不一致でprepareが停止すること

## 7. schema移行

新しい構造正本は `schemas/episode-v2.1.schema.json`。旧 `schemas/episode.schema.json` はv2.0設計の参照用に残す。実装M1ではv2.1だけからTypeScript型を生成し、2.0を暗黙migrationしない。
