# クラウド確認・レンダリング v2

## 1. 現状と決定

2026-09-15時点でrepoはpublic、Pages APIは404。Pagesが動いているとは扱わない。M3でPagesのbuild source=GitHub Actionsを設定し、実際のdeploy結果URLを記録する。予定URLを稼働URLとして案内しない。

ブラウザ確認はVite＋Remotion Player。PlayerがReact compositionを埋め込めることは[公式仕様](https://www.remotion.dev/docs/player)。エンコード結果を保証するものではないので、全編のpreview MP4と最終MP4の検査を別に行う。

## 2. ワークフローの確定契約（これから実装）

全workflowはubuntu-24.04、Node22の固定patch、npm ci。RemotionのChromiumはM1で採用した版を明示取得しprovenanceへ記録する。FFmpegは採用版を固定した配布バイナリ＋checksumを利用。ubuntu-latestや毎回無固定aptで再現性を主張しない。Actionは実装時の公式releaseを確認して完全commit SHAへ固定する。

| workflow | trigger | 入力 | 権限 | timeout |
|---|---|---|---|---|
| ci.yml | push / pull_request | checkout SHA | contents:read | 15分 |
| preview-pages.yml | main push（コード/fixtures/config変更）、dispatch | approved fixture list | buildはcontents:read、asset取得にid-token:write、deployはpages:write/id-token:write | 15分 |
| prepare-preview.yml | workflow_dispatch | episodeId、revision、commit SHA | contents:read、必要なOIDCのみ | 30分 |
| production-render.yml | workflow_dispatch | prepare runId、artifactId、bundleHash、engineCommit | renderはcontents:read、archive jobだけid-token:writeを追加 | 45分 |
| publish.yml | workflow_dispatch | bundleHash、final artifactId、mode | contents:read、公開environment secrets | 15分 |

contents:writeはrender jobへ与えない。botがGITHUB_TOKENでcommitしてもpush連鎖を前提にせず、定期担当が明示的にworkflow_dispatchする。fork PRにsecretを渡さず、pull_request_targetでforkのコードを実行しない。

CI：schema/semantic検査→typecheck→unit tests→offline fixture prepare→全シーンの静止画→Vite build。live TTSはPRで呼ばない。fork/PR用のoffline音声は固定周波数のPCMと既知markをCIで生成する。これは時間軸・ファイル読込用で、人声の品質確認には使わない。mainのPagesと公開前previewは承認した実TTS音声を使用する。長尺production renderはCIで自動実行しない。

prepare-preview：入力を許可episodeId regexで検査→指定SHA checkout→manifest hash検査→TTS/compile→freeze→全文540p render→qa→bundleとレビュー用成果物をupload。concurrencyはepisodeId/revisionで固定、cancel-in-progress=false。同revisionの二重prepareは台帳のhashを再利用。

production-render：指定runのartifactを取得し、repo、workflow名、成功状態、head SHAを確認→checksums照合→同じengineCommit checkout→1080p全編render→final QA→archive。latest artifactや同名の別runを拾わない。新しいTTSは一切作らない。

publishは独立workflow。通常renderにYouTube tokenを渡さない。初期はmode=disabledなのでdispatchしても入力検査後に設定エラーで停止する。モードは[運用仕様](OPERATIONS.md)に従う。

## 3. Playerレビュー画面

1440px以上では左320pxにscene一覧、右に最大1120px幅のPlayer。狭い幅はPlayer→一覧の縦並び。URL queryはfixture IDとscene IDのみ。ブラウザに任意URL/pathを入力させない。

必須機能：play/pause、seek、sceneジャンプ、current time/duration、volume、0.75/1/1.25倍、episodeId/revision/engineCommit/bundleHash表示。既定は停止・速度1。自動再生しない。scene選択はstartFrameにseekし停止状態を保つ。速度変更は確認用で、書き出し音声速度へ反映しない。

QA overlay toggle、manifestのread-only表示、失敗一覧。選択fixtureに失敗があれば赤いバナーで「公開不可」。bundleまたは音声未取得は再生ボタンdisabledと理由。フォントや音声のロード中はPlayerをbuffer状態にする。

Vite base=/english-youtube/、asset URLはBASE_URL経由。HashRouterかqueryを使い、Pagesの深いpath直アクセス404を避ける。検査では/english-youtube/への直アクセスとリロード、別sceneリンクを実際に試す。

## 4. Pagesに置くもの

config/preview-allowlist.jsonのfixtureId / bundleHashだけをビルドへ入れる。source.kind=fixtureでもallowlistにないものは除外。episodes/とruns/をglobでコピーしない。TTS済みfixture assetsはprivate GCSからビルド時取得して公開可能なものだけdistへコピー。公開用fixtureには記事全文・秘密値・内部レビューを含めない。

Pagesはmainの最新許可bundle1セットのみ。PRごとの永続URLは作らない。PR確認はCI artifactのpreview-site.zipを取得し、付属READMEの静的server起動で再生、またはpreview.mp4を確認。ローカル不要の共通レビューはmainのfixture Pages、編集episodeの全編レビューはActions MP4 downloadで行う。

Pages不可時はartifactを使い、M3のクラウドブラウザ確認は未完了として記録する。勝手に別hostingサービスへ課金して切り替えない。

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

UI調整用のpartial renderは追加CLI --scene <id>で許可するが、reportにpartial=trueを付け、公開合否には使わない。公開前のpreviewは全編必須。出力はfaststart対応MP4。FFmpegでformat/duration/audio stream/解像度を再確認。

artifact名はpreview-<episodeId>-r<revision>-<bundleHash先頭12文字>、finalも同規則。manifest/bundle、MP4、thumbnail、contact sheet、qa、render-reportを同梱。期限は永続保存を意味しない。archiveはGCSへ行う。

## 6. 合格条件

音声presence、音画差1frame以内、全体360〜480秒、黒画面・欠落assetなし、全overflowなし、-16±1 LUFS、peak≤-1dBTP。listen/thinkの意図的無字幕・無音を異常扱いしない。retrievalの固定無音とrecap末尾3秒以外の、予期しない連続無音1.2秒超は失敗。全編で期待される音声event区間とwaveformを照合する。

Playerの1frameとMP4 decoded frameの差は同じフォント・asset・frame番号で比較する。H.264圧縮差を許容し、SSIM≥0.98を基準、字幕の内容/矩形は完全一致で確認。品質判定の値は暫定基準でありRemotionの保証ではない。

最終MP4は冒頭30秒、全学習scene、結論・recapの音声を実視聴。最初の3本は全編視聴。以降も自動検査が通ったことと内容レビューを混同しない。

## 7. 外部仕様

[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)は静的hosting。[Pages deploy action](https://github.com/actions/deploy-pages)はartifactをdeployしpage_urlを返す。artifactの保持はリポジトリ側上限にも従う。[保持期間](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow)
