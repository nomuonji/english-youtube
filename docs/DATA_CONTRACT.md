# データ契約 v2

構造の正本は[episode.schema.json](../schemas/episode.schema.json)。JSON Schema Draft 2020-12、additionalProperties=falseをすべてのobjectに適用。自由なpayload拡張は不可。型生成はschema→TypeScriptの一方向。Zodを別に手書きしない。現在添付のPython検査は設計用で、構造・参照・一部の編集不変条件と拒否例を検査する。全文の事実確認、一文判定、音声やlayoutの検査を実装したものではない。実装ではAjv2020＋ajv-formatsを使用する。

## 1. ファイルと所有者

```text
episodes/YYYY-MM-DD-slug/
  manifest.json         # 編集者が生成。凍結後はrevisionを上げる
  research.json         # 候補評価・反証・選定理由。記事全文は置かない
  editorial-review.json # 項目別採点、レビュー者、根拠、修復履歴
runs/YYYY-MM-DD/run-id/
  state.json            # 段階・入力hash・結果hash・attempt・費用
  report.json           # 失敗コード、スキップ理由、改善要求
# 以下はGit外のbundle/artifact
bundle/
  manifest.json
  resolved.json
  audio/<sha256>.wav
  captions.en.srt
  captions.ja.srt
  provenance.json
  checksums.json
out/
  preview.mp4
  final.mp4
  thumbnail.png
  contact-sheet.jpg
  qa.json
  metadata.json
```

research.jsonはrunId、candidates（編集仕様の候補レコード）、selectedCandidateId（null可）、counterEvidence（claimId / sourceId / note）、selectionReasonを必須。editorial-review.jsonはmanifestHash、reviewer、reviewedAt、scores（6項目の0〜2）、hardFailures（code / targetId / detail）、repairs（attempt / targetId / beforeHash / afterHash）。これらはレンダラー入力ではない。

## 2. manifestフィールド

全フィールドはschemaのrequiredに従う。空値を有効値の代わりに使わない。

| field | 意味 |
|---|---|
| schemaVersion | 固定2.0.0。旧版の暗黙migrationなし |
| kind | fixture / production。fixtureは公開禁止 |
| episodeId | YYYY-MM-DD-slug。日付は作成したJST日 |
| revision | 1以上の整数。同一episodeの編集変更で+1 |
| generatedAt / asOf | UTC RFC3339。生成日時と事実確認基準日時 |
| category | technology / work_money / science_society |
| centralQuestion / answer | 各一文の英語。動画全体の問いと答え |
| sources | sourceId、publisher、URL、取得日時、公開日、独立主体、一次資料か |
| claims | 確度、英語文、asOf、evidence配列 |
| utterances | 1文ずつの音声原稿、字幕chunks、日本語訳と対応チャンク、claimIds |
| learningPoints | 正確に3つ。phrase、meaningJa、sourceUtteranceId |
| scenes | 順序確定の配列。id、role、beat、utteranceIds、visual、glossLearningPointId |
| packaging | 3組のタイトル/サムネとselectedIndex |

source.publishedDateはdateまたはnull。不明を00:00等で捏造しない。claim.evidence.locatorに根拠位置、supportNoteに支持する内容を自分の言葉で記載。

utterance.textはchunksを半角スペースで連結した値と完全一致。chunksは意味上の区切りで、最小1、最大4。各chunk最大72文字。複数chunkを同時表示するかは字幕コンパイラが文字計測から決める。translationJaは1文の訳。translationJaChunksは英語chunksと同数・同順で、対応する意味を訳す。空白なしで連結するとtranslationJaに一致し、各48文字以下。語順差は対応可能な意味単位へ原稿を区切り直して解消する。英語の断定度と数字を合わせる。

scene.beatはstoryならsetup/mechanism/complication/answer、その他null。role=hook/storyにはcard/metric/chain/compare/timeline、role=phrase/retrieval/recapには同名visual。hookとstoryを図形名として実装しない。glossLearningPointIdはnullまたは既存lp ID。

## 3. 参照・意味の必須検査

schemaだけでは以下を保証できない。実装者はsemanticValidateで全部検査する。検査コードは括弧内で固定する。

