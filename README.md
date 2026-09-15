# english-youtube — World in Clear English

日本人の中級英語学習者が、世界の一つの出来事を英語で理解する、6〜8分のニュース背景解説。

**視聴者への約束：一つの「なぜ」が分かる。最後には、その説明を英語で聞き取れる。**

## 状態

2026-09-15、設計をv2へ全面改訂し、その後の再レビューを踏まえて**v2.1修正**を追加した。現在は**設計・JSON契約・契約検査のみ**。動画アプリ、TTS、Actions、Pages、YouTube連携は未実装。以下のコマンドやworkflow名は、明記した契約検査を除き実装対象であり、稼働済み機能ではない。

v2.1では、v2の基本方針を維持しつつ、実装前に次を修正した。

- 定期エージェント→Actionsは直接dispatch前提ではなく、READY commit→push triggerを第一経路にする
- TTSは1文ずつではなくscene speech group単位で合成し、SSML markで文・chunk境界を取る
- learning pointは3つ維持しつつ、専用phrase sceneは1〜2回にする
- manifestへnews pegを正式追加し、時事を入口にすることをデータ契約で保証する
- 8プリミティブは増やさず、音声同期のcurrent focusを加える

詳細は[v2.1設計修正](docs/V2_1_CHANGES.md)を参照。ここに明記された項目は既存v2文書の同一論点より優先する。

## 決定済みの仕様

| 項目 | v2.1 |
|---|---|
| 視聴者 | 日本語話者・B1中心。英文を読めば分かるがニュース音声には追いつけない成人 |
| 題材 | テクノロジーと生活、仕事とお金の仕組み、科学と社会。必ずnews pegを持ち、時事を入口に背景を説明 |
| 長さ | 360〜480秒。8分への水増しなし |
| 言語 | 英語音声、意味単位の英語字幕。日本語は語句補助。任意選択の日本語SRTも生成 |
| 学習 | 3表現、専用phrase scene 1〜2回、既出音声を使う聞き取り1回、最後に3表現の回収 |
| 画面 | 1920×1080 / 30fps。文章・比較・因果図を中心とする8プリミティブ＋current focus |
| 制作 | 日次探索、火・木・土20:00 JSTを公開枠とする週3本上限。品質未達なら欠番 |
| 初期検証 | 12本。最初の3本は公開前に全編確認。公開操作は初期設定で無効 |
| 自動化 | エージェントは内容JSONを生成。freeze後にREADYをcommitし、Actionsがprepareを開始 |
| 音声 | scene speech group単位のTTS。SSML markでutterance/chunk境界を取得 |
| レンダリング | GitHub Actions。Pagesは許可済みfixtureだけのPlayerプレビュー |

## 読む順番

1. [v2.1設計修正](docs/V2_1_CHANGES.md)
2. [第三者レビューと決定](docs/REVIEW_AND_DECISIONS.md)
3. [編集・学習仕様](docs/EDITORIAL_SYSTEM.md)
4. [画面・シーン仕様](docs/VISUAL_SYSTEM.md)
5. [データ契約](docs/DATA_CONTRACT.md)
6. [アーキテクチャ](docs/ARCHITECTURE.md)
7. [クラウド確認・レンダリング](docs/PREVIEW_AND_RENDER.md)
8. [定期運用](docs/OPERATIONS.md)
9. [受け入れ・実装順](docs/IMPLEMENTATION_PLAN.md)
10. [パイロットと評価](docs/PILOT_AND_MEASUREMENT.md)
11. [編集エージェント工程・設定](docs/AGENT_PIPELINE.md)
12. [出典](docs/SOURCES.md)

[AGENTS.md](AGENTS.md)は担当エージェント向けの入口。新規実装の構造正本は[schema v2.1](schemas/episode-v2.1.schema.json)。旧[episode.schema.json](schemas/episode.schema.json)はv2.0参照用に残す。意味上の制約はデータ契約とv2.1修正文書を合わせて読む。

## このリポジトリで今実行できる検査

既存 `scripts/check_contract.py` はv2.0設計検査であり、v2.1のnewsPeg・phrase 1〜2・speech-group契約まではまだ検査しない。M1でAjv/semanticValidateへv2.1検査を実装する。現時点で既存v2.0検査を実行する場合は以下。

```text
python -m pip install -r requirements-design.txt
python scripts/check_contract.py
```
