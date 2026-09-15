# english-youtube

AI agent + Remotion で、日本人英語学習者向けの長尺ニュース解説動画を定期生成するプロジェクト。

## Product concept

**One story. One question. Simple English.**

ニュースそのものを読み上げるのではなく、当日の重要なニュースを入口に「なぜ起きているのか」「何が重要なのか」「次に何が起きるのか」まで 8〜12 分で解説する。

差別化の中心は実写映像ではなく、**英語を理解しやすくする Text UI / Information UI**。

- 英語字幕を常時表示
- キーフレーズ・チャンク・因果関係を画面上で構造化
- 日本語は必要な箇所だけ補助表示
- Timeline / Compare / Cause-Effect / Map / Number / Quote などの情報 UI を多用
- Listening Challenge / Chunk Breakdown / Recap をニュースの流れを壊さない範囲で差し込む

## Core rule

日次生成は「固定テンプレートへのデータ差し替え」にしない。

- **Template side**: 映像文法、Scene components、字幕、レイアウト、animation、brand、validation、rendering
- **Agent side**: テーマ選定、リサーチ、問い、ストーリー構成、Scene の選択・順序、文章、英語難易度、学習ポイント、強調箇所、タイトル・サムネ案

日次 agent は原則として React / CSS を編集せず、`EpisodeManifest` を生成する。映像表現を拡張したい場合のみ、人間レビュー前提で Scene Library を更新する。

## Planned pipeline

```text
Scheduled Agent
  -> discover current stories
  -> score/select one story
  -> research + fact check
  -> write editorial plan
  -> generate EpisodeManifest JSON
  -> QA manifest
  -> TTS/assets
  -> GitHub Actions preview render
  -> production render
  -> publish
```

## Development preview

開発中は二段構えにする。

1. **GitHub Pages + Remotion Player**
   - ブラウザで再生・seek可能
   - Scene UI / timing / subtitles をローカル環境なしで確認
   - same React composition を利用
2. **GitHub Actions preview MP4**
   - 低解像度・短縮版を cloud render
   - workflow artifact として保存
   - production render と同じ Chromium/ffmpeg 経路の最終確認用

詳細は [`docs/PREVIEW_AND_RENDER.md`](docs/PREVIEW_AND_RENDER.md)。

## Documents

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Template と Agent の責務分離
- [`docs/EDITORIAL_SYSTEM.md`](docs/EDITORIAL_SYSTEM.md) — ニュース選定・動画構成・学習設計
- [`docs/PREVIEW_AND_RENDER.md`](docs/PREVIEW_AND_RENDER.md) — GitHub Actions / browser preview 設計
- [`AGENTS.md`](AGENTS.md) — 定期実行 agent が守る契約
- [`schemas/episode.schema.json`](schemas/episode.schema.json) — Agent と Remotion のデータ契約

## Previous projects

`legal-english` / `error-english` の生成・TTS・Remotion・YouTube upload の知見は再利用するが、**固定 scene sequence は再利用しない**。
