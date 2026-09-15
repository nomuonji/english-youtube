# 画面・シーン仕様 v2

8種類の描画プリミティブだけを実装する。role（編集上の役割）とvisual.type（見た目）は別フィールド。自由CSS、variant文字列、外部素材検索はない。

## 1. 共通画面

基準1920×1080、30fps、sRGB。すべてpx。縮小表示は画面全体を等倍比率で縮め、内部レイアウトを組み替えない。

| 領域 | x / y / w / h |
|---|---|
| ヘッダー | 96 / 48 / 1728 / 64 |
| メイン | 120 / 144 / 1680 / 576 |
| 字幕 | 144 / 756 / 1632 / 204 |
| 補足・出典 | 144 / 988 / 1632 / 36 |

背景#F7F5EF、本文#152B3C、補助#425569、アクセント#006D77、注意・予測#9A4D00、罫線#CCD2D4。白文字をアクセント背景に使う場合もcontrast 4.5:1以上を測定。色だけで正誤・推定を区別せずラベルを付ける。

英語はInter Regular/Medium/SemiBold、日本語はNoto Sans JP Regular/Bold。配布元とライセンスを保存したwoff2をbundleに固定。レンダリング中にGoogle Fontsへ取得しに行かない。フォント読み込み完了を待ち、失敗したらrenderを止める。

| 要素 | サイズ / 行高 / 上限 |
|---|---|
| header | 28 / 36、chapterラベルのみ |
| card主文 | 84 / 102、2行 |
| metric値 | 144 / 156、1行 |
| 図のラベル | 52 / 68、2行、1ラベル32文字 |
| 字幕 | 64 / 82、2行、1cue合計72文字、1行40文字 |
| phrase主文 | 84 / 102、2行 |
| 日本語gloss | 40 / 52、1行24文字 |
| 日本語phrase意味 | 48 / 64、1行24文字 |
| 出典 | 26 / 32、1行（補助情報。完全なURLは説明欄） |

文字数はUnicode code point数、語数と混同しない。文字数上限を満たしてもDOM実測でoverflowなら不合格。自動縮小、三点リーダー、途中切断は禁止。エージェントが意味を保って短く書き直す。

字幕は中央揃え、固定位置。最大2チャンクを同時表示し、発話中チャンクだけSemibold＋アクセント下線。単語単位の跳躍・カラオケ表示なし。字幕領域内に日本語を重ねない。glossはメイン下部y=656に表示し、図の高さをその分縮める。glossと主図が重なればhard fail。glossLearningPointIdが指定されたsceneでは、その表現を含む最初のutterance開始から同文終了+60framesまで表示する（scene末尾を超えない）。指定表現を含む文がなければE_LEARNING。phrase/retrieval/recapではこのfieldはnull。

## 2. モーション

cutを基本にし、scene間の音声を重ねない。入場はopacity 0→1とtranslateY 12→0、8frames、cubic ease-out。退出は動かさない。本文字幕は動かさない。1図のノードは関連するutterance開始時に入場。最終ノードまで表示したものは消さず残す。metric値を0からカウントしない（途中値を事実に見せない）。

図の項目にはrevealAtUtteranceIdを設定し、scene内の該当文が始まる時に出す。同時なら同じID。diagram全体の作り直しはscene境界だけ。時間依存はRemotionのframeのみ。Date.now、Math.random、CSS transition、ネットワーク結果で描画を変えない。

## 3. プリミティブ別の確定仕様

### card

payload：headline（最大80文字）、body（最大120文字）、claimIds。メイン中央。headline 84px、body 48px・最大3行、間隔40px。hook、概念の定義、結論に使用。本文の音声丸ごとを表示せず命題だけ。bodyが空ならheadlineを縦中央。独自の画像背景はない。

### metric

payload：value（文字列16文字以内）、unit（20文字以内）、label（48文字以内）、qualifier（32文字以内）、claimIds（1以上）。valueは数値表示専用、unitは48px、labelは56px、qualifierは32px。valueの上にlabel、右にunit、下にqualifier。qualifierに推定・予測・基準年を英語で表示。年・単位・母集団を欠く数値は編集検査で拒否。

### chain

payload：nodes 2〜4、各label / revealAtUtteranceId、claimIds（1以上）。横1列、node幅320、高160、gap96、矢印48。ノード2〜3なら全体を中央へ。因果を根拠が支持する場合だけ矢印。単なる時系列にはtimelineを使う。分岐・loopはv1にない。

### compare

payload：leftTitle / rightTitle（各24文字）、rows 2〜3、各aspect（24文字）/ left / right（各40文字）/ revealAtUtteranceId、claimIds。左にaspect幅300、左右の値に各650、gap40。ヘッダー64高、row高128。数値比較は単位と期間をそろえる。片方だけ赤くする勝敗演出はない。

### timeline

payload：events 2〜4、各dateLabel（20文字）/ label（48文字）/ revealAtUtteranceId、claimIds。横軸を等間隔で配置し「Not to scale」を32pxで表示。日付順に並べる。時刻間隔の長さを表現するグラフとして使わない。

### phrase

payload：learningPointId。元のsourceUtteranceIdの英文をチャンクごとにメインに表示、対象表現だけアクセント。下にmeaningJa。scene自身のutterancesは英語で意味の言い換え＋短い例を読む。元文を再TTSしない。storyの事実文を丸々字幕と二重表示し続けない。

### retrieval

payload：sourceUtteranceId / question（80文字）/ options（2件、各40文字）/ correctIndex（0または1）/ answerJa（48文字）。
画面上1/3に問い56px、中央に選択肢2枚、下に指示。解答では正解カードにチェック＋Correctを表示。その他の詳細時刻は[編集仕様](EDITORIAL_SYSTEM.md)の式。scene.utteranceIdsは空。全文字幕を隠す区間は焼き込みだけでなくSRTも除外。

### recap

payload：learningPointIds（正確に3）。1画面で1表現、音声utteranceも正確に3。各文の開始時に該当表現とmeaningJaへ切り替える。最後の文の終了後3秒保持し「次の話も、英語で。」を32pxで追加。3秒はscene長に含む。外部の登録先URLや未存在動画のリンクは表示しない。

## 4. 選択規則

問い・命題→card、数値が答えの中心→metric、因果→chain、同条件の差→compare、順序→timeline。学習roleは同名visualだけ。他のroleでphrase/retrieval/recapを使わない。

storyで同じvisualが3つ連続したら編集警告。ただし無理に比較や因果を捏造しない。直せない場合、役割を分ける必要自体をレビューする。最低4種を一動画に入れる（学習を含めてよい）。図が情報を足さないならcardに戻す。

## 5. プレビュー確認方法

全sceneについて開始+8frames、中央、終了-1frameの3点と、全reveal開始+8frameを取得。加えてretrievalの各phaseを取得。同じframeは1枚にまとめる。contact sheetは4列、各480×270、frame/time/sceneIdのラベル付き。

360px幅相当と1280px幅で、英語字幕、正解、主図のラベルが読めるか検査。小さい出典が読めなくても説明欄へ辿れるが、理解に必須の文字は出典サイズにしない。QA用矩形overlayはプレビュー専用で本番では必ず無効。
