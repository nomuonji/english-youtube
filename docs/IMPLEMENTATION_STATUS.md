# Implementation status

最終更新: 2026-09-16

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
- 8 visual primitiveのReact実装
- chain / compare / timelineのcurrent focus
- 英日同時caption、phrase / retrieval / recap UI
- story captionから常設の語彙意味pillを除去し、通常視聴時の同時情報量を削減
- viewer navigationをscene番号ではなく4章へ変更
  - `1 / 4 WHAT CHANGED`
  - `2 / 4 HOW IT WORKS`
  - `3 / 4 THE CATCH`
  - `4 / 4 WHAT IT MEANS`
  - hook / practice / recapはSTART / PAUSE / ENDとして表示
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
- READY gate内で `READY -> hash validation -> retention/cognitive review -> Kokoro TTS -> optional editorial images -> exact timing compile -> Remotion 540p render -> loudness normalization -> 3x3 contact sheet -> artifact -> Pages review deploy`
- 540p H.264 + AAC MP4の実レンダリング
- Actions render環境へNoto CJKを導入し、日本語font fallbackを追加
- Noto CJK導入後の実レンダリング画像を確認し、日本語glyphが正常表示されることを確認
- FFmpegによる3x3 contact sheet生成とartifact同梱を実地確認
- GitHub Pages review deployment
  - review URL: `https://nomuonji.github.io/english-youtube/review/`
  - READY artifactからvideo / contact sheetを自動配置
- stale READY deploy防止
  - deploy直前にmain履歴上の最新READY commit SHAを判定
  - 古いREADY runはartifact生成までは許可するがPages deployをskip
  - 並行render完了順によるreview page巻き戻りを防止
- optional editorial image layer
  - 最大3枚/episode
  - hook / mechanism / complication等、説明文を減らせるsceneだけ候補化
  - phrase / retrieval / recapには生成画像を入れない
  - Cloudflare Workers AI `@cf/black-forest-labs/flux-1-schnell` adapter
  - `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` が無い場合は安全にskip
  - manifest hash単位でimage cache
  - APPROVED側ではREADYでレビュー済みcacheだけを再利用し、承認後に新規画像を生成しない
- 明示承認用 `APPROVED.json` validator
  - sibling READYとのrunId / episodeId / revision / manifestHash一致を検査
  - frozen manifestのcanonical hashを再計算
  - approvedAtを検査
- APPROVED pushだけで起動する1080p final-render workflow
- 日次エージェントはAPPROVEDを作らない、という承認境界を `AGENTS.md` に明文化
- video quality policy
  - one focus per moment
  - coherence / signaling / temporal contiguity / segmenting
  - 30〜60秒ごとのmicro payoff
  - meaningful pattern break
  - YouTube公開後は30秒Intro / Top moments / Spikes / Dipsを次回制作へ戻す

### 実地検証

初期fixture/probe:
- CI run `34927253616`: approval-gated final-render workflow追加後もCI success
- CI run `34927278809`: AGENTS承認境界更新後もCI success
- Preview Pages run `34927235349`: build / deploy success
- READY review run `34927338075`: READY validation / Kokoro TTS / exact timing / 540p render / contact sheet / artifact upload 全step success
- READY review artifact `10379848702`: 59.86秒、960x540、H.264 + AAC
- contact sheet実画像で日本語glyphが正常表示されることを確認

実ニュースproduction episode:
- episode: `2026-09-15-ai-power-project`
- manifest hash: `80364176a18590a36ddc19519b7f87f270c7c905f0ab8d37edb7dc763104c71a`
- v6 READY commit: `c3443b4897df905de2f250e197bceed4076f2ed2`
- READY run `35011005478`: synthesize / render / deploy_review 全job success
- review artifact `10414380850`
- 実動画長: 約430.2秒
- retention review: hard failure 0、warning 0、score 100
- cognitive review: hard failure 0、warning 0、score 100
- TTS cache: 116 chunks hit / 0 missを確認したrunあり
- 4章navigation、英日caption、phrase、retrieval、recapを実フレームで確認
- Cloudflare secrets未設定時、image briefは3scene生成しつつ `cloudflare_credentials_missing` で画像だけskip、`imageAssets: 0` のままrender成功するfallbackを実証

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
- Cloudflare FLUX実画像入りREADY
  - adapter / brief / cache / rendererは実装済み
  - GitHub Actions secrets未設定のため実画像生成だけ未発火

## 未実装 / 未検証

- DOM overflow / safe-area QAの自動化
- GCS / OIDC / immutable archive
- YouTube adapter
- YouTube upload / publish
- production manifestを作る定期agent本体
- 実公開後analyticsの自動取得と次回manifestへのfeedback適用
- production向け画像生成のhuman visual QA基準の自動化

## 注意

`buildDemoResolved.ts` はPlayer UIを確認するための無音fixture用疑似timingであり、production compilerではない。本番経路は `tts-timing.json -> compile:tts -> render-props.json` を使う。

`episodes/2026-09-15-v21-demo/` と各connector/review probe READYは経路検証用であり、公開対象ではない。

publishは引き続きdisabled。APPROVEDは1080p final renderの許可であり、YouTube公開の許可ではない。
