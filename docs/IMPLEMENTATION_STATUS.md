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
- READY gate内で `READY -> hash validation -> Kokoro TTS -> exact timing compile -> Remotion 540p render -> 3x3 contact sheet -> artifact upload`
- 540p H.264 + AAC MP4の実レンダリング
- Actions render環境へNoto CJKを導入し、日本語micro-gloss用font fallbackを追加
- Noto CJK導入後の実レンダリング画像を確認し、日本語glyphが正常表示されることを確認
- FFmpegによる3x3 contact sheet生成とartifact同梱を実地確認
- GitHub Pages + Remotion Player deployment
  - Pages source: GitHub Actions
  - deploy run success
  - public URL: `https://nomuonji.github.io/english-youtube/`
- 明示承認用 `APPROVED.json` validator
  - sibling READYとのrunId / episodeId / revision / manifestHash一致を検査
  - frozen manifestのcanonical hashを再計算
  - approvedAtを検査
- APPROVED pushだけで起動する1080p final-render workflow
- 日次エージェントはAPPROVEDを作らない、という承認境界を `AGENTS.md` に明文化

### 実地検証

- CI run `34927253616`: approval-gated final-render workflow追加後もCI success
- CI run `34927278809`: AGENTS承認境界更新後もCI success
- Preview Pages run `34927235349`: build / deploy success
- Pages deployment URL: `https://nomuonji.github.io/english-youtube/`
- READY review run `34927338075`: READY validation / Kokoro TTS / exact timing / 540p render / contact sheet / artifact upload 全step success
- READY review artifact `10379848702`: 59.86秒、960x540、H.264 + AAC。contact sheetとtiming/render propsを同梱
- contact sheet実画像で日本語micro-glossがNoto CJKにより正常表示されることを確認

## TTS provider判断

### 現在採用: Kokoro ONNX

MVPでは `kokoro-onnx==0.6.1` を採用する。GitHub Actions runner上で完全ローカルに推論でき、API key・無料枠・外部TTS endpointの可用性に依存しない。

現在は音声品質よりタイミングの確実性を優先し、各chunkを個別生成してからscene WAVへ連結している。このためchunk境界は生成済み音声のsample数そのものであり、推定値ではない。将来prosodyを改善する場合はfull-scene synthesis + provider timing / forced alignmentへ差し替えるが、`MeasuredTimingBundle` 以下の契約は維持する。

モデル/ランタイムのライセンス記録は `docs/TTS_LICENSE.md` を参照する。

### 却下: Edge TTS

`edge-tts==7.2.1` をzero-key候補として実装・Actions上でprobeしたが、Microsoft speech WebSocket endpointがGitHub-hosted runnerからHTTP 403を返したため、自動生成の本線providerには採用しない。Edge専用workflow / adapter / compilerは削除済み。

## 実装済みだが、まだend-to-end未検証

- APPROVED.json -> 1080p final render
  - workflowとvalidatorは実装済み
  - ユーザーの明示承認がないため、テスト用APPROVEDを勝手に作らず未発火のまま

## 未実装 / 未検証

- DOM overflow / safe-area QAの自動化
- GCS / OIDC / immutable archive
- YouTube adapter
- YouTube upload / publish
- production manifestを作る定期agent本体
- 実ニュース1本でのproduction validator -> READY -> review end-to-end試験
- provider/model cacheによるActions実行時間最適化
- 実ニュース長尺での視聴体験調整（字幕密度、scene滞在時間、学習interrupt比率）

## 注意

`buildDemoResolved.ts` はPlayer UIを確認するための無音fixture用疑似timingであり、production compilerではない。本番経路は `tts-timing.json -> compile:tts -> render-props.json` を使う。

`episodes/2026-09-15-v21-demo/` と `runs/2026-09-15/connector-probe/READY.json`、`runs/2026-09-15/review-contact-sheet-probe/READY.json` は経路検証用のfixture/probeであり、公開対象ではない。

publishは引き続きdisabled。APPROVEDは1080p final renderの許可であり、YouTube公開の許可ではない。
