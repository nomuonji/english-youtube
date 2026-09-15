# Retention-first 学習・演出仕様

この動画の目的は「英語を教えること」だけではない。**世界の面白い出来事を追っている間に、英語の理解練習がずっと続くこと**を視聴者価値とする。

動画を「ニュース本編 + 最後だけ単語帳」に戻さない。story中のすべてのutteranceが学習体験であり、learningPoints 3件はその中から特に長期記憶へ残すアンカー表現である。

## 1. 一本の視聴ループ

長尺全体を次の小ループの連鎖として設計する。

```text
OPEN LOOP
  -> EVIDENCE / EXAMPLE
  -> MICRO PAYOFF
  -> ENGLISH NOTICE
  -> FORWARD PULL
```

- OPEN LOOP: 「なぜ？」「本当に？」「数字だけでは見えない点は？」を作る。
- EVIDENCE / EXAMPLE: 数字、比較、因果、具体的な場所・物・行動で説明する。
- MICRO PAYOFF: 30〜60秒ごとに一度は小さく答える。答えを最後まで全部保留しない。
- ENGLISH NOTICE: 視聴を止めず、chunk、論理語、汎用表現を本文上で気づかせる。
- FORWARD PULL: 「ただし」「ここで次の問題が出る」「全国平均では見えない」など、次を見る理由を残す。

各story sceneをこの5要素すべてで埋める必要はない。ただし2〜3scene単位では必ず一周する。

## 2. 冒頭15〜25秒

挨拶、チャンネル説明、学習目標の読み上げ、`Today we will...`は禁止。

最初の2utteranceで次を満たす。

1. 具体的な異変・意外性・矛盾を一つ出す。
2. centralQuestionを**音声でも疑問文として言う**。
3. 視聴者が答えをまだ知らない状態を作る。

推奨パターン:

```text
Unexpected fact.
So why is X happening when Y seems true?
```

hookで答えを言い切らない。news pegの固有名詞を詰め込みすぎず、固有名詞の説明はsetupへ送る。

## 3. 長尺の離脱防止

### 3.1 30〜60秒ごとのmicro payoff

視聴者は「最後に全部分かる」だけでは持たない。各beat内で小さな問いを作り、1〜3scene以内に回収する。

例:

- 「AIは電気を大量に使う」→ なぜ？ → 冷却・設備まで同じ場所で電力を使う。
- 「世界全体では3%」→ 小さい？ → 地域に集中するのでローカル負荷は大きい。

### 3.2 forward pull

story sceneの終端では、少なくとも半数以上で次のどれかを作る。

- contrast: but / however / yet
- consequence: which means / so / therefore
- unresolved question: why / what happens next
- scale shift: global -> local, digital -> physical
- exception: this does not mean...
- reveal setup: this is where the bottleneck appears

毎回同じ言い回しは禁止。煽り文句や根拠のない危機感を作らない。

### 3.3 pattern break

20〜40秒程度を目安に、意味のある画面変化を入れる。時間だけを理由に切り替えない。

許可するpattern break:

- 数字のreveal / count-up
- chainの次node出現
- compareの注目row移動
- timeline event追加
- learning pointの初出
- discourse signalの可視化
- listening retrieval
- centralQuestionへの部分回答

単なるズーム、点滅、ランダムな色変更はpattern breakとして数えない。

## 4. 全編の英語学習

### 4.1 chunk-first

全story/hook/phrase/recapの英語は実測chunk timingで表示する。長い一文を全文固定表示しない。

各chunkは次の順で処理する。

1. 英語chunkを聞く・読む。
2. 0.3〜0.5程度進行後に対応する日本語を表示する。
3. 次chunkへ進む。

日本語は先に答えを見せる字幕ではなく、処理後の答え合わせとして使う。

### 4.2 discourse signal

英語を単語列としてではなく、構造として読む練習を入れる。

初期対象:

- but / however -> CONTRAST / 対比
- because -> REASON / 理由
- so / therefore -> RESULT / 結果
- if -> CONDITION / 条件
- although / even though -> CONCESSION / 譲歩
- while -> PARALLEL / 対照・並行
- instead -> ALTERNATIVE / 代替

signal表示は短く、本文の読みを邪魔しない。

### 4.3 learningPoints

3件は「この動画で学ぶ英語の総数」ではない。全編で学習が起きる前提で、最後まで特に覚える3アンカーを選ぶ。

各pointは:

- story初出時に強調する
- story中で2回以上自然に再遭遇する
- 必要なら専用phrase sceneで意味・使い方を短く整理する
- recapで最後に回収する

## 5. listening retrieval

途中のretrievalは休憩ではなく、能動的な理解確認にする。

```text
question + options
-> first listen: subtitleなし
-> 3,2,1 think
-> exact same audio replay + chunk subtitles
-> answer + short Japanese confirmation
```

語彙の綴り当てではなく、内容理解を問う。

## 6. visual設計

Text UIの強みは「映像素材の豪華さ」ではなく、**いま何を理解すべきかを毎秒明確にできること**。

- card: 問い・転換・結論。長い本文を載せない。
- metric: 数字の大きさと比較対象を見せる。
- chain: 原因→結果・工程。
- compare: 誤解→現実、A→B、全国→地域。
- timeline: 時系列と変化量。

同じvisual typeをstoryで3scene連続させない。意味構造が同じ場合でも、必要ならsceneを統合する。

## 7. 執筆時の禁止パターン

- `Today we will...`
- `In this video...`
- 事実を4文並べてscene終了
- scene間が「Next, ...」だけで接続される
- 抽象名詞だけで説明し、物・場所・数字が出ない
- 最後まで問いを一切回収しない
- learningPoints以外の英語に何の支援もない
- 説明と無関係なモーションでテンポ感を偽装する

## 8. retention review

manifest作成後、契約検査とは別に以下を実行する。

```text
npm run review:retention -- episodes/.../manifest.json
```

初期合格条件:

- hard failure = 0
- score >= 80
- hook内でcentralQuestionが音声上の疑問文として確認できる
- storyの45%以上にforward-pull proxy
- storyの70%以上に数字または説明構造visual
- learning anchor spreadが狭すぎない

heuristicは面白さを証明しない。これを通過したうえでeditorial-reviewが人間視点で「次を見たいか」を採点する。

## 9. editorial-review追加項目

既存6項目に加えて、retention用に別枠で各0〜2点を記録する。

- hook: 15秒以内に「続きを知りたい問い」ができる
- curiosity: 30〜60秒ごとに新しい疑問・意外性・スケール変更がある
- payoff: 引っ張るだけでなく小さな答えが定期的に返る
- visual rhythm: 画面変化が発話内容と同期している
- learning continuity: 最後だけではなくstory全体で英語学習が起きる

合計8/10以上、0項目なしを推奨合格ラインとする。
