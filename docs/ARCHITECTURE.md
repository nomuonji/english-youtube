# アーキテクチャ v2

## 1. 採用構成と責任

Node.js 22 LTS系、TypeScript strict、React、Remotion 4系、Vite、Ajv2020＋ajv-formats。実装M1で互換性を確認した正確なpatchをpackage-lockと.tool-versionsへ固定。すべての@remotion/*とremotionは同一版。既存error-english-videoの依存版を無条件に移植しない。Pythonは設計検査だけで制作runtimeには不要。

```text
editor agent -> manifest + research + review
  -> validate -> freeze
  -> prepare (TTS / captions / resolved / hashes)
  -> preview render -> QA
  -> production render -> final QA
  -> durable archive -> publish adapter (disabled by default)
```

| モジュール | 入力→出力 | 禁止事項 |
|---|---|---|
| contracts | JSON→型付きデータ＋errors | 暗黙の型変換 |
| editorial | 出典＋候補→manifest/review | frame/CSS/音声決定 |
| speech | utterance＋voice profile→WAV＋marks | 原稿の改稿、別voiceへの自動fallback |
| compiler | manifest＋clips→resolved | API呼び出し、語数で音声時刻推測 |
| composition | resolved＋local assets→React scene | research/TTS、外部取得 |
| preview app | bundle→Player＋QA表示 | manifestを独自タイミングで再計算 |
| render CLI | bundle＋profile→MP4 | 音声再生成 |
| operations | state＋成果物→次stage | uploadの盲目的再試行 |

ディレクトリ：src/contracts、src/compiler、src/scenes、src/composition、src/preview、src/cli、src/adapters/speech、src/adapters/youtube。config/voice.json、config/policy.json、config/design-tokens.jsonを固定する。

## 2. 音声providerの選定

初期providerはGoogle Cloud Text-to-Speech、voice=en-US-Neural2-F、languageCode=en-US、speakingRate=0.90、pitch=0、LINEAR16。SSML markによる意味チャンク境界取得を採用。以前のプロジェクトにGoogle TTS依存はあるが、認証が使えるとは仮定しない。

M0でv1beta1のtimepoint返却とvoiceの組み合わせを実APIで検証する。サンプル10文で自然さ、固有名詞、数値、chunk位置を確認。不対応・品質不合格ならM0不合格。markを返さない音声へ黙って切り替えず、profileを改訂する。[Google SSML](https://docs.cloud.google.com/text-to-speech/docs/ssml)

1utterance=1リクエスト。SSMLはコンパイラだけが組み立て、原稿のXML文字をescape。各chunkの直前に一意なmarkを挿入。末尾はファイルの実測終端を使用し、無音末尾の長さも保存する。モデルの返すmark欠落、重複、逆順はE_ALIGNMENT。文字数比で補完しない。

WAVは48kHz mono PCM16にresample、全episodeの音声を解析して一つの共通gainを求める。目標-16 LUFS、最終peak -1dBTP以下。各文別の強いnormalizationで音量が揺れないようにする。必要なら全体limiterを使い、最終音声で再測定。BGM/SFXは入れない。

## 3. 話速とタイミング

1分あたり130〜150wordsが目安、episodeの実測平均125〜155なら合格。speakingRateの設定値だけでWPMを保証しない。読み間違いはutteranceを修正しrevisionを上げる。単語の音声だけを切り貼りしない。

WAV長samplesと48kHzからaudioFrames=ceil(samples×30/48000)。文間は6frames（200ms）。通常scene冒頭は6frames、末尾は12frames。scene.durationFrames = 6 + ΣaudioFrames + 6×(文数-1) + 12。recap末尾は12でなく90frames。scene切替で文頭を削らない。

retrievalは固定phase：prompt 90frames、listen Fframes、think 90frames、reveal Fframes、answer 120frames。Fはsource音声のaudioFrames。utterance開始時刻はlisten開始とreveal開始。通常scene用の冒頭・末尾paddingはretrievalへ足さない。

音声samples境界→frameは各境界をround(samples×30/48000)し、最後だけceil(samples×30/48000)。字幕cueは半開区間[start,end)。整数化で0frameになる場合は不合格。字幕表示は音声開始に対して最大2frames先行可、遅延は3frames以内。実測markがずれているときはプロバイダ試験へ戻す。

## 4. 字幕compiler

chunkを文頭から順に詰め、最大72文字・2行・1行40文字・幅1632pxをすべて満たす最長の連続chunk集合を1cueにする。Inter64pxで実測。単一chunkが収まらなければ編集へ戻す。改行は単語間のみ。2行の最大幅が最小になる位置を採用し、同点は前半が短い方。

1cueの表示0.8〜6.0秒。長すぎるcueはchunk境界で分割、短すぎるcueは次へ結合し、制約内にできなければE_CAPTION_DENSITY。文字/秒は最大20（空白含む）。音声を遅くして無理に通さない。

英語SRTは焼き込みcueと同じ時刻と文字。日本語SRTはtranslationJaChunksを対応する英語chunkの時刻へ割り当て、2行以内（1行24文字）にする。連続した和訳chunkを最大48文字まで結合するが、表示は0.8〜6秒、最大12文字/秒とする。範囲内にできなければ翻訳を修復する。runtimeが新しい訳や意味区切りを生成してはいけない。retrieval初回の音声区間は両言語ともcueなし。答え再生時だけ生成。ミリ秒変換round(frame×1000/30)、終了は次cue開始を超えない。

## 5. 正規化bundle

prepareはTTS、font解決、captions、timelineを完了してからbundleを凍結する。Playerとrendererは同じbundleHashとengineCommitで描画。描画中のfetchはbundleに含まれる同一originの音声・fontのみ。MP4レンダリングは外部ネットワークなしで成立すること。

bundleにmanifest全文を同梱。compositionはsceneIdでmanifestのvisualを取得し、resolvedの時刻で表示。別バージョンのmanifestとの組み合わせはhash検査で拒否。

## 6. CLIの必須インターフェース（実装対象）

```text
npm run validate -- --episode episodes/<id>/manifest.json
npm run prepare -- --episode episodes/<id>/manifest.json --out work/<id>
npm run preview:build -- --bundle work/<id>/bundle --out dist
npm run render -- --bundle work/<id>/bundle --profile preview --out out
npm run render -- --bundle work/<id>/bundle --profile production --out out
npm run qa -- --bundle work/<id>/bundle --render out --stage final
npm run publish -- --receipt <path> --bundle-hash <hash> --mode private
npm run pipeline -- --run-id <id> --resume
```

exit 0=成功または記録済みskipped、2=入力/編集不合格、3=provider一時障害、4=設定不足、5=費用上限、6=公開状態不明。結果をstdout一行JSONで返し、診断はstderr。秘密値は出力しない。パスはCLIで許可root内へresolveし、URLやshell断片として評価しない。

## 7. 再利用と移行

旧schemaは廃止、旧scene名へのfallbackなし。旧revisionの文書はGit履歴で参照する。現repoにはepisode実データがないためデータ移行は不要。以前のプロジェクトから再利用するのはAPI呼び出しの知見だけ。過去の高権限workflow、SNS投稿、token cache、固定scene sequenceはコピーしない。
