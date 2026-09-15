# 外部仕様の確認記録

確認日：2026-09-15。ここにある外部情報と、本設計の独自判断を混同しない。実装時にAPI・利用条件・料金・依存版を再確認する。

| ID | 一次資料 | 確認内容 / 設計への反映 |
|---|---|---|
| S01 | [YouTube monetization policies](https://support.google.com/youtube/answer/1311392?hl=en) | 反復・量産と付加価値。scene順変更だけで独自性を保証しない |
| S02 | [Audience retention](https://support.google.com/youtube/answer/9314415?hl=en) | 冒頭30秒や離脱位置の確認。過去の減速原因を断定しない |
| S03 | [Remotion Player](https://www.remotion.dev/docs/player) | Reactへの埋込と対話的preview |
| S04 | [Remotion server rendering](https://www.remotion.dev/docs/ssr) | サーバーレンダリングの入口。Actions環境の詳細はM1で検証 |
| S05 | [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | 静的hosting、planとrepo visibilityの条件 |
| S06 | [deploy-pages](https://github.com/actions/deploy-pages) | Pages artifactからdeploy、page_url出力 |
| S07 | [Workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) | scheduleの条件と遅延。定刻配信保証にしない |
| S08 | [Google TTS SSML](https://docs.cloud.google.com/text-to-speech/docs/ssml) | SSML mark/timepoints。採用voiceとの動作は実API probe必須 |
| S09 | [YouTube videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) | upload、status、未監査projectのprivate制限 |
| S10 | [Synthetic content disclosure](https://support.google.com/youtube/answer/14328491?hl=en) | 内容に応じた開示判断。TTS注記だけで全手続きを代替しない |
| S11 | [Workflow artifacts](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow) | preview/finalの一時的な共有。永続archiveと分ける |
| S12 | [Remotion licensing](https://www.remotion.dev/docs/license) | 利用組織の条件をM0で確認する入口 |

ローカル観測：対象repoはpublic、mainはdeacb1e、作業開始時clean。Pages APIは404。error-english-videoのpackageにGoogle Cloud TTSとRemotionが存在、workflowはGitHub Actionsのクラウド生成を使用。認証情報の有効性・収益・Analyticsは未確認。

会話の登録者数、競合の空白、市場成長、テンプレ疲れに関する主張はこの仕様の根拠に採用していない。新規の数値目標は実験用の設計値。
