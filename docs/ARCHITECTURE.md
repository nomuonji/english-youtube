# Architecture: Template vs Agent

## 1. Design goal

The system must be automated without becoming visibly repetitive.

The key separation is:

- **Template owns visual grammar**
- **Agent owns editorial judgment**

A daily scheduled agent should behave like an editor/director using an existing motion-design system, not like a frontend engineer rewriting the video engine every day.

---

## 2. Layers

### Layer 0 — Render engine (code, stable)

Owned by repository code.

Responsibilities:

- Remotion composition registration
- fps / resolution / audio mixing
- scene timing engine
- transitions
- typography
- safe areas
- subtitle renderer
- accessibility / line-length rules
- asset loading
- fallback behavior
- schema validation
- deterministic rendering
- output encoding

The daily agent **must not edit this layer**.

### Layer 1 — Scene Library (code, slowly evolving)

Reusable visual primitives.

Initial scene types:

- `cold_open`
- `headline`
- `narrative`
- `number_reveal`
- `timeline`
- `map`
- `entity_profile`
- `quote`
- `cause_effect`
- `comparison`
- `before_after`
- `process`
- `question`
- `english_lens`
- `chunk_breakdown`
- `listening_challenge`
- `prediction`
- `counterpoint`
- `what_next`
- `recap`

Each component has several variants. Example:

```text
cause_effect:
  chain
  branches
  funnel
  loop

comparison:
  split
  table
  scale

number_reveal:
  hero-number
  counter
  before-after
```

The agent chooses a type + variant. It does not control arbitrary CSS.

### Layer 2 — Editorial grammar (rules, stable)

Rules enforced by validators rather than hard-coded scene order.

Examples:

- duration target: 8–12 minutes
- English narration is primary
- no more than two identical scene types consecutively
- visual information should change regularly
- at least one strong question/open loop in the first 30 seconds
- at least two learning interventions, but no long classroom-style interruption
- use Japanese only when it reduces comprehension cost
- every learning point must first appear naturally in the story
- recap only contains expressions actually used in the episode
- no unsupported factual claim

This gives consistency without producing the same episode structure every day.

### Layer 3 — Episode Manifest (agent-generated every run)

This is the core agent output.

The agent decides:

- story/topic
- central question
- angle
- title candidates
- thumbnail copy candidates
- narrative structure
- scene order
- scene type/variant
- narration
- on-screen text
- emphasis/chunks
- vocabulary/glosses
- data points
- citations/source URLs
- learning interventions
- pacing hints
- asset requirements

The output must validate against `schemas/episode.schema.json`.

### Layer 4 — Asset planning (agent-generated, bounded)

The agent can request assets using a structured contract, for example:

```json
{
  "kind": "image",
  "query": "AI data center aerial exterior",
  "purpose": "establishing visual",
  "fallback": "abstract-server-grid"
}
```

or

```json
{
  "kind": "map",
  "locations": ["Virginia, USA", "Texas, USA"],
  "purpose": "show data-center concentration"
}
```

For this project, external images/videos are supporting material. The product should remain understandable even if only text UI, diagrams, icons, maps and simple illustrations are available.

### Layer 5 — QA (automated)

Before rendering:

- JSON schema validation
- source count and source timestamps
- unsupported-claim detection
- duplicate/repetitive scene detection
- text overflow estimation
- subtitle line-length validation
- English level check
- Japanese overuse check
- learning-point provenance check
- total estimated duration
- title/thumbnail sanity check

After preview render:

- render success
- audio present
- duration expected
- no missing assets
- representative screenshots generated

### Layer 6 — Publish (workflow)

Only after QA.

- final 1080p render
- thumbnail
- metadata
- captions
- upload
- archive manifest + sources + render metadata

---

## 3. What is templated

Template/code should own anything where consistency is beneficial:

- brand identity
- type scale
- color system
- subtitle system
- English/Japanese hierarchy
- motion curves
- spacing
- transition vocabulary
- information-card patterns
- layout algorithms
- charts/timelines/maps
- timing calculations
- audio ducking
- intro/outro treatment
- text overflow handling
- fallbacks
- quality checks

This is the product's design system.

---

## 4. What the daily agent decides

The agent should own anything where variation and editorial intelligence are beneficial:

- which story deserves a video today
- the central question
- what context the learner actually needs
- which facts should be visualized
- where to slow down
- where to create suspense
- which Scene Library component best explains each idea
- whether a timeline, map, number, quote, comparison or causal diagram is appropriate
- which English phrase deserves attention
- where a listening challenge naturally fits
- how difficult the narration should be
- which Japanese glosses are necessary
- what should be omitted
- final title/thumbnail candidates

---

## 5. What the daily agent must NOT do

- change React components
- change CSS/design tokens
- invent a new scene type inside an episode
- hardcode frame numbers
- insert arbitrary HTML
- add arbitrary animation code
- publish an unsupported factual claim
- copy long passages from news sources
- turn the episode into a vocabulary lecture
- use every available scene type just because it exists

If a new visual grammar is genuinely needed, the agent should output a `scene_library_request` in its report, not modify production code during the daily run.

---

## 6. Controlled creativity

To avoid template fatigue, every scene exposes **bounded creative parameters**.

Example:

```json
{
  "type": "cause_effect",
  "variant": "chain",
  "density": "medium",
  "emphasis": "consequence",
  "tempo": "fast",
  "items": [
    {"label": "AI demand"},
    {"label": "More data centers"},
    {"label": "More electricity"},
    {"label": "Grid pressure"}
  ]
}
```

The agent has meaningful editorial freedom, while the renderer remains robust.

---

## 7. Video-level structure is NOT a fixed template

There are three broad editorial modes:

### Explainer

Best for: `Why is X happening?`

Typical but non-mandatory elements:

```text
Cold Open -> What happened -> Cause -> Context -> English Lens -> Deeper Cause -> What Next -> Recap
```

### Timeline

Best for: `How did X get here?`

```text
Cold Open -> Present event -> Timeline -> Turning point -> Listening Challenge -> Present consequence -> What Next
```

### Two Sides

Best for contested questions.

```text
Cold Open -> Claim -> Case A -> Case B -> Key vocabulary -> Evidence comparison -> What remains uncertain -> Recap
```

The agent chooses the mode and can vary the sequence.

---

## 8. Text UI is the competitive advantage

The system should optimize for comprehension rather than photorealism.

### Persistent layer

- spoken English captions
- current section/question
- subtle progress indication

### Contextual layer

Only when useful:

- Japanese micro-gloss
- chunk boundaries
- key verb highlighting
- pronoun/reference arrows
- number/unit explanation
- cause-effect arrows
- entity labels

### Learning intervention

Short, story-connected inserts:

- `english_lens`: 10–25 sec
- `chunk_breakdown`: 10–25 sec
- `listening_challenge`: 20–45 sec
- `recap`: 30–60 sec

The story must remain the main product.

---

## 9. Source of truth

Each episode is represented by one immutable manifest after approval:

```text
episodes/YYYY-MM-DD-slug/
  manifest.json
  research.json
  script.txt
  captions.json
  assets.json
  render.json
```

The same manifest feeds:

- Remotion Player preview
- preview MP4
- production MP4
- subtitles
- article/reading material in the future
- Shorts extraction in the future

This prevents preview/production drift.
