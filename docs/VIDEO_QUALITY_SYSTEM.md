# Video Quality System

この文書は、`english-youtube` の動画を「情報量の多い教材」ではなく、長尺でも自然に見続けられる英語学習コンテンツにするための視聴体験ルールを定義する。

## 1. 基本原則

### One focus per moment
1つの瞬間に視聴者へ強く読ませる主役は1つにする。

主役候補:
- visual / image / diagram
- English + Japanese caption
- retrieval prompt

字幕、図解、語彙カード、進捗UI、補足文を同じ強度で同時表示しない。

### Coherence
理解に直接寄与しない文字・装飾・情報を削る。面白いが不要な要素を足すより、必要な情報が一目で分かる方を優先する。

### Signaling
その瞬間に見る場所を明確にする。chain / compare / timeline は現在話している項目だけを強く表示し、それ以外は弱める。

### Temporal contiguity
英語と対応する日本語は通常同時に表示する。意図的な遅延表示はretrievalなど目的が明確な場合だけ使う。

### Segmenting
難しい説明を一画面に詰め込まず、1scene 1messageへ分解する。visualを分けることで理解の節目を作る。

## 2. 字幕

- 通常story/hook: English + Japaneseを同時表示。
- 日本語は英語より視覚的に弱くするが、待たせない。
- 一文・chunkごとの進捗バーは表示しない。
- CHUNK 1/3などの学習UIは通常表示しない。
- 1つのcaption eventは最大2行程度を目安にする。
- 字幕は音声と一致したタイミングで表示する。
- retrievalの最初のlistenだけ字幕を隠し、revealで同じ音声と字幕を出す。

## 3. 学習価値

learningPoints 3個は「動画内のすべての学習内容」ではなく、最後まで回収するアンカー表現。

通常のstoryでは:
- 英日captionそのものが理解支援になる。
- learning pointが自然に出る場合のみ、短い補助ヒントを最大1個表示できる。
- 語彙解説と論理語解説を同時表示しない。
- 専用phrase sceneは1〜2回に限定する。

retrievalでは:
1. 字幕なしでlisten。
2. 1問だけ意味を問う。
3. 同一音声を英日caption付きでreveal。
4. 長い解説はしない。

## 4. Visual hierarchy

### Card
- headline中心。
- bodyは20語程度までを目安。
- 長文説明欄にしない。

### Metric
- 数字を主役にする。
- labelとqualifierは短く。
- 数字と長文を競合させない。

### Chain
- 最大5nodes。
- narratorが到達したnodeだけ表示/強調。
- 一度に全nodeを同じ強さで見せない。

### Compare
- 最大4rows。
- 現在話しているrowを強調。
- 3列以上の複雑表を作らない。

### Timeline
- 最大5events。
- 現在eventへ視線を誘導。

## 5. 画像・イラスト

画像は装飾のためではなく、説明文を削るために使う。

画像を優先する候補:
- hookの違和感や大きな問い
- section transition
- analogy
- mechanismの具体例
- before / after
- scale comparison

1episode最大3枚を基本上限とし、phrase / retrieval / recapには原則使わない。画像を入れるsceneでは、既存diagramと画像を同じ強度で見せず、画像を中央visualの代替として扱う。

画像生成briefには最低限以下を含める:
- viewerに一目で理解させたい概念
- 主役1つ
- 不要な文字を画像内へ入れない
- factual photoのように誤認させる必要がない場合はillustrative / diagrammaticにする
- 実在人物・事件を表現する場合は、生成画像を事実資料として扱わない

詳細は `docs/IMAGE_GENERATION.md` を正本とする。

## 6. Orientation: 今どこにいるか

視聴者はscene番号ではなく、説明の論理的な章で現在地を理解できるようにする。

基本4章:
1. WHAT CHANGED — 何が起きたか
2. HOW IT WORKS — なぜそうなるか
3. THE CATCH — 何がボトルネックか
4. WHAT IT MEANS — 結局どう見るべきか

ルール:
- viewer-facing navigationでは `03/17` のようなscene数より `2 / 4 HOW IT WORKS` のような章を優先する。
- category名や制作内部ラベルを現在地UIへ重ねない。
- 新章の最初のsceneでは、その章で答える小さな問いを明確にする。
- 字幕・visualと競合する大きな常設ナビは作らない。現在地は短く一目で分かること。
- phrase/retrievalは「本編から逸れた別動画」に見せず、短いPAUSE & PRACTICEとして扱ってから本編へ戻る。

## 7. 長尺retention

- 0〜15秒: promise / tension / central question。
- 最初の30秒はtitle/thumbnailの期待と同じ問いを扱い、前置きで消費しない。
- 30〜60秒ごと: micro payoff。
- 20〜40秒ごと: 意味のあるpattern break。
- pattern breakは派手なanimationではなく、理解対象の変化で作る。
- open loopを作ったら必ず回収する。
- scene末尾の少なくとも半数は、contrast / consequence / unresolved question / scale shift / exceptionのどれかで次へ送る。

## 8. 公開後のretention feedback loop

制作時のscoreだけで品質完成としない。YouTube Studioで十分な視聴データが得られた動画は、次回生成前にretention evidenceへ変換する。

記録するもの:
- 30秒時点のIntro retention
- Top moments
- Spikes
- Dips
- 同程度の長さの直近動画とのtypical retention比較

解釈ルール:
- 後半のTop moment: 同種の魅力を次回は前半へ移せないか検討する。
- Dip: その時点のscene / utterance / visual type / learning interruptionを特定し、原因候補を記録する。
- Spike: 魅力による再視聴か、理解できず巻き戻されたのかを区別する。自動的に成功扱いしない。
- 30秒Introが弱い: hook、title/thumbnailとの期待一致、最初のpayoffまでの時間を優先して修正する。
- 単一動画の偶然を一般則にしない。複数動画で同じpatternが再現した場合に生成方針へ昇格する。

将来analytics adapterを実装する場合も、生の維持率から直接rendererを変更せず、`observation → hypothesis → next-video experiment → result` の台帳を残す。

## 9. Review gates

production manifestはREADY前に以下を通す。

```bash
npm run validate -- <manifest>
npm run review:retention -- <manifest>
npm run review:cognitive -- <manifest>
```

基準:
- contract hard failure: 0
- retention hard failure: 0
- retention score >= 80
- cognitive hard failure: 0
- cognitive score >= 75

`review:cognitive` は少なくとも以下を検査する:
- chain nodes > 5
- compare rows > 4
- timeline events > 5
- visual text過多
- card body過多
- 1sceneにutteranceを詰め込みすぎていないか

## 10. Design research basis

このシステムは以下の考え方を制作ルールへ翻訳している。

- YouTube audience retention: Intro（最初の30秒）、Top moments、Spikes、Dipsを使い、後半にある強い内容は前倒しを検討する。
- Netflix timed text: subtitleは音声と同期し、視聴者が「読む作業」ではなくコンテンツを自然に見られることを優先する。
- Multimedia learning research: coherence / signaling / redundancy / spatial contiguity / temporal contiguity / segmentingを使い、extraneous processingを減らす。

参考:
- https://support.google.com/youtube/answer/9314415
- https://partnerhelp.netflixstudios.com/hc/en-us/articles/360051554394-Timed-Text-Style-Guide-Subtitle-Timing-Guidelines
- https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning/F29A19FCD34C542806F736E0661C05F5
