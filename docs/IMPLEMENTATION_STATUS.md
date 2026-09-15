# Implementation status

最終更新: 2026-09-15

## 実装済み

- Node / TypeScript / React / Remotion / Vite のプロジェクト基盤
- v2.1 JSON Schema を読む Ajv validator
- v2.1 semantic validator
  - newsPeg claim参照
  - role / visual整合
  - utterance ownership / order
  - chunk / translation整合
  - phrase scene 1〜2
  - phrase未使用learning pointのsource gloss
  - retrievalの過去story参照
  - recap 3表現
  - production用の主要なevidence / freshness / beat / word count検査
- canonical manifest hash
- READY.json とmanifest hashの検査CLI
- v2.1 fixtureと契約テスト
- 8 visual primitiveの初期React実装
- chain / compare / timelineのcurrent focus
- 英語字幕、inline gloss、phrase / retrieval / recap UI
- Remotion composition
- Vite + Remotion Playerのブラウザpreview
- GitHub Actions CI
- READY path専用のActions gate

## 未実装 / 未検証

- package-lock.json固定（現在CIはnpm install。M1完了前にlockをcommitしてnpm ciへ切替）
- Google Cloud TTS実接続、scene speech group、SSML mark
- speech-group resolved compiler
- retrieval WAV切り出し
- bundled Inter / Noto Sans JP font assetsとfont load hard fail
- DOM overflow QA
- 540p preview render / contact sheet / final 1080p render
- GitHub Pages deployment
- GCS / OIDC / archive
- YouTube adapter
- READY commit -> workflow起動の定期エージェント実接続probe
- publishは引き続きdisabled

## 注意

`buildDemoResolved.ts` はPlayer UIを確認するための無音fixture用の疑似timingであり、production compilerではない。productionの時刻を語数や固定秒数から推定してはいけない。
