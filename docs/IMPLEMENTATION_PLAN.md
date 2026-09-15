# 実装計画と受け入れ条件 v2

## 0. 完了の定義

このコミットは設計変更。renderアプリは未実装。添付のschemaとPython契約検査が通ることと、動画制作ができることを分ける。以下は実装担当への発注単位。順序はM0→M1→M2→M3→M4→M5→M6。各段階の成果物・合否をREADMEに追記する。

## M0 — 外部接続・制約確認

成果：config/deployment.example.json、provider-probe report、採用版一覧、費用snapshot。秘密値は含めない。

- Remotion利用条件を利用組織に照らして確認し記録。
- Google TTS 10文を同voice・rateで生成し、各chunk mark、自然さ、数字の読み、6〜10秒のretrieval候補を確認。
- GCS private bucket、OIDC、create-if-absentとgeneration CASを実際に試す。
- GitHub Actions/Pages利用条件、保存上限、課金設定を記録。
- YouTube adapterは公開しない接続試験でchannel ID、必要scope、API監査状態を確認。
- ブロック要因は設定不足として明示。別serviceやvoiceへ無断fallbackしない。

合格：TTS clipの境界が3frames以内、WPM125〜155、全秘密値が成果物にない。公開関連の資格情報が未提供でもM1〜M4のoffline/render作業は進められるがM5公開試験は未完了とする。

## M1 — 契約とcompiler

成果：package-lock、strict tsconfig、schema生成型、Ajv validator、semanticValidate、resolvedと運用成果物のruntime schema、固定voice/design/policy config、CLI validate/prepareのoffline版。

単体テストは最低限以下を実装：

| ID | 入力 | 期待 |
|---|---|---|
| C01 | 8種類の正しいvisual | 全てaccept |
| C02 | metricにvalueなし、未知variant追加 | reject |
| C03 | 同一ID、未知claim、別sceneのreveal参照 | E_DUPLICATE_ID/E_REFERENCE/E_REVEAL |
| C04 | chunks連結とtextが不一致 | E_TEXT |
| C05 | phraseが未出、recapに別lp、retrievalが未来文 | E_LEARNING/E_RETRIEVAL |
| C06 | 期限切れ事実、一次資料0、独立主体1 | productionでreject |
| C07 | sample数48001、fps30 | ceilで31frames、最後まで音声保持 |
| C08 | mark逆順/欠落、cue0frames | E_ALIGNMENT |
| C09 | source音声8秒のretrieval | 26秒、2回同じasset、初回cue0 |
| C10 | 長い語で幅overflow、1cueが20chars/sec超 | E_CAPTION_DENSITY |
| C11 | 同bundleを2回compile | canonical resolved hash一致 |
| C12 | ../secret、外部asset URL | decode/render前にreject |

合格：すべて実測または独立した期待値で検査。fixtureの再保存値とだけ比較するテストにしない。kind=productionへ変更した短いfixtureはproduction検査に失敗すること。

## M2 — 8プリミティブと音声

成果：1つのEpisodeVideo composition、全scene、caption、音声adapter。固定TTS済みoffline bundleを用意。fixture manifestに音声を同梱したと誤解させない。

visual boundary fixture：最大文字数、英語の長い単語、日本語24文字、4node、3row、4event、単位つきmetric、retrieval全phase、recap3表現。指定座標とfontでDOM overflow検査。

合格：全scene/frameでoverflow0、フォント未読込時render停止、同じframeで同じ画像。聞き取り課題の正解が初回字幕から漏れない。最後の音声・字幕が切れない。

## M3 — リモート確認

成果：Vite Player、ci.yml、preview-pages.yml、prepare-preview.yml。fixture allowlist、Pages URL、run summary、全編preview MP4/contact sheet。

合格：別端末のブラウザからPagesを開き再生・seek・scene移動・リロード。/english-youtube/のbase pathで音声とfontを取得。Pagesにepisodes/runs/秘密値が含まれないことをdist検査。fork PRでsecret不要。PRでPagesが上書きされない。

## M4 — 本番書き出し

成果：production-render.yml、QA CLI、archive。1本の360〜480秒のproduction条件を満たすパイロットbundle。

合格：540pと1080pが同一bundleHash、全音声event・字幕文字・scene長一致。production画面、音量、誤字、事実を全編レビュー。最終MP4の実測durationとresolvedの差≤1frame。artifactを消してもGCSから同bundleを復元できる。再renderのbit完全一致は要求せず、frame/音声内容/時刻の一致を要求する。

## M5 — 定期・再開・公開

成果：pipeline CLI、state machine、GCS CAS/lease、台帳、費用予約、YouTube resumable adapter、publish.yml（初期disabled）。

障害注入試験：

| ケース | 期待 |
|---|---|
| 二つのworkerが同時開始 | 片方だけstage所有権を持つ |
| TTS途中で中断 | 完成clipを再課金生成しない |
| render直後state保存前に中断 | 保存済みchecksumを照合して再開 |
| artifact期限切れ | archiveから復元 |
| hashを1文字改変 | 本番/公開停止 |
| API429 | 上限内backoff、3attempt後停止 |
| 予算不明/超過 | 次の有料呼び出しなし |
| upload完了直後通信断 | 新規insertしない、session照合 |
| captionだけ失敗 | videoIdを再利用しcaptionから再開 |
| 事実が公開前に変更 | revision更新、旧予約をそのまま進めない |
| API project private制限 | 公開完了と報告しない |

実YouTubeへのuploadは所有者の指示と資格情報がある段階で非公開のfixture以外の承認済み動画で試験。fixture公開禁止は試験でも維持する。公開許可がなくてもmock serverによる障害試験は完了できる。実upload未検証を明示する。

## M6 — 12本の検証

成果：12本のtopic ledger、7日/28日指標、3本ごとの編集レビュー、最終判断。測定詳細は[パイロット](PILOT_AND_MEASUREMENT.md)。

合格：12本公開したことだけで成功としない。学習部分の離脱、視聴理解、制作費用の判定を記録。次に変える変数を一つ選び仕様版を更新。数字が不足すれば「判定保留」とする。

## 実装担当が選べないこと

尺、8種類のscene、role、字のサイズ、色、音声providerの初期値、字幕の時刻方式、週3枠、YouTube初期無効、失敗時の再試行数、data contract、公開とrenderの責務分離。

実装担当が選べること：純粋関数の分割、テストhelper名、性能を改善する内部処理。ただし出力・契約・費用・外部serviceを変えない。依存patchの確定はM1の互換性検証で行い、未確認の最新版を設計書だけで固定しない。

## 将来変更の条件

地図：12本中3本以上が位置関係の不足で不採択になり、scene requestに根拠がある場合だけ検討。Shorts：長尺12本の検証後。BGM：聞き取り理解を損なわない試験ができた後。自動公開：運用仕様の条件と所有者の指示を満たした後。
