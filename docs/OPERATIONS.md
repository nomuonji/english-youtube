# 定期運用・公開仕様 v2.1

## 1. 実行主体

日次編集はユーザーが設定する定期エージェント。GitHub Actionsはprepare/render/publishの実行基盤。二つのschedulerで同じ編集処理を起動しない。

毎日07:17 JSTに探索、公開枠は火・木・土20:00 JST。JSTで日付と週（月曜開始）を判定。遅延実行は現在日付の台帳を確認し、過去枠をまとめて公開しない。正確な時刻公開が必要ならYouTube publishAtを使う。

日次エージェントとActionsの境界は `READY.json`。freeze後、エージェントは `runs/YYYY-MM-DD/<runId>/READY.json` を最後のGit変更として作成する。READYのpushがprepare-previewの主トリガー。日次エージェントがworkflow_dispatch APIを直接持つことを前提にしない。

M0で実際のGitHub接続からREADY commit→push workflow起動を検証する。起動できない場合はREADYを残してblockedとし、手動dispatchをfallbackにする。

## 2. state machine

```text
discovered -> researched -> scripted -> validated -> frozen -> ready
 -> prepared -> preview_passed -> final_passed -> archived
 -> upload_started -> uploaded_private -> scheduled -> published
```

任意の制作前段階→skipped、外部一時障害→retryable_failed、入力矛盾/設定不足→blocked。公開結果が不明ならupload_unknown。

各transitionはinputHash/outputHash、startedAt/finishedAt、attempt、workerId、costActualUsd/costReservedUsdを台帳に保存。state更新はCASで行う。manifest freeze後の変更はrevisionを上げ、validatedから再開し、新run/new READYを作る。

readyへの遷移条件：

- schema/semantic validation pass
- editorial review pass
- manifestHash確定
- READYがmanifestと同じepisodeId/revision/hashを持つ
- READYは一度作成したら上書きしない

## 3. 永続ストア

Google Cloud Storageのprivate bucketを一つ使用。M0でbucket名とregion=asia-northeast1をdeployment configに設定。bucket未設定はblocked、local temporary diskだけで成功扱いしない。GitにはJSON設計・編集データのみ。

- state/<episodeId>/r<revision>.json：現在状態、GCS generationでCAS更新
- runs/<runId>/events/<stage>-<attempt>.json：追記event
- assets/sha256/<hash>.wav：TTS/speech-group/retrieval assets。上書き禁止
- bundles/<bundleHash>/：resolved＋manifest＋checksums
- releases/<episodeId>/r<revision>/：final MP4、captions、thumbnail、metadata、QA
- locks/<episodeId>.json：create-if-absent、15分lease、60秒heartbeat

lease失効時はCASで新workerへ所有権を移す。旧workerは次state更新前に所有権を確認し停止。動画・音声・公開receiptは公開中の動画を再現できる間保持。失敗previewのみ30日で削除可。

OIDCでActionsからGoogle Cloudへ認証。OAuth client secret/refresh tokenはpublish environment secretsのみ。認証情報をGit/cache/Pagesへ出さない。

## 4. READYとprepareのidempotency

prepare-previewはREADYの内容を信用せずcheckout後に再計算する。

- manifest canonical hash == READY.manifestHash
- manifest episodeId/revision == READY
- workflow head SHAがREADYを含むcommitと一致
- 同一READYがprepared済みなら既存結果を再利用

hash不一致・manifest不在・revision不一致はblocked。別の最新manifestへ追従しない。

Actions自身がGITHUB_TOKENでcommitした結果の連鎖起動には依存しない。

## 5. 再試行

429/5xx/通信timeout：同じstage・同じinputHashで最大3attempt、30秒・120秒待つ。Retry-Afterがあればそれ以上待つがrun予算内。認証失敗・入力不正・事実不明は再試行しない。

編集修復は最大2回。TTS修復は欠損speech groupだけ再要求し、別hashならresolvedを作り直す。retrieval segmentは元speech groupの実測sample境界から再生成し、新しいTTSを呼ばない。

render再開：bundleHashとengineCommitが一致すれば同じbundleを使う。期限切れartifactはGCSから復元。hash不一致はblocked。

## 6. 費用上限

| 上限 | 初期値 |
|---|---:|
| 有料API費用/episode | USD 3 |
| 有料API費用/日 | USD 5 |
| 月間有料API＋storage予算 | USD 60 |
| render実行時間/episode、全attempt合計 | 90 runner分 |
| 月間render時間 | 1200 runner分 |
| 1日のfreeze episode数 | 1 |
| 未公開完成在庫 | 3 |

料金が不明なら有料処理を開始しない。上限超過で自動増額・自動モデル変更はしない。

## 7. 公開モード

config/policy.jsonのpublishModeはdisabled|private|scheduled、初期disabled。privateはYouTubeへの非公開uploadまで、scheduledは指定枠で公開予約まで。日次担当は変更しない。

scheduled有効化条件：最初の3本全編確認、12本分のパイプライン品質評価、重大誤り0、公開・復旧試験完了、所有者の明示指示。

公開枠60分前までにfinal_passed/archivedでなければ欠番。翌枠へ回す前にsource freshnessとnews peg freshnessを確認。本文が変わればrevision+1、new READY、再render。

## 8. YouTube adapter

M0でOAuth接続先channel IDを取得し設定値と一致確認。videos.insertは最初private。resumable uploadを使用し、開始前にupload intent（bundleHash）をCAS保存。videoIdを台帳へ保存してから次へ進む。

通信断後はresumable session状態を確認し、新しいinsertを自動発行しない。session不明ならupload_unknownとして停止・照合する。

video処理完了→thumbnail→英語/日本語captions→metadata検査→必要ならpublishAt。description末尾にepisodeId/revisionを残す。

## 9. 訂正

数値・主張・news peg・学習訳の重大誤りが判明したら新規自動公開を停止し、対象episodeをcorrection_requiredとして記録。既存動画の削除・非公開化は所有者指示に従う。

説明欄で補足できる誤記は訂正日時・変更前・変更後・出典を記録。理解を変える誤りは新版を別revisionで制作し、旧bundle/receiptを消さない。

## 10. 通知

正常な探索・skipped・待機では通知しない。通知対象はレビュー可能な完成動画、公開完了、復旧不能、予算上限、訂正必要、READY起動失敗、設定不足。各通知にepisodeId、現在stage、次に必要な具体操作、artifact/run URLを付ける。
