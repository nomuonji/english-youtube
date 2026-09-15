"""Design-contract checks only; no audio, render, or evidence verification."""
from __future__ import annotations

import copy
import json
import re
from datetime import datetime
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def semantic_errors(doc: dict) -> set[str]:
    errors: set[str] = set()
    groups = ("sources", "claims", "utterances", "learningPoints", "scenes")
    maps = {key: {item["id"]: item for item in doc[key]} for key in groups}
    for key in groups:
        if len(maps[key]) != len(doc[key]):
            errors.add("E_DUPLICATE_ID")
    sources, claims, utterances, points, scenes = (maps[k] for k in groups)

    def references(values, target):
        if any(value not in target for value in values):
            errors.add("E_REFERENCE")

    for claim in claims.values():
        references([e["sourceId"] for e in claim["evidence"]], sources)
    for utterance in utterances.values():
        references(utterance["claimIds"], claims)
        words = re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*", utterance["text"])
        if (
            " ".join(utterance["chunks"]) != utterance["text"]
            or len(words) > 26
            or len(utterance["translationJaChunks"]) != len(utterance["chunks"])
            or "".join(utterance["translationJaChunks"]) != utterance["translationJa"]
        ):
            errors.add("E_TEXT")

    ownership: list[str] = []
    owner: dict[str, int] = {}
    for index, scene in enumerate(doc["scenes"]):
        uids = scene["utteranceIds"]
        references(uids, utterances)
        ownership.extend(uids)
        owner.update({uid: index for uid in uids})
        visual = scene["visual"]
        references(visual.get("claimIds", []), claims)
        if scene["glossLearningPointId"] is not None:
            references([scene["glossLearningPointId"]], points)
        items = visual.get("nodes", visual.get("rows", visual.get("events", [])))
        reveals = [item["revealAtUtteranceId"] for item in items]
        if any(uid not in uids for uid in reveals):
            errors.add("E_REVEAL")
        elif [uids.index(uid) for uid in reveals] != sorted(uids.index(uid) for uid in reveals):
            errors.add("E_REVEAL")
        if visual["type"] == "phrase":
            references([visual["learningPointId"]], points)
        elif visual["type"] == "retrieval":
            references([visual["sourceUtteranceId"]], utterances)
        elif visual["type"] == "recap":
            references(visual["learningPointIds"], points)
            if set(visual["learningPointIds"]) != set(points):
                errors.add("E_LEARNING")

    if len(ownership) != len(set(ownership)) or set(ownership) != set(utterances):
        errors.add("E_OWNERSHIP")
    if ownership != [u["id"] for u in doc["utterances"]]:
        errors.add("E_ORDER")

    for point in points.values():
        uid = point["sourceUtteranceId"]
        references([uid], utterances)
        if uid not in owner or uid not in utterances:
            errors.add("E_LEARNING")
            continue
        first_scene = doc["scenes"][owner[uid]]
        if first_scene["role"] != "story" or point["phrase"].casefold() not in utterances[uid]["text"].casefold():
            errors.add("E_LEARNING")
        for i, scene in enumerate(doc["scenes"]):
            visual = scene["visual"]
            if visual["type"] == "phrase" and visual["learningPointId"] == point["id"] and i <= owner[uid]:
                errors.add("E_LEARNING")

    for i, scene in enumerate(doc["scenes"]):
        visual = scene["visual"]
        if visual["type"] == "retrieval":
            uid = visual["sourceUtteranceId"]
            if uid not in owner or owner[uid] >= i or doc["scenes"][owner[uid]]["role"] != "story":
                errors.add("E_RETRIEVAL")

    def dt(value):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))

    if dt(doc["asOf"]) > dt(doc["generatedAt"]) or any(dt(s["retrievedAt"]) > dt(doc["generatedAt"]) for s in sources.values()):
        errors.add("E_FRESHNESS")

    if doc["kind"] == "production":
        if len(sources) < 3 or len({s["independenceGroup"] for s in sources.values()}) < 2 or not any(s["isPrimary"] for s in sources.values()):
            errors.add("E_EVIDENCE")
        if any(c["certainty"] == "disputed" for c in claims.values()):
            errors.add("E_EVIDENCE")
        if (dt(doc["generatedAt"]) - dt(doc["asOf"])).total_seconds() > 86400:
            errors.add("E_FRESHNESS")
        roles = [s["role"] for s in doc["scenes"]]
        if roles[0] != "hook" or roles[-1] != "recap" or any(roles.count(k) != n for k, n in {"hook": 1, "phrase": 2, "retrieval": 1, "recap": 1}.items()) or not 8 <= roles.count("story") <= 20:
            errors.add("E_STRUCTURE")
        beats = [s["beat"] for s in doc["scenes"] if s["role"] == "story"]
        order = ["setup", "mechanism", "complication", "answer"]
        if any(not 2 <= beats.count(beat) <= 5 for beat in order) or beats != sorted(beats, key=order.index):
            errors.add("E_BEAT")
        if len({s["visual"]["type"] for s in doc["scenes"]}) < 4:
            errors.add("E_STRUCTURE")
        learned = [s["visual"]["learningPointId"] for s in doc["scenes"] if s["role"] == "phrase"]
        if len(set(learned)) != 2:
            errors.add("E_LEARNING")
        story_texts = [utterances[uid]["text"].casefold() for s in doc["scenes"] if s["role"] == "story" for uid in s["utteranceIds"] if uid in utterances]
        if any(sum(text.count(p["phrase"].casefold()) for text in story_texts) < 2 for p in points.values()):
            errors.add("E_LEARNING")
        spoken = [u["text"] for u in doc["utterances"]]
        for scene in doc["scenes"]:
            visual = scene["visual"]
            if visual["type"] == "retrieval" and visual["sourceUtteranceId"] in utterances:
                spoken.extend([utterances[visual["sourceUtteranceId"]]["text"]] * 2)
        total = sum(len(re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*", text)) for text in spoken)
        if not 760 <= total <= 980:
            errors.add("E_WORDS")
    return errors


def main():
    schema = read(ROOT / "schemas/episode.schema.json")
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    fixture = read(ROOT / "fixtures/contract-demo.json")
    validator.validate(fixture)
    assert not semantic_errors(fixture), semantic_errors(fixture)
    assert {s["visual"]["type"] for s in fixture["scenes"]} == {"card", "metric", "chain", "compare", "timeline", "phrase", "retrieval", "recap"}

    def reject(label, mutation, expected=None):
        changed = copy.deepcopy(fixture)
        mutation(changed)
        structural = list(validator.iter_errors(changed))
        semantic = semantic_errors(changed) if not structural else set()
        assert structural or semantic, f"Unexpected acceptance: {label}"
        if expected:
            assert expected in semantic, (label, semantic)
        return 1

    count = 0
    count += reject("unknown root key", lambda d: d.update(css="body {}"))
    count += reject("unknown visual key", lambda d: d["scenes"][0]["visual"].update(variant="anything"))
    count += reject("metric missing value", lambda d: d["scenes"][1]["visual"].pop("value"))
    count += reject("wrong role", lambda d: d["scenes"][0].update(role="retrieval"))
    count += reject("three quiz options", lambda d: d["scenes"][6]["visual"]["options"].append("Other"))
    count += reject("invalid date", lambda d: d.update(generatedAt="yesterday"))
    count += reject("too many nodes", lambda d: d["scenes"][2]["visual"]["nodes"].extend([d["scenes"][2]["visual"]["nodes"][0]] * 3))
    count += reject("unknown source", lambda d: d["claims"][0]["evidence"][0].update(sourceId="missing"), "E_REFERENCE")
    count += reject("unknown claim", lambda d: d["utterances"][1].update(claimIds=["missing"]), "E_REFERENCE")
    count += reject("duplicate source", lambda d: d["sources"].append(copy.deepcopy(d["sources"][0])), "E_DUPLICATE_ID")
    count += reject("mismatched chunks", lambda d: d["utterances"][0].update(text="Different words."), "E_TEXT")
    count += reject("mismatched translation", lambda d: d["utterances"][0].update(translationJa="異なる訳"), "E_TEXT")
    count += reject("reveal outside scene", lambda d: d["scenes"][2]["visual"]["nodes"][0].update(revealAtUtteranceId="u-hook"), "E_REVEAL")
    count += reject("unused utterance", lambda d: d["scenes"][0].update(utteranceIds=["u-metric"]), "E_OWNERSHIP")
    count += reject("future retrieval", lambda d: d["scenes"][6]["visual"].update(sourceUtteranceId="u-recap-one"), "E_RETRIEVAL")
    count += reject("phrase absent from source", lambda d: d["learningPoints"][0].update(phrase="turn out"), "E_LEARNING")
    count += reject("future asOf", lambda d: d.update(asOf="2026-09-16T00:00:00Z"), "E_FRESHNESS")
    count += reject("fixture is not production", lambda d: d.update(kind="production"))

    links = 0
    for path in [ROOT / "README.md", ROOT / "AGENTS.md", *sorted((ROOT / "docs").glob("*.md"))]:
        for target in re.findall(r"\]\(([^)]+)\)", path.read_text(encoding="utf-8-sig")):
            if "://" in target or target.startswith("#"):
                continue
            target = target.split("#")[0]
            assert (path.parent / target).resolve().exists(), f"Broken link: {path.name}: {target}"
            links += 1
    print(f"PASS: schema, 8 visual types, fixture references, {count} negative cases, {links} local links")
    print("NOT TESTED: factual support, editorial quality, live TTS, timing, layouts, Actions, uploads")


if __name__ == "__main__":
    main()
