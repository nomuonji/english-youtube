# パイロット・測定 v2

## 1. 2種類のサンプルを混同しない

[contract-demo.json](../fixtures/contract-demo.json)は8種類のpayloadと参照を確認する**架空の短いfixture**。数値・町・出典URLは実ニュースではない。音声ファイルはまだなく、尺・学習回数・出典のproduction要件も満たさない。これをそのままYouTubeへ投稿しない。

以下は最初に完成させる本番パイロットの制作指示。最新ニュースや数値を未調査のまま原稿へ書かない。実装時の編集エージェントはこの問いに関する一次資料と独立資料を集め、採点基準を満たさなければ次候補へ進む。

## 2. 本番パイロットの完成像

問い：Why can a new data center make electricity harder to supply?
日本語タイトル案：データセンターはなぜ電力の壁にぶつかる？｜やさしい英語
サムネ案：電気が届かない？
答えの構造：設備の需要だけでなく、場所・送電設備・接続時期が供給を制約し得る。国や地域で異なるので世界共通の断定をしない。

学習3表現：be expected toではなく実際の原稿に一致するis expected to、depend on、lead to。原稿で2回ずつ自然に使えるか確認する。公開時にこの語句が不自然なら題材の調査段階で選び直し、後付けの単語挿入で引き延ばさない。

目標420秒、実再生語数約880。下表は編集予算でありframe値ではない。TTS後の秒数で学習窓・全体尺を再判定する。

| scene | role / beat | visual | 目安秒 | 伝えること・見せるもの |
|---|---|---|---:|---|
| 01 | hook | card | 22 | 新しい設備を建てても電気をすぐ使えるとは限らないという問い。具体例を出すならclaim必須 |
| 02 | story/setup | card | 28 | 一つの発表を説明。どこで、誰が、何を計画したか |
| 03 | story/setup | metric | 25 | 調査済みの中心数値を一つだけ。単位・年・予測を同時表示 |
| 04 | story/mechanism | chain | 33 | 計算→機器稼働→電力という、根拠が説明する関係 |
| 05 | story/mechanism | compare | 30 | 電気を使うことと、必要な場所へ届けることの違い |
| 06 | phrase | phrase | 16 | is expected to。前の予測文から取り出し、確定ではないことを英語で説明 |
| 07 | story/mechanism | chain | 33 | 発電→送電→現地接続。既知の範囲だけを図にする |
| 08 | story/complication | timeline | 32 | 参照できる実例の発表・工事・接続予定を区別。等間隔表示 |
| 09 | phrase | phrase | 16 | depend on。直前の文に戻し、他の要素が必要という意味を示す |
| 10 | story/complication | compare | 32 | 需要が増える予測と、実際の供給条件の違い。単位・期間をそろえる |
| 11 | story/complication | card | 29 | 効率化で変わる可能性と、断定できない点 |
| 12 | retrieval | retrieval | 26 | 既出の8秒程度の文。理由を二択で聞き取る |
| 13 | story/answer | chain | 36 | 問いへの答えを3ノードへ収束。新しい主張を足さない |
| 14 | story/answer | card | 36 | 視聴者が今後のニュースで確認する3項目：場所、必要量、接続時期 |
| 15 | recap | recap | 30 | 3表現を既出文脈で回収し、最後3秒のCTA |
| 合計 | | | 424 | 各sceneの音声実測で360〜480秒へ収める |

setup2 / mechanism3 / complication3 / answer2、学習4＋hook1=15scene。phrase開始は138秒（32.5%）と219秒（51.7%）、retrieval開始296秒（69.8%）。phrase開始間隔81秒、2つ目からretrievalまで77秒。正規の配置例として使う。

## 3. 原稿の品質見本（ニュースとして未検証、投稿不可）

以下は語り口・chunk分割の見本。実ニュース本文には出典で支持できる命題だけを使う。

```text
A new building / can be ready / before its power supply is.
That sounds strange, / because we often think of electricity / as something always available.
But a large project / needs more than a place to plug in.
It may also need / new equipment outside the building.
So why can a data center / take longer to connect / than we expect?
```

日本語補助を全文焼き込みにせず、主図には「A building ≠ a power connection」の命題だけを置く。≠は比較の補助表現として読み上げず、原稿と意味を合わせる。先行詞が不明なitを連発しない。センセーショナルな「AI will leave homes without power」のような出典以上の断定へ書き換えない。

