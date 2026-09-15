# 画面・シーン仕様 v2.1

8種類の描画プリミティブだけを実装する。role（編集上の役割）とvisual.type（見た目）は別フィールド。自由CSS、variant文字列、外部素材検索はない。v2.1では新しいprimitiveを増やさず、音声同期の**current focus**を追加する。

## 1. 共通画面

基準1920×1080、30fps、sRGB。すべてpx。縮小表示は画面全体を等倍比率で縮め、内部レイアウトを組み替えない。

| 領域 | x / y / w / h |
|---|---|
| ヘッダー | 96 / 48 / 1728 / 64 |
| メイン | 120 / 144 / 1680 / 576 |
| 字幕 | 144 / 756 / 1632 / 204 |
| 補足・出典 | 144 / 988 / 1632 / 36 |

背景#F7F5EF、本文#152B3C、補助#425569、アクセント#006D77、注意・予測#9A4D00、罫線#CCD2D4。白文字をアクセント背景に使う場合もcontrast 4.5:1以上を測定。色だけで正誤・推定・focusを区別せず、border / font weight / opacity差も使う。

英語はInter Regular/Medium/SemiBold、日本語はNoto Sans JP Regular/Bold。配布元とライセンスを保存したwoff2をbundleに固定。レンダリング中にGoogle Fontsへ取得しに行かない。フォント読み込み失敗はrender停止。

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
| 出典 | 26 / 32、1行。完全URLは説明欄 |

文字数上限を満たしてもDOM実測でoverflowなら不合格。自動縮小、三点リーダー、途中切断は禁止。エージェントが意味を保って短く書き直す。

字幕は中央揃え、固定位置。最大2チャンクを同時表示し、発話中チャンクだけSemibold＋アクセント下線。単語単位のカラオケ表示はしない。字幕領域内に日本語を重ねない。

glossはメイン下部y=656。`glossLearningPointId` が指定されたstory sceneでは、そのlearning pointのsourceUtteranceを含む文の開始から同文終了+60framesまで表示する。phrase/retrieval/recapではnull。phrase sceneで扱われないlearning pointは必ず初出storyのglossで扱う。

## 2. モーションとcurrent focus

cutを基本にし、scene間の音声を重ねない。入場はopacity 0→1とtranslateY 12→0、8frames、cubic ease-out。退出は動かさない。本文字幕は動かさない。

図のitemは関連するutterance開始時にrevealする。最終itemまで表示したものは原則消さず残す。metric値を0からカウントしない。

### current focus

current focusはagentがpayloadへ自由指定しない。rendererが既存 `revealAtUtteranceId` とresolved utterance timingから決定する。

ルール：

1. itemがrevealされた瞬間、そのitemをcurrentにする。
2. 次のitemがrevealされるまでcurrentを維持。
3. scene終了でfocus解除。
4. 同一utteranceで複数itemがrevealされた場合はその集合をcurrentにしてよい。

primitive別：

- chain: current nodeのborderを太くし、文字weightを上げ、非current nodeは少しopacityを下げる
- compare: current row全体を強調。左右どちらか一方だけを勝者色にしない
- timeline: current event marker＋labelを強調
- metric: value/qualifierのどちらを読んでいるかをutterance associationから強調。対応が一意でない場合はscene全体を通常表示
- card: headline/bodyの部分focusは行わない

current focusは理解補助であり、意味を追加しない。claimがない情報をfocusによって暗示しない。

## 3. プリミティブ

### card

payload：headline（最大80文字）、body（最大120文字）、claimIds。hook、概念定義、結論に使用。本文音声を丸ごと複製せず命題だけを置く。

### metric

payload：value（16文字以内）、unit（20文字以内）、label（48文字以内）、qualifier（32文字以内）、claimIds（1以上）。年・単位・母集団を欠く数値は拒否。

### chain

payload：nodes 2〜4、各label / revealAtUtteranceId、claimIds（1以上）。因果を根拠が支持する場合だけ矢印。単なる時系列にはtimelineを使う。

### compare

payload：leftTitle / rightTitle（各24文字）、rows 2〜3、各aspect / left / right / revealAtUtteranceId、claimIds。数値比較は単位と期間をそろえる。

### timeline

payload：events 2〜4、各dateLabel / label / revealAtUtteranceId、claimIds。横軸は等間隔で「Not to scale」を表示。時間間隔の長さを表現するグラフとして使わない。

### phrase

payload：learningPointId。sourceUtteranceの英文をチャンクごとに表示し、対象表現だけアクセント。下にmeaningJa。scene自身のutterancesは英語で意味の言い換え＋短い例を読む。専用phrase sceneは1〜2回。

### retrieval

payload：sourceUtteranceId / question / options 2件 / correctIndex / answerJa。初回listenでは英語字幕・glossを隠す。revealで同じ音声assetを再生して字幕と正解を表示。scene.utteranceIdsは空。

### recap

payload：learningPointIds（正確に3）。1画面で1表現、音声utteranceも3件。最後の文終了後3秒保持し「次の話も、英語で。」を表示。

## 4. 選択規則

問い・命題→card、数値→metric、因果→chain、同条件の差→compare、順序→timeline。学習roleは同名visualだけ。他roleでphrase/retrieval/recapを使わない。

storyで同じvisualが3つ連続したら編集警告。ただしvariationのために因果や比較を捏造しない。最低4種を一動画に入れる。図が情報を足さないならcardへ戻す。

## 5. プレビュー確認

全sceneについて開始+8frames、中央、終了-1frame、全reveal開始+8frameを取得。current focusが変わるframeも必ずスクリーンショット対象にする。retrievalは各phaseを取得。同じframeは1枚にまとめ、contact sheetは4列、各480×270、frame/time/sceneIdラベル付き。

360px幅相当と1280px幅で、英語字幕、正解、主図ラベルが読めるか検査。QA用overlayはプレビュー専用で本番では無効。
