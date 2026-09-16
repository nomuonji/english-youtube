# 動画制作プレイブック — news-first

> Status: current viewer-facing production guide / 2026-09-16
>
> 新規productionでは `docs/NEWS_FIRST_FORMAT.md` と本書を最優先する。旧episodeの再現にはlegacy仕様を使う。

## 1. 北極星

**面白い海外ニュース解説を見ていたら、自然に実践英語も身についていた。**

画面・音・学習UIは全てstoryを強くするために使う。英語教材であることを毎分説明しない。

判断順:

1. 内容そのものに次を見たい理由があるか
2. 何が起きているか直感的に分かるか
3. どこを見るべきか迷わないか
4. 現実の出来事を感じるvisualがあるか
5. 英語支援がstory理解を邪魔していないか

## 2. Cold hook

最初の5〜10秒が最重要。

- title cardから始めない
- unexpected fact / contradiction / stakesを即座に出す
- B-roll / strong editorial image / large kinetic key textのいずれかを使う
- 15秒程度までにcentral question
- 挨拶・学習目標・`Today we will...`禁止

hookで結論を全部言わない。根拠のない「崩壊」「危機」「絶対」も使わない。

## 3. News story first

hook後はstoryへ直行する。

```text
WHAT CHANGED
HOW IT WORKS
THE CATCH
WHAT IT MEANS
```

story中に単語講義、選択式quiz、同一英文replayを挟まない。

各beatは:

`open loop -> evidence/example -> micro payoff -> forward pull`

を基本にし、30〜60秒程度ごとに小さな答えを返す。

## 4. Visual rhythm

映像素材の豪華さではなく、**意味と同期した変化の密度**で勝つ。

3〜8秒程度を目安に次のどれかが進む状態を作る。

- B-roll cut / pan / crop
- editorial still
- kinetic keyword
- metric count-up / bar
- chain node reveal
- compare row focus
- timeline progression
- chapter transition

時間だけを理由にランダムなzoom/flashを入れない。

## 5. B-roll / image

優先順位:

1. appropriately licensed factual B-roll
2. factual/public-domain still
3. editorial / AI image
4. diagram

B-rollは何が映っているか認識できる強度で見せる。旧実装のように白いoverlayを80〜97%被せて素材を消さない。

同じbeatで同じclipを使い続けず、scene textから `data center / transmission / substation / power generation / finance / construction` 等の具体的contextを拾って素材を変える。

AI/editorial imageを実際の人物・企業・出来事の記録映像として見せない。

## 6. Text UI

Text UIは差別化要素だが、スライド資料に見せない。

### 通常caption

compact lower-third:

- current English chunk: primary
- Japanese: smaller support
- optional BUSINESS ENGLISH annotation: max 1

previous/current/next全文を常時3段表示しない。巨大な白字幕カードで画面下1/3を固定しない。

### Visual hierarchy

1瞬間1主役。

- metricが主役なら数字を大きく
- B-rollが主役ならカードを減らす
- diagramが主役なら現在nodeだけ強く
- phraseが主役なのは最後のEnglish Replayだけ

## 7. Metric / diagram

metricは静止数値ではなくcount-upやbarでrevealする。

chain / compare / timelineは全項目を最初から同じ強度で見せず、発話に合わせて段階的に出す。

図中文字は短くする。説明文はナレーションへ置く。

## 8. English support

対象はB2前後〜C1。

story中:

- reusable collocationを字幕内で短くhighlight
- topic vocabularyは必要時だけ意味補助
- 専用lesson画面へ切り替えない

English Replayはstory後に1〜3表現。

`listen once -> notice the chunk -> shadow once`

初級一般表現の説明、同一英文3連続、長いカウントダウンは使わない。

## 9. Audio

### Narration

voiceが常に最優先。ただし「教材らしい遅さ」を作らない。

- chunk間pauseは短く
- sentence間も自然な呼吸程度
- question / contrast / important numberが単調に聞こえない原稿句読点を使う

### BGM

low-density tech/electronic bedを継続。

- 知覚できる
- narrationをmaskしない
- 同じ無変化padだけで眠くしない

### SFX

意味イベントだけ:

- hook impact
- chapter whoosh
- metric reveal hit
- English Replay cue

毎文には付けない。

## 10. End block

story終了後:

1. English Replay 1〜3件
2. Story Takeaway + 3 expressions recap

の順。

Outroで長くチャンネル登録を読み上げない。必要なら短い次回hook/CTAに留める。

## 11. READY review checklist

人間はpreviewを実時間で見て確認する。

- 0〜5秒: 視聴理由がある
- 0〜30秒: 静的スライド動画に見えない
- story: 教材sceneで中断されない
- visual: B-roll/imageが実際に認識できる
- visual: 数字・図の変化が発話と同期
- caption: 読む量が多すぎない
- learning: anchorがB2〜C1として有用
- audio: BGM/SEを感じるがvoiceを邪魔しない
- replay: 短く、一度ずつ練習できる
- ending: storyの答えを持ち帰れる

このチェックを満たさない場合、schemaがvalidでもREADY/APPROVEDへ進めない。
