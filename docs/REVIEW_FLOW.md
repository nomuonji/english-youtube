# Review flow

1. A READY commit triggers validation, Kokoro ONNX TTS, exact sample timing, and a 540p review render.
2. GitHub Pages hosts the Remotion Player for fast browser review of layout and pacing.
3. The review artifact should contain the 540p MP4, resolved timing data, render props, and a contact sheet.
4. Only an approved episode proceeds to the 1080p final render and publishing stages.

The public Pages build must never include internal `runs/`, READY markers, research notes, or editorial-review data.
