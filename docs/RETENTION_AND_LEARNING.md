# Retention-first 学習・演出仕様

この文書は `formatProfile: "news-first"` の新規productionを対象とする。旧v2.1 episodeは再現性のためlegacy挙動を維持する。

## 1. 視聴価値

目的は英語講義を完走させることではない。

**世界の面白い出来事を英語で追いながら、その文脈で再利用できる英語に気づくこと。**

storyが主、learning UIは従。学習のためにstoryを止めない。

## 2. 一本の視聴ループ

storyは次の小ループを連鎖させる。

```text
OPEN LOOP
  -> EVIDENCE / EXAMPLE
  -> MICRO PAYOFF
  -> FORWARD PULL
```

English noticeは別sceneではなく、この流れの中の字幕annotationとして必要時だけ出す。

- OPEN LOOP: なぜ？ 本当に？ 何が意外？
- EVIDENCE: 数字、比較、具体例、因果
- MICRO PAYOFF: 30〜60秒程度ごとに小さく答える
- FORWARD PULL: contrast / consequence / unresolved question / scale shift / exception

## 3. 冒頭

最初の5〜10秒で視聴理由を作る。15秒程度までにcentral questionを理解可能にする。

推奨:

```text
unexpected fact / contrast
-> concrete stakes
-> question
```

禁止:

- 挨拶
- チャンネル説明
- タイトルの読み上げ
- `Today we will...`
- 学習目標の説明
- 根拠のない危機感

45 wordsを超えるhookは原則再編集する。

## 4. Storyを中断しない

news-firstではstory開始後、answer beatが終わるまで dedicated learning sceneを置かない。

- `retrieval`: 0件
- `phrase`: story中は0件
- quiz / long countdown: 0件

既出英文を同じ場所で2〜3回流してテンポを止めない。

## 5. 英語学習

### 5.1 通常story

字幕はcurrent chunk中心。

1. current English chunk
2. 小さな日本語補助
3. 必要時のみ1つのlearning annotation

previous/current/next全文を常時表示しない。教材UIがニュースvisualより強くならないようにする。

### 5.2 learningPoints

正確に3つ。B2〜C1のbusiness/news Englishとして、別のニュースや仕事でも再利用できる表現を選ぶ。

優先:

- collocation
- phrasal pattern
- reporting / causality / constraint / scale表現
- business/newsで頻出するまとまり

避ける:

- 初級一般文法 (`is expected to` 等)
- ただの接続語
- そのテーマだけでしか使わない専門名詞

storyを書いてから選ぶ。learning pointを入れるために事実説明を不自然に改変しない。

### 5.3 English Replay

story終了後に1〜3 dedicated phrase sceneを連続配置する。

各表現:

```text
listen once
-> notice phrase/chunk
-> shadow once
```

短く終える。選択式クイズや長い思考時間は標準では使わない。

### 5.4 Recap

最後に:

- story answer / takeawayを1つ
- 3 anchor expressions

を同じ画面で回収する。英語だけで終わらず「この動画で何が分かったか」を明示する。

## 6. Visual rhythm

視覚変化は3〜8秒程度を目安に、意味の変化に同期させる。

候補:

- B-roll cut / crop / slow pan
- editorial image
- metric count-up / bar
- chain node reveal
- compare row focus
- timeline event reveal
- key phrase highlight
- chapter transition

ランダムなzoom/flash/色変更でpattern breakを水増ししない。

同じstory visual typeを3scene連続させない。

## 7. Reality layer

Text UIだけで7分を埋めない。

B-roll / imageは「薄く存在する」だけでは不足。字幕・図の可読性を守りながら、何が映っているか視聴者が認識できる強度を残す。

1つのbeatに同じB-rollをずっと使い回さず、scene contextに合わせて素材を変える。

## 8. Audio rhythm

- BGM bedは継続し、知覚できるがvoiceをマスクしない程度
- hook impact
- chapter transition
- metric reveal
- English Replay cue

など意味のあるイベントにだけSEを使う。

TTSは教材都合の不自然な間を減らす。chunk境界は意味単位として維持しつつ、文間に長いpauseを連発しない。

## 9. retention review

`npm run review:retention -- <manifest>`

合格:

- hard failure = 0
- score >= 80

news-first hard checks:

- central questionがhookで明確
- generic introなし
- story中のphrase/retrieval interruptionなし
- retrieval 0件
- phrase replayはstory後

warnings:

- hook > 45 words
- forward pull不足
- concrete visual不足
- 同一visual連続
- learning anchor偏在
- basic/low-yield anchor
- story比率不足

heuristicは面白さを証明しない。通過後に実際のpreviewを人間が見て、hook / curiosity / payoff / visual rhythm / learning continuityを判断する。

## 10. Human review

少なくとも以下を確認する。

- 最初の5秒に視聴理由があるか
- 30秒以内に「静的スライド動画」に見えないか
- ニュースを見ている感覚が途中の教材sceneで壊れないか
- B-rollが実際に見えているか
- BGM/SEが存在を感じられるが邪魔ではないか
- 英語表現が初級すぎないか
- 最後のReplayが短く実用的か
- storyの結論を持ち帰れるか
