# english-youtube — World in Clear English

アニメーションの中で英語表現を聞き、意味を理解し、別の場面で使えるようにする動画制作基盤。

**新しい視聴者への約束：短い物語を見終えたとき、使える英語表現を一つ自分の言葉にできる。**

## 新しい方向：Animated English

英語学習を動画の主役にする。登場人物の目的と問題をアニメーションで見せ、表現を自然な文脈で聞かせる。その後、意味を短く示し、別の場面で使い、声に出し、最後に自力で思い出す。最初の候補は `run into a snag` を学ぶ約39秒の試作。仕様と長尺・縦型への展開方針は [Animation-first English](docs/ANIMATION_FIRST_ENGLISH.md) を参照。

新しい教材は独立した候補として実装中。以下は既存ニュース動画の制作・公開基盤の記録であり、過去の動画を再現できる状態を保つ。

## 既存ニュース動画のproduction標準

2026-09-16時点のニュース制作では `formatProfile: "news-first"` を標準としていた。

旧v2.1 episodeは再現性のため互換維持する。ニュース形式の動画は次の流れで作られていた。

```text
COLD HOOK
  -> uninterrupted NEWS STORY
     WHAT CHANGED
     HOW IT WORKS
     THE CATCH
     WHAT IT MEANS
  -> short ENGLISH REPLAY
  -> STORY TAKEAWAY + 3 expressions
```

ターゲットは日本語話者の **B2前後〜C1**。初心者向け文法解説と専門ニュースを混ぜるのではなく、ニュースそのものを主役にし、学習支援を画面内へ薄く埋め込む。

詳細は [News-first format](docs/NEWS_FIRST_FORMAT.md) を参照。

## プロダクト方針

これは「英語教材の途中にニュースを挟む」プロダクトでも、「ニュース動画の最後に単語帳を付ける」プロダクトでもない。

```text
interesting current event
  -> strong question
  -> evidence / mechanism / consequence
  -> reusable English noticed in context
  -> answer
  -> brief replay
```

learningPointsは正確に3件。ただしstoryを学習表現に合わせて書かない。**storyを先に完成させ、その実際の原稿からB2〜C1の再利用価値が高い表現を選ぶ。**

## Viewer-facing design

- 最初の5〜10秒でvisual/claim/stakesを置く。長いタイトル画面なし。
- hook直後からstoryへ入り、途中の専用クイズ・単語講義で止めない。
- 通常字幕はcurrent English chunk + 小さな日本語補助のcompact lower-third。
- B-roll / editorial image / animated metric / chain / compare / timelineを発話に同期させる。
- B-rollは背景に存在するだけでなく、素材そのものが認識できる強度で見せる。
- BGMはvoice-firstのtech pulse、SEはhook/chapter/metric/replayなど意味イベントだけ。
- English Replayは最後に1〜3表現、`listen once -> notice -> shadow once`。

## 制作・公開パイプライン

1. Agentが候補探索・source/claim確認・story生成を行う。
2. schema / semantic / retention / cognitive reviewを通す。
3. manifestをfreezeし `READY.json` をcommit。
4. GitHub ActionsでTTS、画像/B-roll、540p preview、contact sheetを生成。
5. GitHub Pages `/review/` で人間が確認。
6. 明示的な公開承認後に `APPROVED.json` をcommit。
7. Actionsが同一revision/hashから1080p finalをrenderし、音量正規化後、設定済みYouTube credentialで直接公開する。

READYは公開許可ではない。APPROVEDは現在のproduction workflowでは最終render + YouTube公開のgate。

## 現在の技術基盤

- EpisodeManifest v2.1 + optional `formatProfile: "news-first"`
- source / claim / evidence contract
- Kokoro ONNX local TTS + exact sample-based chunk timing
- Remotion 1920×1080 composition / 540p review preview
- editorial images + Wikimedia Commons licensed B-roll
- animated metric / chain / compare / timeline
- deterministic BGM / SFX
- retention / cognitive-load review CLI
- READY / APPROVED immutable gate
- GitHub Actions render
- GitHub Pages review UI
- direct YouTube resumable upload

## 品質ゲート

production READY前:

- schema / semantic validation: pass
- retention review: hard failure 0, score >= 80
- cognitive review: hard failure 0, score >= 75
- evidence/freshness requirements: pass
- human-facing editorial review

news-firstでは特に次を機械検査する。

- story中にdedicated learning sceneが割り込まない
- retrieval scene 0件
- replayは最後のstoryより後
- hookが長すぎない
- basic/general phraseをanchorにしすぎない
- story shareが低すぎない

## 読む順番

新しい教材形式は [Animation-first English](docs/ANIMATION_FIRST_ENGLISH.md) から。既存ニュース制作の参照資料は次の順番。

1. [News-first format](docs/NEWS_FIRST_FORMAT.md)
2. [動画制作プレイブック](docs/VIDEO_PRODUCTION_PLAYBOOK.md)
3. [Retention / learning](docs/RETENTION_AND_LEARNING.md)
4. [編集・学習仕様](docs/EDITORIAL_SYSTEM.md)
5. [編集エージェント工程](docs/AGENT_PIPELINE.md)
6. [画面・シーン仕様](docs/VISUAL_SYSTEM.md)
7. [データ契約](docs/DATA_CONTRACT.md)
8. [アーキテクチャ](docs/ARCHITECTURE.md)
9. [クラウド確認・レンダリング](docs/PREVIEW_AND_RENDER.md)
10. [定期運用](docs/OPERATIONS.md)
11. [v2.1 legacy changes](docs/V2_1_CHANGES.md)

[AGENTS.md](AGENTS.md) は制作Agent向けの入口。schema正本は [episode-v2.1.schema.json](schemas/episode-v2.1.schema.json)。

## 主なコマンド

```text
npm ci
npm run typecheck
npm test
npm run validate -- fixtures/v2.1-demo.json
npm run validate -- episodes/2026-09-15-ai-power-project/manifest.json
npm run review:retention -- episodes/2026-09-15-ai-power-project/manifest.json
npm run review:cognitive -- episodes/2026-09-15-ai-power-project/manifest.json
npm run build
```

## READY / preview

freeze後に:

```text
runs/YYYY-MM-DD/<runId>/READY.json
```

を新規作成する。READY pushを受けたActionsがmanifest hashを再検証し、TTS → measured timing → assets → 540p preview → loudness normalization → contact sheet → review artifactまで作る。

manifestを直したらrevisionを上げ、新run / new READYでreviewからやり直す。