phrase sceneの語り口：

```text
Is expected to / describes a prediction.
It does not mean / that the result is certain.
The project is expected to open next year.
The date can still change.
```

ここでも最後の2文が実プロジェクトを指すならclaimが必要。一般例なら架空例と画面に明示する。ニュースの実例と学習の仮例を混ぜない。

## 4. 最初の12本の編集枠

タイトルは確定ニュースではなく探索する問い。公開順は採点結果で決めるが、各カテゴリ4本を目標にする。採択条件未達を枠埋めしない。

| 枠 | カテゴリ | 探索する問い | 使いたい情報構造 |
|---|---|---|---|
| 1 | technology | データセンターと電力接続 | chain |
| 2 | work_money | 値上げ後も価格が戻りにくい理由 | compare |
| 3 | science_society | 天気予報の確率は何を表すか | metric＋compare |
| 4 | technology | 同じ機能でも端末内とクラウドで違うこと | compare |
| 5 | work_money | 人手不足でも採用に時間がかかる理由 | chain |
| 6 | science_society | 再生可能電力と時間帯の問題 | timeline＋compare |
| 7 | technology | 修理しやすさが製品価格以外を変える理由 | chain |
| 8 | work_money | 配送の最後の区間に費用がかかる理由 | chain |
| 9 | science_society | リサイクルできることと実際にすることの差 | compare |
| 10 | technology | 翻訳が正確でも意味が伝わらない理由 | compare |
| 11 | work_money | 定額サービスで使う人と払う人が違う理由 | metric |
| 12 | science_society | 水があっても使える水が不足する理由 | chain |

これらを先に大量の完成原稿へしない。旬の一次資料と日本人視聴者の接点を確認する。

## 5. 観測レコード

episodeId、revision、videoId、publishAt、category、centralQuestion、visualMix、wordCount、durationSec、phrase/retrieval開始秒、selectedPackaging、costUsd、runnerMinutesを記録。

公開+7日と+28日で同じ経過日数の値を比較。取得日時とwindow開始/終了を保存。viewCount、impressions、impressionsCTR、averageViewDuration、averagePercentageViewed、retention30Sec、各学習区間の前後retention、returningViewersを収集。API非対応・権限不足・集計不足ならnull＋reason。0で埋めない。Studio CSVの手動取込を初期実装とし、未確認のAnalytics API指標名を実装しない。

retentionは相対時刻→sceneへ対応。learningDrop = retention(start-5sec) - retention(end+5sec)、同じ動画の同程度の長さのstory区間と比較。全体の自然減を「学習が悪い」と即断しない。トラフィックソース（browse/search/suggested/external）の構成比も保存する。

## 6. 初期の判定ルール

数値は成功保証や業界平均ではなく、この実験の次行動を決める基準。

- 7日でimpressions<1000またはviews<100ならCTR/retentionの優劣は判定保留。公開数を増やして穴埋めしない。
- 比較可能な3本でCTR中央値<4%、30秒retention≥65%なら入口の改善を優先。タイトル/サムネの片方だけを変える。
- 30秒retention中央値<60%ならhookと前提説明を改善。scene種類を増やさない。
- 平均視聴割合<40%なら、冗長説明と情報の飛躍を確認。
- 学習区間の低下が比較storyより5ポイント以上大きい例が3本続けば、挿入の文脈か長さを一つだけ変更。
- 重大事実誤りが1件でもあれば量産を止め、裏取り工程を直す。
- 費用/runner上限が3本連続で超えるなら頻度を増やさず、clip cache・render負荷を改善。

B1相当の日本語話者5人による利用テストも最初の3本で実施する。視聴後「中心の問いへの答え」を自分の言葉で説明、字幕なしの既出1文を理解、3表現のうち1つを別の文脈で使う、を記録。各課題4/5人の達成を初期目安にする。募集・回答は未実施であり、架空の結果を作らない。YouTube二択でクリックログが得られるとは仮定しない。

## 7. 12本後の判断

内容理解と維持が良い→同仕様で次12本。入口だけ弱い→テーマ/packaging実験。聞き取り場面だけ弱い→配置/長さの実験。両方弱い→題材と視聴者像を再評価。標本不足→判定保留。CTRと視聴時間の単純な増加を学習効果の証明にはしない。
