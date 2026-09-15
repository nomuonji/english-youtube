# クラウド確認・レンダリング v2.1

## 1. 現状と決定

2026-09-15時点でrepoはpublic、Pagesが稼働済みとは扱わない。M3でPagesのbuild source=GitHub Actionsを設定し、実際のdeploy結果URLを記録する。

ブラウザ確認はVite＋Remotion Player。PlayerはUI/scene確認用であり、encoded MP4と同一とはみなさない。全編preview MP4と最終MP4の検査を別に行う。

## 2. workflow契約

全workflowはubuntu-24.04、Node22の固定patch、npm ci。Remotion ChromiumとFFmpegの採用版を固定しprovenanceへ記録する。Actionは実装時の公式releaseを確認して完全commit SHAへ固定する。

| workflow | trigger | 入力 | 権限 | timeout |
|---|---|---|---|---|
| ci.yml | push / pull_request | checkout SHA | contents:read | 15分 |
| preview-pages.yml | main push（code/fixtures/config変更）、dispatch | approved fixture list | build contents:read、deploy pages:write/id-token:write | 15分 |
| prepare-preview.yml | **main pushで `runs/**/READY.json` が追加**、fallbackでworkflow_dispatch | READY / episodeId / revision / manifestHash / commit SHA | contents:read、必要なOIDCのみ | 30分 |
| production-render.yml | workflow_dispatch | prepare runId、artifactId、bundleHash、engineCommit | render contents:read、archive jobのみid-token:write | 45分 |
| publish.yml | workflow_dispatch | bundleHash、final artifactId、mode | contents:read、公開environment secrets | 15分 |

通常のepisode manifest更新だけではprepareを起動しない。日次エージェントはfreeze後、最後のGit変更として `runs/YYYY-MM-DD/<runId>/READY.json` を新規作成する。

prepare-previewはREADYを信用せず、checkout後に次を再検査する。

- READYのepisodeId / revisionがmanifestと一致
- READYのmanifestHashがcanonical manifest hashと一致
- workflow対象commitがREADYを含むcommitと一致
- kind=production/fixtureの扱いがpolicyと一致
- 同一READYがすでにprepared済みならidempotentにskip

hash/参照不一致はblocked。最新manifestを推測して使わない。

M0で、実際に定期エージェントが使うGitHub接続からREADYをcommitし、push workflowが発火するかprobeする。発火しない環境ではREADYを残し、manual workflow_dispatchをfallbackにする。別schedulerや別hostingを自動追加しない。

Actions自身がGITHUB_TOKENでcommitした結果のworkflow連鎖には依存しない。

CI：schema/semantic検査→typecheck→unit tests→offline fixture prepare→全scene静止画→Vite build。live TTSはPRで呼ばない。長尺production renderは通常CIで自動実行しない。

prepare-preview：READY検証→指定SHA checkout→TTS speech group生成/compile→freeze bundle→全編540p render→QA→bundleとレビュー用成果物upload。concurrencyはepisodeId/revision。cancel-in-progress=false。同revision/hashの二重prepareは再利用。

production-render：指定prepare artifactを取得し、repo、workflow、成功状態、head SHA、checksumsを確認→同じengineCommit checkout→1080p全編render→final QA→archive。latest artifactや同名別runを拾わない。新しいTTSは作らない。

publishは独立workflow。通常renderへYouTube tokenを渡さない。初期publishMode=disabled。

## 3. Playerレビュー画面

1440px以上では左320pxにscene一覧、右に最大1120px幅のPlayer。狭い幅はPlayer→一覧の縦並び。

必須機能：play/pause、seek、sceneジャンプ、current time/duration、volume、0.75/1/1.25倍、episodeId/revision/engineCommit/bundleHash表示。既定は停止・速度1。自動再生しない。

QA overlay、manifest read-only表示、失敗一覧を用意する。bundle/音声未取得は再生disabledと理由を表示。フォントや音声ロード中はbuffer状態。

Vite base=/english-youtube/。asset URLはBASE_URL経由。深いpath直アクセス404を避けるためHashRouterまたはqueryを使う。

## 4. Pagesに置くもの

config/preview-allowlist.jsonのfixtureId / bundleHashだけをbuildへ入れる。episodes/とruns/をglobコピーしない。TTS済みfixture assetsはprivate GCSからbuild時に取得し、公開可能なものだけdistへコピー。記事全文・秘密値・内部レビューは含めない。

Pagesはmainの最新許可bundle1セットのみ。PRごとの永続URLは作らない。PR確認はartifactのpreview-site.zipまたはpreview.mp4を使う。

## 5. render profile

| 項目 | preview | production |
|---|---|---|
| 論理解像度 | 1920×1080 | 1920×1080 |
| 出力 | 960×540（scale=.5） | 1920×1080 |
| fps | 30 | 30 |
| codec | H.264 / yuv420p | H.264 / yuv420p |
| CRF | 23 | 18 |
| 音声 | AAC 192kbps / 48kHz | AAC 192kbps / 48kHz |
| 範囲 | 全編 | 全編 |
| render concurrency | 2 | 2 |
| artifacts保持 | 14日 | 30日 |

UI調整用partial renderは `--scene <id>` を許可するが、公開合否には使わない。公開前previewは全編必須。faststart MP4。FFmpegでformat/duration/audio stream/解像度を再確認。

artifact名はpreview-<episodeId>-r<revision>-<bundleHash先頭12文字>、finalも同規則。manifest/bundle、MP4、thumbnail、contact sheet、qa、render-reportを同梱。archiveはGCS。

## 6. contact sheetとcurrent focus

全sceneの開始+8frame、中央、終了-1frame、全reveal+8frame、**current focus変更直後**、retrieval各phaseを静止画化する。これによりtext overflowだけでなく、同じレイアウトの停滞やfocus同期のずれも確認する。

## 7. 合格条件

音声presence、音画差1frame以内、全体360〜480秒、黒画面・欠落assetなし、overflowなし、-16±1 LUFS、peak≤-1dBTP。listen/thinkの意図的無字幕・無音は異常扱いしない。retrieval固定無音とrecap末尾3秒以外の予期しない連続無音1.2秒超は失敗。

speech group内のutterance/chunk markとcaption開始時刻を照合する。retrievalはsource utteranceのsample範囲と切り出しWAVが一致し、listen/revealのasset hashが同一であることを検査する。

Player frameとMP4 decoded frameの比較では圧縮差を許容するが、字幕内容・矩形・current focus対象は一致させる。

最終MP4は冒頭30秒、全学習scene、結論・recapを実視聴。最初の3本は全編視聴。自動検査passを内容レビューと混同しない。
