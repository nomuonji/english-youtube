# 編集・学習仕様 v2.1

本書の数値は初期運用の固定値。日次生成で緩めない。構造は[データ契約](DATA_CONTRACT.md)と[v2.1修正](V2_1_CHANGES.md)を使う。

## 1. 対象と題材

視聴者は日本語話者の成人、英文なら理解できるB1中級者。移動中の聞き流しより、スマートフォンを横にして画面を見る利用を主とする。前提知識は一般生活のみ。企業名・技術用語・制度名は初出で一文説明する。

対象カテゴリはtechnology（技術と生活）、work_money（仕事とお金の仕組み）、science_society（科学と社会）の3つ。株の売買推奨、治療、法的対応、選挙予測、進行中の戦闘、未確認の不祥事、災害速報は初期12本から除外。

各production episodeは必ず `newsPeg` を持つ。動画は「時事そのもの」を長く追うのではなく、**news peg → central question → evergreen explanation → answer/limits** の順で価値を作る。

## 2. 候補探索の手順

毎日07:17 JSTに起動。直近7日の発表・報道から最大12候補。各カテゴリ最大4件。古い背景資料は利用可。検索結果スニペットだけで採択しない。公開前24時間以内に新しい展開の有無を再確認する。

候補レコードはcandidateId、category、eventDate（不明ならnull）、questionEn、questionJa、whyNow、sourceUrls、score、rejectionReason。URLが一つも確認できない候補は破棄。直近30本と「中心の問い＋主要な答え」が同じなら重複。続報でも答えが変わらなければ作らない。

採択時に、whyNowを支える具体的なevent claimを一つ選び、最終manifestの `newsPeg.eventClaimId` にする。

各項目を整数0〜4で採点し、score = Σ(weight × rating / 4)（最大100）。採点根拠を一文ずつ保存。

| 項目 | 重み | 0 / 2 / 4の基準 |
|---|---:|---|
| relevance | 25 | 視聴者との接点なし / 間接的 / 仕事・生活への具体的接点 |
| explanation | 25 | 発表の言い換え / 一つの理由 / 因果と限界を説明可能 |
| evidence | 20 | 根拠不明 / 二次報道のみ / 一次資料＋独立資料 |
| visual | 15 | 映像必須 / 図が補助 / 図で仕組みの理解が改善 |
| language | 10 | 専門語だらけ / 表現が2つ / 汎用表現3つが自然に登場 |
| durability | 5 | 明日無価値 / 1週間 / 1か月後も背景が役立つ |

75点以上、evidence・explanation各3以上のみ採択候補。同点はevidence、relevance、candidateId辞書順。上位最大3候補を深掘りし、最初の合格1件を制作。全部不合格ならskipped。1日1本までfreeze、未公開完成在庫が3本あれば探索記録だけ残す。

## 3. 裏取り

制作には3出典以上、2つ以上の独立した発行主体、1つ以上の一次資料が必要。転載は同一independenceGroup。企業発表は発表した事実を支えるが、宣伝上の効果の証明とはしない。

各claimに、意味を限定した英語文、certainty、asOf、evidence（sourceId / locator / supportNote）を持たせる。locatorは章見出し、表番号またはページ。supportNoteは自分の言葉で資料が何を支持するかを書く。取得日時、URL、発行日（不明はnull）、出版社をsourceに残す。記事全文や長文転載は保存しない。

- confirmed：資料で確認できる事実。因果の推測には付けない。
- reported：発行主体がそう報じた。音声で発行主体を明示。
- estimate：推定と対象期間を音声・画面で示す。
- forecast：将来予測。willと断定せずcould / is expected to等を使う。
- disputed：初期版では制作不採択。
- inference：複数事実からの本動画の解釈。This suggests等で分ける。反例・限界も原稿に入れる。

固有名詞・日時・金額・割合・比較・因果を含む全utteranceと画面payloadにclaimを結びつける。純粋な問い、学習指示、一般的な接続文は空配列可。LLMの自己申告だけでは裏取り済みと扱わない。

## 4. 一本の構造

productionは360〜480秒、実際に再生する全英語音声（retrieval replayを含む）760〜980 words。目安は420秒・880 words。映像の尺は音声実測で決める。語数から秒数を固定しない。無音による水増しは禁止。

story beatは4つ：setup（何が起きたか）、mechanism（仕組み）、complication（単純ではない理由）、answer（問いへの答えと限界）。各beatは2〜5シーン。別にhook 1、phrase 1〜2、retrieval 1、recap 1を置く。全体13〜25シーンを目安とする。hook→setup→mechanism→complication→answer→recapという意味の順序は固定。学習挿入の位置と各beat内の図解順は内容で選ぶ。

