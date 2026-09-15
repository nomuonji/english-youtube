# 実装計画と受け入れ条件 v2.1

## 0. 完了の定義

この段階は設計更新。renderアプリは未実装。schemaや静的契約が存在することと、動画制作パイプラインが完成していることを分ける。実装順はM0→M1→M2→M3→M4→M5→M6。

## M0 — 外部接続・制約確認

成果：config/deployment.example.json、provider-probe report、採用版一覧、費用snapshot。秘密値は含めない。

必須probe：

- Remotion利用条件を利用組織に照らして確認。
- Google TTSで3〜5文のscene speech groupを複数生成し、utterance/chunk mark、自然さ、固有名詞、数値、6〜10秒retrieval候補を確認。
- 同じscene原稿でcache keyが安定することを確認。
- GCS private bucket、OIDC、create-if-absent、generation CASを実測。
- **定期エージェントが実際に使うGitHub接続でREADY.jsonをcommitし、main pushのpath filterからprepare用test workflowが起動することを実測。**
- READY以外のepisode commitではprepare workflowが起動しないことを確認。
- GitHub Actions/Pages利用条件、保存上限、課金設定を記録。
- YouTube adapterは公開しない接続試験でchannel ID、scope、API監査状態を確認。

READY pushが起動しない場合はM0 reportへ記録し、manual workflow_dispatchをfallbackとして採用する。別serviceを自動追加しない。

合格：TTS mark境界が3frames以内、WPM125〜155、連続音声が不自然な文分断にならない、全秘密値が成果物にない。公開資格情報がなくてもM1〜M4は進められる。

## M1 — 契約とcompiler

成果：package-lock、strict tsconfig、`episode-v2.1.schema.json` からの型、Ajv validator、semanticValidate、resolved/runtime schemas、固定voice/design/policy config、CLI validate/prepareのoffline版。

v2.1 schemaが参照するv2.0 `$defs` はAjvへ両schemaをローカル登録するか共通定義schemaへ抽出する。HTTP取得へ依存しない。

最低限の単体テスト：

| ID | 入力 | 期待 |
|---|---|---|
| C01 | 8種類の正しいvisual | 全てaccept |
| C02 | metricにvalueなし、未知variant | reject |
| C03 | 同一ID、未知claim、別sceneのreveal参照 | E_DUPLICATE_ID/E_REFERENCE/E_REVEAL |
| C04 | chunks連結とtext不一致 | E_TEXT |
| C05 | newsPeg.eventClaimIdが不存在/根拠なし | E_NEWS_PEG |
| C06 | phrase scene 1件＋残り2pointが初出gloss | accept |
| C07 | phrase scene 2件＋残り1pointが初出gloss | accept |
| C08 | phrase未使用pointのgloss欠落/別scene | E_LEARNING |
| C09 | recapに別lp、retrievalが未来文 | E_LEARNING/E_RETRIEVAL |
| C10 | 期限切れ事実、一次資料0、独立主体1 | productionでreject |
| C11 | scene speech groupのmark逆順/欠落 | E_ALIGNMENT |
| C12 | speech group内utterance境界からcaption cue生成 | 実測境界と一致 |
| C13 | source音声8秒のretrieval切り出し | 26秒、listen/reveal同一segment hash、初回cue0 |
| C14 | 長い語でoverflow、1cueが20chars/sec超 | E_CAPTION_DENSITY |
| C15 | 同bundleを2回compile | canonical resolved hash一致 |
| C16 | ../secret、外部asset URL | decode/render前にreject |
| C17 | READY manifestHash不一致 | prepare前にblocked |

kind=productionへ変更した短いfixtureはproduction検査に失敗すること。

## M2 — 8プリミティブと音声

成果：EpisodeVideo composition、全scene、caption、speech adapter、固定TTS済みoffline bundle。

visual boundary fixture：最大文字数、長い英単語、日本語24文字、4node、3row、4event、metric、phrase 1/2両ケース、retrieval全phase、recap3表現。

current focus検査：

- chainでreveal後に該当nodeがcurrentになる
- compareで該当rowがcurrentになる
- timelineで該当eventがcurrentになる
- 次revealでfocusが移る
- focusは色だけに依存しない
- current focusがclaim以上の意味を追加しない

音声検査：同一scene speech groupからcaptionとretrieval segmentを生成し、最後の音声・字幕が切れない。

合格：全scene/frameでoverflow0、フォント未読込時render停止、同じframeで同じ画像、retrieval正解が初回字幕から漏れない。

## M3 — リモート確認

成果：Vite Player、ci.yml、preview-pages.yml、prepare-preview.yml、fixture allowlist、Pages URL、全編preview MP4/contact sheet。

prepare-preview主トリガーはmain pushかつ `runs/**/READY.json` の追加。manual dispatchはfallback。

合格：

- 別端末ブラウザからPagesを再生・seek・scene移動・reload
- `/english-youtube/` base pathで音声/font取得
- Pagesにepisodes/runs/秘密値なし
- READY以外のepisode commitでprepareが起動しない
- READY hash不一致でprepare停止
- 同じREADYの再処理がidempotent
- PRでPagesが上書きされない

## M4 — 本番書き出し

成果：production-render.yml、QA CLI、archive、360〜480秒のproduction条件を満たすパイロットbundle。

合格：540pと1080pが同一bundleHash、全音声event・字幕・scene長一致。production画面、音量、誤字、news pegを含む事実を全編レビュー。artifact削除後もGCSから同bundleを復元できる。

## M5 — 定期・再開・公開

成果：pipeline CLI、state machine、GCS CAS/lease、台帳、費用予約、YouTube resumable adapter、publish.yml（初期disabled）。

障害注入：同時worker、TTS中断、render直後中断、artifact期限切れ、hash改変、API429、予算超過、upload後通信断、caption失敗、公開前の事実変更、API project private制限を試す。

READYはeditorial agent→Actionsの境界であり、Actions内部stage再開はGCS state/CASを使う。Actions自身のcommit連鎖に依存しない。

## M6 — 12本の検証

成果：12本のtopic ledger、7日/28日指標、3本ごとの編集レビュー、最終判断。

phrase sceneが1件のepisodeと2件のepisodeを記録し、learningDropを比較する。ただし十分な標本なしに「1件が優秀」と断定しない。

news pegについて、公開時点での鮮度、入口CTR、30秒retention、背景説明の理解を分けて観測する。

## 実装担当が選べないこと

尺、8 primitive、role、字サイズ、色、初期voice provider、字幕時刻方式、週3枠、YouTube初期disabled、data contract、READY境界、newsPeg必須、retrieval 1回、learningPoints 3件、公開/render責務分離。

実装担当が選べること：純粋関数の分割、test helper名、内部性能改善。ただし外部contract、費用、serviceを変えない。

## 将来変更の条件

地図：12本中3本以上が位置関係不足で不採択になった場合。Shorts：長尺12本検証後。BGM：聞き取り理解を損なわない試験後。自動公開：運用条件と所有者指示を満たした後。