- 全IDが各配列内で一意（E_DUPLICATE_ID）。参照先が存在（E_REFERENCE）。
- utteranceは普通のsceneにちょうど1回所属。retrievalはsourceUtteranceId経由のみ再使用（E_OWNERSHIP）。
- sceneのutterance順がutterances配列順と一致。未使用の原稿は許可しない（E_ORDER）。
- chunk連結=text、和訳chunk数一致・連結=translationJa、全文26words以下、1文だけ（E_TEXT）。略語のピリオドで誤分割しない。
- claim evidenceのsourceId、utterance/visualのclaimIdsが既存参照（E_REFERENCE）。
- revealAtUtteranceIdは同sceneの文、配列中のreveal順は文の順と非減少（E_REVEAL）。
- roleとvisualの組み合わせ、beatのnull条件、retrievalのutteranceIdsが空、recapが3文（E_ROLE）。
- hookは先頭に1、recapは末尾に1、phraseは2、retrievalは1、storyは8〜20（E_STRUCTURE）。
- storyのbeatは4種類が順序通り、各2〜5scene（E_BEAT）。
- sourceUtteranceIdは学習sceneより前にあるstoryの文。phraseがその文に大小文字を無視して連続出現（E_LEARNING）。
- 3つのphraseそれぞれがstory原稿内で2回以上、recapのID集合がlearningPointsと完全一致。2つのphrase sceneは異なるlpを指す（E_LEARNING）。
- retrieval対象は先行するstoryの文、正解は0/1。問いと選択肢に回答可能性があるかは編集レビュー（E_RETRIEVAL）。
- 最低4種のvisual。story同型3連続はW_REPETITION（警告、編集レビューで理由を残す）。
- asOf ≤ generatedAt。retrievedAt ≤ generatedAt。productionのasOfは生成前24時間以内（E_FRESHNESS）。
- productionの3出典・2独立主体・1一次資料、根拠のない事実、学習窓・尺・語数は別段階で検査（E_EVIDENCE / E_TIMING / E_WORDS）。

fixtureだけ免除するのは出典数、鮮度、全文語数、全体尺、scene総数、beat数、学習回数・位置。参照、閉じた型、role、chunk一致、音声整合性、画面overflowはfixtureでも免除しない。検査でkindを書き換えない。

## 4. resolved.json（コンパイラ出力）

rendererとPlayerはmanifest単体を受け取らず、検証済みresolved bundleを受け取る。

```typescript
type Resolved = {
  version: "2.0.0";
  episodeId: string; revision: number;
  manifestHash: string; engineCommit: string; lockfileHash: string;
  profileHash: string; fontsHash: string;
  fps: 30; width: 1920; height: 1080; durationFrames: number;
  clips: Array<{
    utteranceId: string; path: string; sha256: string;
    sampleRate: 48000; samples: number;
    chunkBoundariesSamples: number[]; // 長さ=chunks数+1
  }>;
  scenes: Array<{
    sceneId: string; startFrame: number; durationFrames: number;
    audioEvents: Array<{utteranceId: string; startFrame: number}>;
    cues: Array<{
      startFrame: number; endFrame: number; // グローバル時刻、半開区間
      utteranceId: string; chunkIndices: number[];
      text: string; translationJa: string;
    }>;
    phases: Array<{
      name: "normal" | "prompt" | "listen" | "think" | "reveal" | "answer";
      startFrame: number; endFrame: number;
    }>;
  }>;
};
```

startFrameはすべて動画先頭基準。clipの内部境界だけsamples基準。pathはaudio/<64桁hash>.wavのみ、絶対パス・..・URLを拒否。clipsはutteranceIdごと1件。audioEventsで同じclipの複数再生を指定。phasesはsceneを隙間なく覆う。listen/think/promptにはcueを生成しない。revealのcueのみreplayに対応。

semantic検査：先頭scene.startFrame=0、次の開始=前の終了、最終終了=durationFrames。audio/cueが所属scene外へ出ない。cue同士は非重複。境界samplesは0以上単調増加、最後はsamples以下。存在しないasset、欠けたhash、1frame未満のcueは停止。

## 5. 成果物の契約

- checksums.json：bundle内の全ファイル（自身除外）の相対path→SHA256。path辞書順のcanonical JSONをhashしbundleHashとする。
- provenance.json：gitCommit、lockfileHash、runtimeのNode/Chromium/FFmpeg版、font hashes、TTS provider/voice/profileHash、作成時刻、manifestHash。秘密情報なし。
- qa.json：bundleHash、stage、checkedAt、checks配列（code / pass / targetId / observed / limit）、editorialReviewHash、status=passed|failed。warningは別warnings配列。
- metadata.json：title、description、chapters（startSec/title）、thumbnailHash、captionHashes、defaultLanguage=en、defaultAudioLanguage=en、madeForKids=false、syntheticDisclosureDecisionと理由。
- render-report.json：bundleHash、engineCommit、renderProfile、outputHash、durationFrames、renderSeconds、audioLUFS、truePeakDb、qaHash。
- upload receipt：episodeId/revision/bundleHash/videoId/resumableSessionRef/state/updatedAt。session URLは秘密ストア、Gitのreceiptには参照名だけ。

各成果物の追加fieldは禁止。実装M1でこれらのruntime schemaも作り、不正bundleを描画前に拒否する。

## 6. hashと変更

manifestHashはUTF-8、キー辞書順、空白なし、非ASCII非escapeのJSONをSHA256。配列順は維持。浮動小数値はmanifestで使わない。改行・BOMを除いたparse結果から計算。

editorial manifest変更→revision+1、TTSの変更文だけ再生成、以降すべて再検査。音声providerが同じでも再合成すれば別asset。hash一致の既存assetを再利用して初めて再現性が成立する。本番renderはネットワークTTSを呼ばない。
