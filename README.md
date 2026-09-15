# english-youtube — World in Clear English

日本人の中級英語学習者が、世界の一つの出来事を英語で理解する、6〜8分のニュース背景解説。

**視聴者への約束：一つの「なぜ」が分かる。最後には、その説明を英語で聞き取れる。**

## 状態

2026-09-15、設計をv2に全面改訂。現在は**設計・JSON契約・契約検査のみ**。動画アプリ、TTS、Actions、Pages、YouTube連携は未実装。以下のコマンドやworkflow名は、明記した契約検査を除き実装対象であり、稼働済み機能ではない。

旧案の後継となる唯一の仕様はこのv2文書群。旧schemaとの互換性は持たせない。改訂理由と根拠は[レビュー](docs/REVIEW_AND_DECISIONS.md)を参照。

## 決定済みの仕様

| 項目 | v2 |
|---|---|
| 視聴者 | 日本語話者・B1中心。英文を読めば分かるがニュース音声には追いつけない成人 |
| 題材 | テクノロジーと生活、仕事とお金の仕組み、科学と社会。時事を入口に背景を説明 |
| 長さ | 360〜480秒。8分への水増しなし |
| 言語 | 英語音声、意味単位の英語字幕。日本語は語句補助。任意選択の日本語SRTも生成 |
| 学習 | 3表現、短い解説2回、既出音声を使う聞き取り1回、最後に3表現の回収 |
| 画面 | 1920×1080 / 30fps。文章・比較・因果図を中心とする8プリミティブ |
| 制作 | 日次探索、火・木・土20:00 JSTを公開枠とする週3本上限。品質未達なら欠番 |
| 初期検証 | 12本。最初の3本は公開前に全編確認。公開操作は初期設定で無効 |
| 自動化 | エージェントは内容JSONを生成。コンパイラが音声・字幕・フレームを確定 |
| レンダリング | GitHub Actions。Pagesは許可済みfixtureだけのPlayerプレビュー |

## 読む順番

1. [第三者レビューと決定](docs/REVIEW_AND_DECISIONS.md)
2. [編集・学習仕様](docs/EDITORIAL_SYSTEM.md)
3. [画面・シーン仕様](docs/VISUAL_SYSTEM.md)
4. [データ契約](docs/DATA_CONTRACT.md)
5. [アーキテクチャ](docs/ARCHITECTURE.md)
6. [クラウド確認・レンダリング](docs/PREVIEW_AND_RENDER.md)
7. [定期運用](docs/OPERATIONS.md)
8. [受け入れ・実装順](docs/IMPLEMENTATION_PLAN.md)
9. [パイロットと評価](docs/PILOT_AND_MEASUREMENT.md)
10. [編集エージェント工程・設定](docs/AGENT_PIPELINE.md)
11. [出典](docs/SOURCES.md)

[AGENTS.md](AGENTS.md)は担当エージェント向けの入口。[schema](schemas/episode.schema.json)が構造の正本、データ契約が意味上の制約の正本。衝突を見つけたら黙って片方を無視せず契約検査を失敗させ、同じ変更で両方を修正する。

## このリポジトリで今実行できる検査

Python 3.11以上とjsonschemaを使用する。依存導入後、次でschema自身、fixture、拒否すべき入力、ローカル文書リンクを検査できる。これは映像・音声・事実確認の検査ではない。

```text
python -m pip install -r requirements-design.txt
python scripts/check_contract.py
```
