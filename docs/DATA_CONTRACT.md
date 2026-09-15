# データ契約 v2.1

新規実装の構造正本は[episode-v2.1.schema.json](../schemas/episode-v2.1.schema.json)。JSON Schema Draft 2020-12、追加fieldは明示定義し、自由なpayload拡張は不可。型生成はschema→TypeScriptの一方向。Zodを別に手書きしない。実装ではAjv2020＋ajv-formatsを使用する。

設計段階のv2.1 schemaは、既存v2.0 schemaの安定した `$defs` を参照している。M1ではAjvへ両schemaをローカル登録するか共通定義schemaへ抽出し、外部ネットワークでschemaを解決しない。v2.0 manifestを暗黙migrationしない。

## 1. ファイルと所有者

```text
episodes/YYYY-MM-DD-slug/
  manifest.json         # 編集者が生成。freeze後の編集はrevisionを上げる
  research.json         # 候補評価・反証・選定理由。記事全文は置かない
  editorial-review.json # 項目別採点、レビュー者、根拠、修復履歴
runs/YYYY-MM-DD/run-id/
  state.json            # 段階・入力hash・結果hash・attempt・費用
  report.json           # 失敗コード、スキップ理由、改善要求
  READY.json            # freeze後に一度だけ作るActions起動マーカー
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

READY.jsonは `runId / episodeId / revision / manifestHash / generatedAt` を必須とする。READY作成後に同runのmanifestを書き換えない。revision変更は新runで新READYを作る。

research.jsonはrunId、candidates、selectedCandidateId（null可）、counterEvidence、selectionReasonを必須。editorial-review.jsonはmanifestHash、reviewer、reviewedAt、scores、hardFailures、repairsを持つ。これらはレンダラー入力ではない。

## 2. manifestフィールド

| field | 意味 |
|---|---|
| schemaVersion | 固定2.1.0。旧版の暗黙migrationなし |
| kind | fixture / production。fixtureは公開禁止 |
| episodeId | YYYY-MM-DD-slug。日付は作成したJST日 |
| revision | 1以上の整数。同一episodeの編集変更で+1 |
| generatedAt / asOf | UTC RFC3339。生成日時と事実確認基準日時 |
| category | technology / work_money / science_society |
| newsPeg | eventClaimId / eventDate / whyNow。時事の入口 |
| centralQuestion / answer | 各一文の英語。動画全体の問いと答え |
| sources | sourceId、publisher、URL、取得日時、公開日、独立主体、一次資料か |
| claims | 確度、英語文、asOf、evidence配列 |
| utterances | 1文ずつの原稿、字幕chunks、日本語訳と対応チャンク、claimIds |
| learningPoints | 正確に3つ。phrase、meaningJa、sourceUtteranceId |
| scenes | 順序確定の配列。id、role、beat、utteranceIds、visual、glossLearningPointId |
| packaging | 3組のタイトル/サムネとselectedIndex |

### newsPeg

`newsPeg.eventClaimId` はclaims内の既存claimを参照し、そのclaimはevidenceを持つ。`eventDate` はdateまたはnull。不明を捏造しない。`whyNow` は「この出来事が、なぜ今centralQuestionを説明する理由になるか」を書く。単なる「話題だから」は不合格。

productionではhook/setupの75秒以内に、news pegの主体・出来事・知る理由が理解できることを編集レビューで確認する。

### utterance / chunks

utterance.textはchunksを半角スペースで連結した値と完全一致。chunksは意味上の区切りで最小1、最大4、各72文字以下。translationJaChunksは英語chunksと同数・同順で、対応する意味を訳す。英語の断定度と数字を維持する。

scene.beatはstoryならsetup/mechanism/complication/answer、その他null。role=hook/storyにはcard/metric/chain/compare/timeline、role=phrase/retrieval/recapには同名visual。glossLearningPointIdはnullまたは既存learningPoint ID。

## 3. 参照・意味の必須検査

schemaだけでは保証できないため、`semanticValidate` で以下を検査する。

- 全IDが各配列内で一意（E_DUPLICATE_ID）。参照先が存在（E_REFERENCE）。
- newsPeg.eventClaimIdが既存claimを指し、そのclaimがevidenceを持つ（E_NEWS_PEG）。
- utteranceは通常sceneにちょうど1回所属。retrievalはsourceUtteranceId経由のみ再使用（E_OWNERSHIP）。
- sceneのutterance順がutterances配列順と一致。未使用原稿を許可しない（E_ORDER）。
- chunk連結=text、和訳chunk数一致・連結=translationJa、全文26words以下、1文だけ（E_TEXT）。
- claim evidenceのsourceId、utterance/visualのclaimIdsが既存参照（E_REFERENCE）。
- revealAtUtteranceIdは同sceneの文、配列中のreveal順は文順と非減少（E_REVEAL）。
- roleとvisualの組み合わせ、beatのnull条件、retrievalのutteranceIdsが空、recapが3文（E_ROLE）。
- hookは先頭に1、recapは末尾に1、**phraseは1〜2**、retrievalは1、storyは8〜20（E_STRUCTURE）。
- storyのbeatはsetup→mechanism→complication→answerの順、各2〜5scene（E_BEAT）。
- learningPoint.sourceUtteranceIdは先行storyの文で、phraseがその文に連続出現（E_LEARNING）。
- 3つのphraseはstory原稿内でそれぞれ2回以上使用し、recapのID集合がlearningPointsと完全一致（E_LEARNING）。
- phrase sceneは互いに異なるlearningPointを指す（E_LEARNING）。
- **phrase sceneで扱われないlearningPointは、sourceUtteranceIdを所有する最初のstory sceneのglossLearningPointIdと一致すること**（E_LEARNING）。
- retrieval対象は先行storyの文、正解は0/1。問いと選択肢の妥当性は編集レビュー（E_RETRIEVAL）。
- 最低4種のvisual。story同型3連続はW_REPETITION（警告）。
- asOf ≤ generatedAt。retrievedAt ≤ generatedAt。productionのasOfは生成前24時間以内（E_FRESHNESS）。
- productionは3出典・2独立主体・1一次資料以上（E_EVIDENCE）。

fixtureだけ免除する条件は実装時に明示し、参照、閉じた型、role、chunk一致、newsPeg参照、音声整合性、画面overflowは免除しない。

## 4. resolved.json（コンパイラ出力）

rendererとPlayerはmanifest単体を受け取らず、検証済みresolved bundleを受け取る。v2.1ではTTS clipをutterance単位ではなくscene speech group単位で保持する。

```typescript
type Resolved = {
  version: "2.1.0";
  episodeId: string;
  revision: number;
  manifestHash: string;
  engineCommit: string;
  lockfileHash: string;
  profileHash: string;
  fontsHash: string;
  fps: 30;
  width: 1920;
  height: 1080;
  durationFrames: number;
  clips: Array<{
    clipId: string;
    sceneId: string;
    path: string;
    sha256: string;
    sampleRate: 48000;
    samples: number;
    utterances: Array<{
      utteranceId: string;
      startSample: number;
      endSample: number;
      chunkBoundariesSamples: number[];
    }>;
  }>;
  retrievalSegments: Array<{
    sourceUtteranceId: string;
    path: string;
    sha256: string;
    sampleRate: 48000;
    samples: number;
  }>;
  scenes: Array<{
    sceneId: string;
    startFrame: number;
    durationFrames: number;
    audioEvents: Array<{
      assetPath: string;
      startFrame: number;
    }>;
    cues: Array<{
      startFrame: number;
      endFrame: number;
      utteranceId: string;
      chunkIndices: number[];
      text: string;
      translationJa: string;
    }>;
    phases: Array<{
      name: "normal" | "prompt" | "listen" | "think" | "reveal" | "answer";
      startFrame: number;
      endFrame: number;
    }>;
  }>;
};
```

clip内部境界はsamples基準、scene/cue/phasesは動画先頭基準frame。pathはbundle内の許可相対pathだけ。絶対パス、`..`、URLを拒否する。

各speech groupのutterance境界とchunk境界はSSML markとWAV終端から得る。境界は単調増加し、0未満やsamples超過を許可しない。mark欠落・逆順・0frame cueは停止。

retrievalSegmentsはsource utteranceの実測sample範囲から決定的に生成する。同じsourceUtteranceIdに対してlisten/revealは同じsegment hashを使う。retrieval用TTSは存在しない。

semantic検査：先頭scene.startFrame=0、次の開始=前の終了、最終終了=durationFrames。audio/cueが所属scene外へ出ない。cue同士は非重複。存在しないasset、欠けたhash、1frame未満のcueは停止。

## 5. READY契約

日次エージェントはfreeze後にREADYを最後のGit変更として作成する。prepare workflowはREADY pathのpushだけを主トリガーとし、以下を再検査する。

- READYのepisodeId/revisionがmanifestと一致
- READYのmanifestHashがcheckoutしたmanifestのcanonical hashと一致
- commit SHAがworkflow起動対象と一致
- 同じREADYがすでにprepared済みならidempotentにskip

hash不一致はblocked。推測して最新manifestへ追従しない。

## 6. 成果物の契約

- checksums.json：bundle内の全ファイル（自身除外）の相対path→SHA256。
- provenance.json：gitCommit、lockfileHash、runtimeのNode/Chromium/FFmpeg版、font hashes、TTS provider/voice/profileHash、作成時刻、manifestHash。秘密情報なし。
- qa.json：bundleHash、stage、checkedAt、checks、editorialReviewHash、status、warnings。
- metadata.json：title、description、chapters、thumbnailHash、captionHashes、defaultLanguage=en、defaultAudioLanguage=en、madeForKids=false、syntheticDisclosureDecisionと理由。
- render-report.json：bundleHash、engineCommit、renderProfile、outputHash、durationFrames、renderSeconds、audioLUFS、truePeakDb、qaHash。
- upload receipt：episodeId/revision/bundleHash/videoId/resumableSessionRef/state/updatedAt。

実装M1でこれらのruntime schemaも作り、不正bundleを描画前に拒否する。

## 7. hashと変更

manifestHashはUTF-8、キー辞書順、空白なし、非ASCII非escapeのJSONをSHA256。配列順は維持。浮動小数値はmanifestで使わない。

editorial manifest変更→revision+1→新run/new READY。原稿変更時は該当scene speech groupを再生成し、以降を再検査する。音声providerが同じでも再合成すれば別asset。hash一致の既存assetを再利用して初めて再現性が成立する。本番renderはネットワークTTSを呼ばない。
