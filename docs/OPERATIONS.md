# 定期運用・公開仕様 v2

## 1. 実行主体

日次編集はユーザーが設定する定期エージェント。GitHub Actionsはprepare/render/publishの実行基盤。二つのschedulerで同じ編集処理を起動しない。本設計更新では定期タスク自体を作成しない。

毎日07:17 JSTに探索、公開枠は火・木・土20:00 JST。JSTで日付と週（月曜開始）を判定。cronを使う場合の探索UTCは前日22:17。遅延実行は現在日付の台帳を確認し、過去枠をまとめて公開しない。GitHub scheduleには遅延や実行条件があるため、正確な時刻配信が必要ならYouTube publishAtを使う。[公式イベント仕様](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## 2. state machine

```text
discovered -> researched -> scripted -> validated -> frozen
 -> prepared -> preview_passed -> final_passed -> archived
 -> upload_started -> uploaded_private -> scheduled -> published
```

任意の制作前段階→skipped（候補不合格）、外部一時障害→retryable_failed、入力矛盾/設定不足→blocked。公開結果が不明ならupload_unknown。skippedは異常ではない。blockedはこのパイプラインの状態名であり、Codex goal機能とは別。

各transitionはinputHash/outputHash、startedAt/finishedAt、attempt、workerId、costActualUsd/costReservedUsdを台帳に保存。state更新は比較交換（generation一致）で行い、途中結果を書いた後にstateを進める。manifest frozen後の変更はrevisionを上げ、validatedから再開。

## 3. 永続ストア

Google Cloud Storageのprivate bucketを一つ使用。M0でbucket名とregion=asia-northeast1をdeployment configに設定。bucket未設定はblocked、ローカルtemporary diskだけで成功扱いしない。GitにはJSON設計・編集データのみ。

- state/<episodeId>/r<revision>.json：現在状態、GCS generationでCAS更新。
- runs/<runId>/events/<stage>-<attempt>.json：追記event。
- assets/sha256/<hash>.wav：TTS asset。上書き禁止。
- bundles/<bundleHash>/：resolved＋manifest＋checksums。
- releases/<episodeId>/r<revision>/：final MP4、captions、thumbnail、metadata、QA。
- locks/<episodeId>.json：create-if-absent、15分lease、60秒heartbeat。

lease失効時はCASで新workerへ所有権を移し、旧workerは次のstate更新前に所有権検査し停止。upload jobは一つのconcurrency groupでも直列化する。動画・音声・公開receiptは公開中の動画を再現できる間保持、削除lifecycleを自動適用しない。失敗previewのみ30日で削除。日次で状態一覧をJSON exportして保存。

OIDCでActionsからGoogle Cloudへ認証する。workload identity provider、service account、bucket、YouTube channel IDはconfig。OAuth client secret/refresh tokenはpublish environment secretsのみ。権限はbucket内の必要prefixへ限定。認証情報をGit/cache/Pagesへ出さない。

## 4. 再試行

429/5xx/通信timeout：同じstage・同じinputHashで最大3attempt、30秒・120秒待つ。Retry-Afterがあればそれ以上待つがrun予算内。認証失敗・入力不正・事実不明は再試行しない。

編集修復：schema/semanticの失敗箇所と根拠だけを返し最大2回。TTS修復：欠損clipだけ再要求、再要求で別hashならresolvedを作り直す。render再開：bundleHashとengineCommitが一致すれば同じbundleを使う。期限切れartifactはGCSのbundleから復元。hash不一致はblocked。

## 5. 費用上限（料金表ではなく運用値）

| 上限 | 初期値 |
|---|---:|
| 有料API費用/episode（探索按分＋編集＋TTS＋修復） | USD 3 |
| 有料API費用/日 | USD 5 |
| 月間有料API＋storage予算 | USD 60 |
| render実行時間/episode、全attempt合計 | 90 runner分 |
| 月間render時間 | 1200 runner分 |
| 1日の凍結episode数 | 1 |
| 未公開完成在庫 | 3 |

実行前にprovider pricing snapshot（日付・単価・URL）で最大利用量を見積もり、台帳に予約する。usageが返ったら実費へ置換し余りを解放。料金が取得できない・不明なら有料処理を開始しない。Actions無料枠は当然視せず、課金設定をM0で記録。上限超過で自動増額・自動モデル変更はしない。推論モデルは定期エージェントの既存設定を使用し、runに識別子を記録する。

## 6. 公開モード

config/policy.jsonのpublishModeはdisabled|private|scheduled、初期disabled。privateはYouTubeへの非公開uploadまで、scheduledは指定枠で公開予約まで。設定変更は所有者の公開指示を受けたエンジニアリング変更として行う。日次担当が変更しない。

scheduledを有効にする条件：最初の3本を全編確認、12本分のパイプライン品質評価が完了、重大誤り0、公開・復旧の試験完了。所有者が明示的に有効化した後は動画ごとの形式的な再確認は不要。ただしhard failは公開停止。初期12本の公開はprivate確認後、所有者の指示に基づく手動公開で進められる。

公開枠の60分前までにfinal_passed/archivedでなければ欠番。翌枠へ回す前にsource freshnessを確認。最後の再確認から24時間を超えたらeditorial再検証。本文が変わればrevision+1とrenderをやり直す。

## 7. YouTube adapter

M0でOAuth接続先のchannel IDを取得し設定値と一致を確認。videos.insertは必ず最初private。resumable uploadを使用し、開始前にupload intent（bundleHash）をCAS保存。返却videoIdを台帳へ保存してから次へ進む。

通信断の後はresumable sessionの状態を確認。新しいinsertを自動発行しない。sessionが不明ならupload_unknownとし、channelの最近のuploadsと非公開説明欄のepisode/revision markerを照合。重複候補や照合不能なら停止。APIにはアプリ側の任意idempotency keyによる二重投稿防止を期待しない。

video処理完了→thumbnail設定→英語/日本語captions→metadata検査→必要ならpublishAtを設定。各stepを個別記録。英語と日本語は手動字幕として登録。description末尾にepisodeId/revisionを残す。publication、caption、thumbnail更新に必要なOAuth scopeをM0で検証し、無関係なscopeを追加しない。

未監査API projectのuploadがprivateに制限される場合がある。監査状態を確認できない間は予約公開を成功扱いしない。[videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert)

madeForKids=falseは成人向け設計による初期値。リアルな合成・改変の開示は内容に応じて判定する。[YouTube開示基準](https://support.google.com/youtube/answer/14328491?hl=en)。人間やニュース現場を偽装する素材はv1では扱わない。

## 8. 訂正

数値・主張・学習訳の重大誤りが判明：新規自動公開を停止、対象episodeをcorrection_requiredとして記録、所有者へ対象videoIdと根拠を通知。既存動画の削除・非公開化は所有者の指示に従う。renderし直してもYouTubeの同一動画ファイルを置換できると仮定しない。

説明欄で補足できる誤記は訂正日時・変更前・変更後・出典を記録。理解を変える誤りは新版を別revisionで制作し公開方針を決める。旧bundleとreceiptを消さない。

## 9. 通知

正常な探索・skipped・待機では通知しない。通知対象は、レビュー可能な完成動画、公開完了、復旧不能、予算上限、訂正必要、設定不足。各通知にepisodeId、現在stage、次に必要な具体的操作、artifact/run URLを付ける。毎回「変化なし」を送らない。
