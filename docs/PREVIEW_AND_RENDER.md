# Preview and Render Strategy

## Goal

Development should not require a local machine for every visual check, while production rendering remains on GitHub Actions as in the previous Remotion projects.

Recommended setup:

1. **Browser preview:** GitHub Pages + `@remotion/player`
2. **Render-parity preview:** GitHub Actions low-resolution MP4 artifact
3. **Production:** GitHub Actions full 1080p render

This gives fast UI review plus a real rendered-file check.

---

## 1. Browser preview: GitHub Pages + Remotion Player

Remotion Player can render a Remotion composition interactively in the browser. Build a small static Vite app that:

- imports the same `NewsEnglishVideo` component as production
- loads an `EpisodeManifest`
- displays the composition inside `@remotion/player`
- allows play/pause/seek
- optionally exposes a scene list and jump buttons
- optionally allows switching between fixture manifests

### Why this is the primary development preview

- no local setup is required after deployment
- no MP4 render is required for every CSS/layout iteration
- seek is instant compared with repeated cloud renders
- the exact same scene React components are exercised
- GitHub Pages is enough; no application backend is required

### Important limitation

Player preview is not a substitute for final rendering. Browser/player behavior and encoded MP4 behavior can differ around fonts, media loading, timing, codecs and Chromium details. Therefore the Actions preview render remains the final gate.

### Suggested URL structure

```text
https://<owner>.github.io/english-youtube/
```

The page should show:

```text
[ Episode selector ] [ Scene selector ] [ Current manifest SHA ]

+--------------------------------------------------+
|                 Remotion Player                  |
+--------------------------------------------------+

Scene 01  Cold Open          00:00
Scene 02  Number Reveal      00:24
Scene 03  Cause / Effect     00:52
...
```

For the first implementation, the preview site can use a committed fixture such as:

```text
fixtures/demo-episode.json
```

Later, the workflow can copy the newest generated episode manifest into the preview build.

---

## 2. GitHub Actions preview render

Use a manually-triggered (`workflow_dispatch`) and/or pull-request workflow.

Inputs:

- episode manifest path
- optional render range
- optional scale

Recommended defaults:

- 960x540 or 1280x720
- H.264 MP4
- first 60–120 seconds for ordinary UI work
- full episode only when editorial timing must be reviewed

Outputs:

```text
preview.mp4
contact-sheet.jpg
render-report.json
```

Upload them with `actions/upload-artifact` and short retention (for example 5–14 days).

The MP4 artifact is the authoritative check for:

- audio sync
- font rendering
- transitions
- media loading
- output encoding
- actual render duration

GitHub artifacts require downloading to view the MP4, so they are intentionally secondary to the browser Player preview.

---

## 3. Optional contact sheet

For fast asynchronous review, generate screenshots at representative timestamps and combine them into a contact sheet.

Example sampling:

```text
00:05
00:25
01:00
02:00
04:00
06:00
08:00
final recap
```

A contact sheet is useful for spotting:

- text overflow
- repetitive layouts
- weak hierarchy
- excessive Japanese
- insufficient visual variation

It is much cheaper to inspect than a full render.

---

## 4. Why not commit preview MP4s to the repository

Do not use Git history as video storage.

Reasons:

- repository size grows indefinitely
- binary diffs are useless
- cloning becomes expensive
- old development renders have little long-term value

Use Actions artifacts for ephemeral rendered files.

If browser-streamable encoded preview files become necessary later, use object storage/CDN rather than the Git repository.

---

## 5. Production workflow

Production rendering should run only from a validated immutable episode manifest.

```text
validate manifest
  -> verify assets
  -> generate/fetch narration audio
  -> calculate timings
  -> render 1920x1080
  -> generate subtitles
  -> generate thumbnail assets
  -> upload artifacts
  -> optional YouTube publish
```

The production workflow should archive:

- manifest SHA
- git commit SHA
- source list
- model/generation metadata where useful
- render duration
- output checksum

This makes every published video reproducible.

---

## 6. Development loop

### UI/component development

```text
push branch
 -> CI validates TypeScript/schema
 -> preview site build
 -> inspect in Remotion Player
 -> manually render representative preview if needed
```

### Daily agent run

```text
agent creates episode manifest
 -> schema/editorial validation
 -> browser preview becomes available
 -> preview MP4 render
 -> automated QA
 -> production render/publish if policy allows
```

### Scene Library change

Scene Library changes should be treated like normal code changes and tested against a fixture suite containing edge cases:

- very short/long captions
- long Japanese gloss
- large numbers
- 2/5/8 timeline events
- map labels
- quotes
- dense cause-effect diagrams

---

## 7. Recommendation

Start with **GitHub Pages + Remotion Player** as the default remote preview.

It directly exploits Remotion's browser-preview model and avoids spending Actions minutes on every visual iteration. Keep **Actions MP4 artifacts** as the render-parity gate, not as the primary editing UI.

Local `remotion studio` remains useful for intensive motion-design work, but it should not be required for ordinary episode review.
