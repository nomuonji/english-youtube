# Implementation status

最終更新: 2026-09-15

## 実装済み・検証済み

- Node / TypeScript / React / Remotion / Vite のプロジェクト基盤
- npm lockfile固定、CIは `npm ci`
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
- Remotion composition + resolved audio clip再生
- Vite + Remotion Playerのブラウザpreview
- GitHub Actions CI
- GitHub connectorからのREADY commitでActionsが起動することを実地確認
- provider-neutral measured timing compiler
- Kokoro ONNX 0.6.1 を使う完全ローカルTTS
  - API key / external TTS API不要
  - int8 model
  - sceneごとに最終WAVを1本生成
  - MVPではpedagogical chunkごとにローカル合成してscene WAVへ連結
  - chunk start/endは実sample位置から生成し、語数・固定秒数による推定をしない
  - retrieval音声はsource story WAVの実sample範囲から切り出し、再合成しない
- Kokoro timing bundleから `ResolvedEpisode` を生成
- READY gate内で `READY -> hash validation -> Kokoro TTS -> exact timing compile -> Remotion 540p render -> artifact upload`
- 540p H.264 + AAC MP4の実レンダリング
- Actions render環境へNoto CJKを導入し、日本語micro-gloss用font fallbackを追加

### 実地検証

- CI run `34925340786`: typecheck / unit tests / v2.1 fixture validation / Vite build success
- Kokoro preview run `34925340821`: local TTS / exact timing compile / 540p MP4 / artifact upload success
- READY end-to-end run `34925648577`: READY hash gateからKokoro音声付き540p artifactまで全step success
- READY end-to-end artifact: `ready-preview-2026-09-15-v21-demo-c928698c7c534f720b8b62728a25a7dc9384a76f`

## TTS provider判断

### 現在採用: Kokoro ONNX

MVPでは `kokoro-onnx==0.6.1` を採用する。GitHub Actions runner上で完全ローカルに推論でき、API key・無料枠・外部TTS endpointの可用性に依存しない。

現在は音声品質よりタイミングの確実性を優先し、各chunkを個別生成してからscene WAVへ連結している。このためchunk境界は生成済み音声のsample数そのものであり、推定値ではない。将来prosodyを改善する場合はfull-scene synthesis + provider timing / forced alignmentへ差し替えるが、`MeasuredTimingBundle` 以下の契約は維持する。

### 却下: Edge TTS

`edge-tts==7.2.1` をzero-key候補として実装・Actions上でprobeしたが、Microsoft speech WebSocket endpointがGitHub-hosted runnerからHTTP 403を返したため、自動生成の本線providerには採用しない。Edge専用workflow / adapter / compilerは削除済み。

## 未実装 / 未検証

- Noto CJK導入後の再レンダリング画像確認
- DOM overflow / safe-area QAの自動化
- contact sheet生成
- final 1080p render gate
- GitHub Pages deployment
  - workflowは用意済み
  - repository側で Pages source を GitHub Actions に一度設定する必要あり
- GCS / OIDC / immutable archive
- review / approve state
- YouTube adapter
- YouTube upload / publish
- production manifestを作る定期agent本体
- 実ニュース1本でのproduction validator -> READY -> render end-to-end試験
- provider/model cacheによるActions実行時間最適化

## 注意

`buildDemoResolved.ts` はPlayer UIを確認するための無音fixture用疑似timingであり、production compilerではない。本番経路は `tts-timing.json -> compile:tts -> render-props.json` を使う。

`episodes/2026-09-15-v21-demo/` と `runs/2026-09-15/connector-probe/READY.json` はREADY経路を検証するためのfixture/probeであり、公開対象ではない。

publishは引き続きdisabled。レビュー・archive・YouTube gateを実装するまでREADY成功だけで公開してはいけない。
