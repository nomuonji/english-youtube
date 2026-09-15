# Editorial System

## Positioning

The channel is not "English news class".

It is a **current-affairs explainer channel that happens to be optimized for English learners**.

Viewer promise:

> Understand one important story in the world, in clear English, and leave with several reusable expressions.

## Topic selection

The scheduled agent should generate candidates from current news and score each candidate 0–5 on:

- `importance`: matters beyond a one-day headline
- `curiosity`: can be expressed as a compelling question
- `background_depth`: supports 8–12 minutes of explanation
- `english_value`: naturally contains reusable English
- `visualizability`: can be explained with text/data/maps/timelines
- `shelf_life`: retains value after the day of publication
- `source_quality`: enough reliable primary/major sources exist
- `audience_relevance`: understandable/relevant to a Japanese learner

Reject topics that are mainly:

- a single quote or minor announcement
- celebrity gossip without explanatory depth
- rumors
- information requiring unavailable footage to be interesting
- extremely technical stories that cannot be simplified responsibly
- political stories where the agent cannot fairly represent material competing interpretations

Prefer a topic that can be reframed as a durable question, e.g.:

- Event: a tech company announces a huge data-center investment
- Episode question: `Why Does AI Need So Much Electricity?`

## Research standard

For ordinary stories:

- use at least 3 sources where possible
- prefer primary documents + high-quality independent reporting
- record publication time/date
- distinguish event date from article publication date
- mark uncertain claims explicitly
- do not convert predictions into facts

For politics, conflict, markets, science, health, law or other high-consequence topics:

- use more than one independent source
- include primary sources when available
- represent material disagreement fairly
- avoid loaded language unless quoting/attributing it

The final manifest stores sources and claim/source links.

## Story construction

Every episode needs one central question.

A good question has:

- an obvious surface answer
- a deeper answer revealed later
- a reason the viewer should care

The agent should build 3–6 narrative beats, not a list of facts.

Example:

```text
Question: Why does AI need so much electricity?

Beat 1: Demand is growing very quickly.
Beat 2: The model itself is only part of the story.
Beat 3: Data centers create a power + cooling problem.
Beat 4: Local grids become a bottleneck.
Beat 5: Companies are changing where/how they build infrastructure.
Beat 6: Efficiency may change the equation again.
```

## Opening rule

The first 30 seconds should contain:

- a concrete surprising fact or tension
- the central question
- a promise of a non-obvious answer

Avoid:

- channel introduction
- "Today we are going to learn..."
- vocabulary list at the start
- long context before the question

## Pacing

Target duration: 8–12 minutes.

Guidelines, not hard templates:

- 0:00–0:30: cold open / question
- first 90 sec: viewer can explain what happened
- every 30–90 sec: introduce a new question, consequence, contrast or reveal
- learning inserts: short and earned by the story
- final 60–90 sec: answer the central question + what next + recap

## English level

Default narration target: **B1–B2 comprehension with selective exposure to B2/C1 news vocabulary**.

Rules:

- prefer short clauses
- explain specialist terms before using them repeatedly
- avoid replacing a common word with a difficult synonym solely to sound formal
- keep authentic news collocations when they are useful
- repeat important expressions naturally across the episode

## Learning system

### 1. Persistent English captions

Always display spoken English in readable chunks.

Do not mirror a full paragraph. Segment by meaning and speech rhythm.

### 2. Japanese micro-gloss

Japanese is support, not a second full subtitle track.

Use it for:

- key unfamiliar phrase
- technical concept
- misleading false friend
- difficult causal sentence
- listening answer reveal

### 3. English Lens

A short intervention for one useful expression already encountered in context.

Example:

```text
The project is expected to cost $40 billion.

be expected to + verb
= 〜すると予想されている
```

Then return immediately to the story.

### 4. Chunk Breakdown

Use when sentence structure itself is valuable.

```text
The company / is under pressure / to reduce costs.
```

Animate chunks in meaning order. Explain only what helps comprehension.

### 5. Listening Challenge

Use a meaningful 1–2 sentence excerpt from the episode.

Sequence:

1. replay without subtitles
2. short pause / question
3. replay with English chunks
4. optional Japanese explanation
5. final replay without Japanese

### 6. Recap

3–7 expressions maximum.

Every expression must:

- have appeared in the episode
- be reusable outside this exact story
- have a concise Japanese meaning
- optionally include the original episode sentence

## Text UI principles

The visual product should help the viewer parse information.

Prefer:

- chunked captions
- kinetic emphasis on verbs/numbers
- timelines
- relationship arrows
- causal chains
- side-by-side comparisons
- entity cards
- maps with only relevant labels
- progressive disclosure

Avoid:

- decorative text motion without information value
- giant blocks of prose
- constant bouncing/zooming
- showing English and full Japanese translations simultaneously for the entire episode
- too many visual elements competing with captions

## Episode diversity rules

To avoid the fatigue seen in earlier fixed-format projects:

- do not require a fixed scene order
- do not require all learning scene types every episode
- do not repeat the same opening pattern more than twice in a row
- vary explainer/timeline/two-sides modes
- choose visual primitives based on the information, not rotation quotas
- preserve a consistent brand while changing the editorial rhythm

The sameness should be: typography, clarity, voice, learning philosophy.

The variation should be: question, story arc, scene mix, pacing, information structures.
