# english-youtube — World in Clear English

日本人の中級英語学習者が、世界の一つの出来事を英語で理解する、6〜8分のニュース背景解説。

**視聴者への約束：一つの「なぜ」を追っている間ずっと英語を処理し、最後にはその説明を英語で以前より理解できる。**

## 状態

2026-09-15時点でv2.1のMVP制作経路は実装済み。

- v2.1 manifest schema / semantic validation
- production episode生成用の閉じたデータ契約
- scene speech group単位のKokoro ONNX TTS
- 実測sample境界からの英語chunk timing
- 既出音声を切り出して再利用するretrieval
- Remotion 1080p composition / 540p review preview
- READY push → GitHub Actions preview render
- contact sheet / review artifact
- chunk-first学習UI、遅延日本語、論理語ヒント、learning-point強調
- metric / chain / compare / timelineの発話同期アニメーション
- retention review CLIと制作エージェント向けretention-first工程

YouTube自動公開は初期設定で無効。READYはreview previewを作るだけで、公開許可ではない。

v2.1の基本変更は[v2.1設計修正](docs/V2_1_CHANGES.md)、現在の長尺視聴・全編学習方針は[Retention-first 学習・演出仕様](docs/RETENTION_AND_LEARNING.md)を参照。

## プロダクト方針

これは「ニュース動画の最後に単語帳を付ける」プロダクトではない。

```text
interesting question
  -> simple-English story
  -> chunk-by-chunk comprehension
  -> micro payoff
  -> useful-English discovery
  -> next question
```

learningPoints 3件は動画内の全学習内容ではなく、最後まで強く回収するアンカー表現。story/hookの各英文そのものが学習対象で、英語chunkを先に処理した後に対応日本語を答え合わせとして出す。

長尺では、各beatを `open loop -> evidence/example -> micro payoff -> forward pull` で構成し、20〜40秒程度を目安に内容と同期したpattern breakを作る。詳細は[RETENTION_AND_LEARNING.md](docs/RETENTION_AND_LEARNING.md)。

## 決定済みの仕様

| 項目 | v2.1 |
|---|---|
| 視聴者 | 日本語話者・B1中心。英文を読めば分かるがニュース音声には追いつけない成人 |
| 題材 | テクノロジーと生活、仕事とお金の仕組み、科学と社会。必ずnews pegを持ち、時事を入口に背景を説明 |
| 長さ | 360〜480秒。8分への水増しなし |
| 言語 | 英語音声、意味単位の英語chunk。日本語は遅延答え合わせ＋任意CC |
| 学習 | 全編chunk学習＋論理語ヒント。3アンカー表現、phrase 1〜2回、既出音声retrieval 1回、最後に3表現回収 |
| 画面 | 1920×1080 / 30fps。card / metric / chain / compare / timeline / phrase / retrieval / recap＋current focus |
| 制作 | 日次探索、火・木・土20:00 JSTを公開枠とする週3本上限。品質未達なら欠番 |
| 品質 | schema/semantic → retention review → editorial review → freeze |
| 自動化 | エージェントは内容JSONを生成。freeze後にREADYをcommitし、Actionsがreview previewを開始 |
| 音声 | scene speech group単位のKokoro ONNX。実測sample境界でcaption / retrievalを同期 |
| レンダリング | GitHub Actions + Remotion。review artifactにpreview / contact sheetを含める |

## 読む順番

1. [v2.1設計修正](docs/V2_1_CHANGES.md)
2. [Retention-first 学習・演出仕様](docs/RETENTION_AND_LEARNING.md)
3. [編集・学習仕様](docs/EDITORIAL_SYSTEM.md)
4. [編集エージェント工程](docs/AGENT_PIPELINE.md)
5. [画面・シーン仕様](docs/VISUAL_SYSTEM.md)
6. [データ契約](docs/DATA_CONTRACT.md)
7. [アーキテクチャ](docs/ARCHITECTURE.md)
8. [クラウド確認・レンダリング](docs/PREVIEW_AND_RENDER.md)
9. [定期運用](docs/OPERATIONS.md)
10. [受け入れ・実装順](docs/IMPLEMENTATION_PLAN.md)
11. [パイロットと評価](docs/PILOT_AND_MEASUREMENT.md)
12. [出典](docs/SOURCES.md)

[AGENTS.md](AGENTS.md)は担当エージェント向けの入口。構造正本は[schema v2.1](schemas/episode-v2.1.schema.json)。

## 主なコマンド

```text
npm ci
npm run typecheck
npm test
npm run validate -- fixtures/v2.1-demo.json
npm run validate -- episodes/2026-09-15-ai-power-project/manifest.json
npm run review:retention -- episodes/2026-09-15-ai-power-project/manifest.json
npm run build
```

`review:retention` はschema検査とは別の編集QA。正しいJSONでも、弱いhook、forward-pull不足、画面型の単調さ、学習アンカーの偏りなどを検出する。初期基準はhard failure 0、score 80以上。

## READY / preview

freeze後に以下を新規作成する。

```text
runs/YYYY-MM-DD/<runId>/READY.json
```

READY pushを受けたActionsがmanifest hashを再検証し、TTS → measured timing → 540p preview → loudness normalization → contact sheet → review artifactまで作る。

manifestを修正した場合は旧READYを再利用せずrevisionを上げ、新run / new READYでreviewからやり直す。
