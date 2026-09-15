# Editorial image generation

## Purpose

Generated images are not decoration. They are allowed only when one image can replace explanatory text or make an abstract mechanism immediately concrete.

The governing principles are coherence, signaling, temporal contiguity, and segmenting: remove competing material, direct the eye, align visual meaning with narration, and give the learner time to process one idea at a time.

## Budget

- Maximum 3 generated images per episode.
- Preferred placements: hook, one mechanism/analogy scene, one complication/context scene.
- Phrase, retrieval, and recap scenes do not receive generated images.
- An image replaces the central explanatory visual for its scene; it is not layered on top of another dense diagram.
- Bilingual subtitles remain visible below the image and are never embedded into the generated image.

## Prompt rules

Prompts request:

- 16:9 landscape editorial/documentary composition
- one obvious focal point
- no logos
- no captions or readable text
- no UI or infographic labels
- restrained negative space
- a concrete visual metaphor when the concept is abstract

Avoid decorative stock-photo aesthetics, visual clutter, fake screenshots, and text-heavy generated graphics.

## Runtime

`scripts/build_image_briefs.mjs` deterministically chooses up to three eligible scenes and writes `public/generated/image-briefs.json`.

`scripts/generate_cloudflare_images.mjs` optionally calls Cloudflare Workers AI `@cf/black-forest-labs/flux-1-schnell`. It requires GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

If either secret is missing, generation is skipped and rendering continues with the normal eight visual primitives.

Generated JPEGs are cached by manifest hash. The APPROVED 1080p workflow restores only that reviewed cache; it does not generate new images after approval.

## Review criteria

Reject an image when:

- the viewer must inspect details to understand it;
- it competes with subtitles for attention;
- it merely repeats a diagram already on screen;
- it contains malformed or misleading text;
- it makes a factual claim that is not supported by the manifest;
- removing it would make the scene clearer.

The default is no generated image. Use one only when it reduces explanation cost.