| 区間 | 完了条件 |
|---|---|
| 最初の0〜25秒 | 生活につながる具体的な疑問、centralQuestionを音声で言う。挨拶なし |
| 75秒以内 | news pegの主体、出来事、なぜ今知る価値があるかが分かる |
| phraseが1件 | 全体25〜65%のどこかで既出表現を短く解説 |
| phraseが2件 | #1を25〜45%、#2を45〜65%。互いに十分離す |
| 全体の65〜85% | retrieval 1回。直前の専用学習sceneから30秒以上を目安 |
| 残り60秒以内 | centralQuestionに直接答える。確実な事実と未確定部分を区別 |
| 最後20〜30秒 | recapで3表現を一つずつ回収。新事実を足さない |

実測時間で窓から外れれば編集へ戻す。尺を変えるためにTTS速度を勝手に変えない。1つの図解シーンは12〜40秒、hookは15〜25秒、phraseは12〜20秒。retrievalは音声長から算出し22〜36秒、recapは20〜30秒。図解は内容が増える瞬間のみ段階表示し、5秒ごとの無意味な切替を強制しない。

## 5. 英語と日本語

平均文長12〜18 words、1文最大26 words。1utteranceは1文、最大26 words。wordsは英数字語を空白・句読点で区切り、内部apostrophe/hyphenを一語扱い。数字の読み上げは原稿で展開する（2.5%→two point five percent）。画面の数値だけ2.5%にしてよい。

一文の従属節は最大1つ。指示語の先行詞が曖昧なら名詞を繰り返す。専門語は1本5語まで、初出説明を必須とし、単なる短文率をCEFR判定と呼ばない。B1として理解できるかは編集レビュー対象。

学習表現は正確に3つ。各2〜5語を原則とし、汎用的な連語・構文を選ぶ。各表現はstoryの中で2回以上使用し、最初の使用をsourceUtteranceIdで指す。復習のために事実関係を変えない。

専用phrase sceneで扱うのは1〜2表現。専用sceneで扱わないlearning pointは、そのsourceUtteranceIdを所有する最初のstory sceneでglossを表示する。phrase sceneが1件なら残る2件を別々の初出storyでglossする。recapでは3つすべて回収する。

各文に日本語訳translationJaを付けるが、通常画面に焼き込まない。日本語glossはlearningPoint.meaningJaから取得し、一度に一つ、24文字以内。phraseでは同じ意味を48pxで表示。retrieval答えの日本語は48文字以内。日本語音声は使わない。

## 6. 聞き取りの仕様

既出storyの1utteranceを選び、同じ既出音声区間を2回再生する。対象音声は6〜10秒。問いは内容理解を測る二択。語彙の綴り当ては禁止。

1. 問いと2択を3秒表示（無音）。指示は「Listen for the reason.」固定表示。
2. 対象音声を再生。英語焼き込み字幕とglossは隠す。選択肢は残す。
3. 3秒の無音で考える。カウントダウン数字は3→2→1、点滅なし。
4. **同じ切り出しWAV**を再生し、英語チャンク字幕と正解を表示。
5. 4秒の無音で短い日本語の答えを表示。終わったらstoryへ戻る。

総秒数=10+2×対象音声秒。retrieval用の新規TTSは作らない。元storyのscene speech groupから実測sample境界で決定的に切り出す。誤答は本文で誤りと判断できる内容にし、原稿にない知識を要求しない。内容の答えをナレーションが初回前に言ってしまう問いは却下。

## 7. タイトル・サムネ・説明欄

候補は3組のtitleJa / thumbnailJa。titleJaは48文字以下、「具体的な問い｜やさしい英語」。thumbnailJaは12文字以下、最大2行、タイトルの丸写し禁止。3組をrelevance・clarity・truthfulness各0〜4で採点、合計最大をselectedIndexへ。同点は配列先頭。選定理由を編集レポートに保存。

タイトルやサムネはnews pegの時事性を利用してよいが、centralQuestionの内容を誤認させない。単なる速報見出しにはしない。

サムネは1280×720、背景#102A43、主文96px・Noto Sans JP Bold、左右80pxの余白。右側にmain metricかchainの要約を一つ、左側に問い。下64pxは小ラベル「英語でわかる世界」。根拠のない危機煽り、ロゴ、実在人物の生成画像は使わない。

説明欄は日本語120〜220文字の要約→対象「英語B1目安／英語字幕・日本語CC」→実測chapter→3表現→出典URLと発行主体→「音声は合成音声です。」→訂正履歴。全体4000文字以内。chapterは00:00から、3個以上、各10秒以上。

## 8. 編集レビューの合否

各0〜2点：問いに答える、因果が飛ばない、生活との接点、B1で追える、学習が自然、原資料の要約以上の説明がある。合計10/12以上かつ0項目なし。

追加hard fail：

- newsPeg.eventClaimIdの根拠がない
- 75秒以内にnews pegの主体・出来事・why nowが理解できない
- phrase sceneで扱われないlearning pointの初出glossがない
- retrievalが既出音声と同一内容でない
- 事実の裏付け、権利、予測の断定に問題がある

修復2回で不合格ならそのrunをskippedとして終了する。
