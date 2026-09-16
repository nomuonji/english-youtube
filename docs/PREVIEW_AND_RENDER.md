# クラウド確認・レンダリング v2.1 / news-first

## 1. 現在の実装

現在のproduction pathはGitHub Actionsで完結する。

```text
manifest freeze
-> READY.json
-> validate / retention / cognitive review
-> local Kokoro TTS
-> editorial image + reviewed B-roll
-> measured timing
-> BGM / SFX
-> 540p preview + contact sheet
-> GitHub Pages /review/
-> explicit user approval
-> APPROVED.json
-> 1080p final
-> loudness normalization
-> direct YouTube upload
```

新規productionは `formatProfile: "news-first"`。legacy v2.1 episodeは再現性のため旧retrieval等を保持できる。

## 2. READY

日次Agentはfreeze後、最後のGit変更として:

```text
runs/YYYY-MM-DD/<runId>/READY.json
```

を新規作成する。

最低限:

- runId
- episodeId
- revision
- manifestHash
- generatedAt

READYはimmutable。manifestを変更した場合はrevision/new run/new READY。

READY workflowはcheckoutしたcommit上でREADYとmanifest/hashを再検査し、最新manifestを推測して使わない。

## 3. Review preparation

READYから:

1. schema / semantic validation
2. retention review
3. cognitive review
4. local Kokoro speech synthesis
5. measured chunk/sample timing
6. editorial image briefs
7. optional generated images + Commons fallback
8. scene-aware licensed B-roll
9. deterministic BGM / SFX
10. 540p H.264 preview
11. loudness normalization
12. contact sheet
13. review artifact
14. Pages `/review/` deploy

を行う。

reviewで見るのは静止画の正しさだけではない。冒頭30秒、visual rhythm、B-roll visibility、audio presence、story continuity、English Replayを実時間で確認する。

## 4. Viewer-facing review criteria

news-firstでは特に:

- 0〜5秒にhookがある
- 15秒程度までにcentral questionが分かる
- hook後すぐstoryへ入る
- story中にphrase/retrieval dedicated sceneが割り込まない
- current-captionがvisualを占領しない
- B-roll/imageが実際に認識できる
- metric / chain / compare / timelineが発話に同期して動く
- BGM/SEが知覚できるがnarrationを邪魔しない
- English Replayは最後に短くまとまる
- 最後にstory answerを回収する

## 5. Render profile

| 項目 | review | final |
|---|---|---|
| logical size | 1920×1080 | 1920×1080 |
| output | 960×540 | 1920×1080 |
| fps | 30 | 30 |
| codec | H.264 | H.264 |
| CRF | 23 | 18 |
| range | full episode | full episode |

news-firstの標準尺は5〜6.5分程度を目安とし、内容が短ければ無理に水増ししない。旧episodeの6〜8分基準をhard requirementとして扱わない。

## 6. APPROVED

通常AgentはAPPROVEDを作らない。ユーザーがreviewを見て**公開まで明示的に承認**した場合だけ:

```text
runs/YYYY-MM-DD/<runId>/APPROVED.json
```

を作る。

READYと `runId / episodeId / revision / manifestHash` を一致させる。

現在のproduction workflowではAPPROVED pushが:

1. validation / editorial review再確認
2. reviewed assets restore
3. same revision/hashからTTS/timing再構成
4. 1080p final render
5. loudness normalization
6. final artifact保存
7. `english-youtube` repository secretsのYouTube OAuth credentialで直接upload
8. publish result artifact保存

まで実行する。

APPROVEDは単なるレンダリング許可ではなく、現在は**公開gate**でもある。

## 7. Idempotency / publish safety

YouTube uploadは外部副作用なので、不明な結果を安易に新規uploadで再実行しない。

- publish resultをartifactへ保存
- 同一revision/hashを識別可能にする
- network timeout後はYouTube側/結果台帳を確認してから再試行
- legacy cross-repository Error English bridgeは新規productionでは使わない

## 8. QA

最低限:

- video/audio streamあり
- expected resolution/fps
- black/missing assetなし
- caption overflowなし
- narration intelligibility優先
- loudness normalization pass
- preview/finalが同一manifest revision/hash
- reviewed B-roll manifestをfinalで再利用

自動検査passを内容レビューと同一視しない。最初のnews-first数本は全編を実視聴し、実際のretention上の違和感をプレイブックへ戻す。
