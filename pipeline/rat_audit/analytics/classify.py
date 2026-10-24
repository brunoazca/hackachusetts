"""Task 2.2: closure note -> `incidents.action_tag` for Boston rodent cases (R3.1, R10.4).

Port of `knowledge/sources/scripts/closure_classifier_rules.py` (Kiro Crew campaign d19b46b7):
ordered, first-match-wins rules over the contract tags in `contracts/categories.json`, plus
- negation: an action phrase preceded in the same clause by "no", "not", "without", "never",
  "unable to" ... does not count ("no violation issued" is not a citation);
- conditional intent: "will issue violation if necessary", "will bait as needed" are not completed
  actions; when nothing else matches they become `monitoring` (the rules file's stated policy).
  Abatement and scheduled inspections keep their tag (they are usually written in future tense);
- empty note -> `closed_no_action`; text that matches no rule -> `unknown`.

Input is the public `closure_note`. Ingest (`clean_note`) strips the 311 boilerplate prefix, so a
note that said only "Case Noted." arrives empty and is tagged `closed_no_action` here, while the
research counted it as monitoring. Coverage is unaffected; the monitoring share is lower.
"""
from __future__ import annotations

import re
from collections import Counter

import psycopg

from ..ingest.common import categories

RULES: list[tuple[str, str]] = [
    ("duplicate",       r"duplicate of existing case|resubmitted as|duplicate complaint|\bduplicate\b|"
                        r"see (new|follow[- ]?up) case|(currently|already) open for (the )?property"),
    ("collections",     r"collections"),
    ("abatement_order", r"abatement|abated|order to abate|24[- ]?hour (notice|order)"),
    ("citation",        r"\bcitations?\b|ticket(ed)?\b|fined|violations? (has been |have been |was |were )?issued|"
                        r"issue[ds]? (a )?violation|found in violation|already been cited|\bcited\b|"
                        r"violations? (were )?found|violations include|written up"),
    ("warning",         r"warning|notice of violation|notice to (the )?owner|spoke (to|with) (the )?owner|"
                        r"contacted (the )?(owner|landlord|management)|letter (sent|mailed)"),
    ("baiting",         r"\bbait|rodenticide|\btraps?\b|exterminat|pest (control|mitigation|treatment)|"
                        r"private pest|\btreat(ed)?\b|treatment|burrow ?rx|smoke team"),
    ("barrels",         r"rat[- ]?resistant|barrel lid|sealed lid"),
    ("cleanup",         r"dpw (will )?pick up|pick(ed)? up (the )?(dead|trash|rat)|contact dpw|clean[- ]?up|cleaned|"
                        r"debris removed|trash removed|\bremoved\b|\bpick(ed)? ?up\b|remove (the )?dead"),
    ("no_violation",    r"case invalid|^invalid\b|no (\w+ ){0,3}violations?\b|not in violation|"
                        r"unable to (locate|find)|gone on arrival|wrong address|e[- ]?form denied|unfounded|"
                        r"no evidence|no (signs? of )?(rat|rodent)s? ?(burrows?|activity)|found no (rat|rodent)|"
                        r"no (\w+ ){0,2}(activity|rodents?|rats?|source|burrows?) (was |were )?(found|observed|seen)|"
                        r"nothing (was )?found|\bnot found\b|no visible (rodent|rat)|"
                        r"no ars|\bars\b (not )?found"),
    ("referral",        r"esd will follow|referred to|refer to|referring to|sent to housing court|forwarded to|"
                        r"animal control|housing court|in court"),
    ("inspection",      r"as a result of an? inspection|inspector (visited|responded|found|confirmed)|site visit|"
                        r"\binspection\b|inspected|\binspect\b|investigat|activity (was )?found|found activity|"
                        r"activity (in|on) (the )?(area|property)|walk ?through|came out and met"),
    ("closed_no_action", r"timed out|we now consider this (request|service|case)"),
    ("monitoring",      r"monitor|will check (the )?area|look for rodent activity|case noted|\bnoted\b|working on|"
                        r"working with (the )?(home ?owner|owner|constituent|landlord|property)|"
                        r"will look (for|at)"),
]
_COMPILED = [(tag, re.compile(rx, re.I)) for tag, rx in RULES]

# Rules whose match can be cancelled by a negation or turned conditional.
_NEGATABLE = {"duplicate", "abatement_order", "citation", "warning", "baiting", "barrels", "cleanup", "referral", "inspection"}
_CONDITIONAL_OK = {"abatement_order", "inspection"}  # future tense is still the action
_NEGATION = re.compile(r"\b(no|not|never|without|nothing|unable to|did not|didn't|does not|doesn't|no need)\b"
                       r"(\W+\w+){0,4}\W*$", re.I)
_CONDITION = re.compile(r"\b(if (necessary|needed|warranted|required|activity (persists|continues)|any)|"
                        r"as needed|when needed|if (the )?(issue|problem|condition)s? (persists?|continues?))\b", re.I)
_CLAUSE_SPLIT = re.compile(r"[.;!?]|\bbut\b|\bhowever\b", re.I)

CONFIDENCE = {"rule": 0.9, "conditional": 0.6, "closed_no_action": 1.0, "unknown": 0.0}


def _clause(text: str, start: int, end: int) -> tuple[str, str]:
    """Text of the clause around a match: (before the match, after the match)."""
    b = max((m.end() for m in _CLAUSE_SPLIT.finditer(text, 0, start)), default=0)
    nxt = _CLAUSE_SPLIT.search(text, end)
    return text[b:start], text[end: nxt.start() if nxt else len(text)]


def classify(note: str | None) -> tuple[str, float, str]:
    """note -> (action_tag, confidence, reason). reason is 'rule', 'conditional', 'empty' or 'no_match'."""
    t = (note or "").strip()
    if not t or t.lower().rstrip(".") in ("case closed", "closed", "case resolved", "resolved"):
        return "closed_no_action", CONFIDENCE["closed_no_action"], "empty"
    conditional = False
    for tag, rx in _COMPILED:
        for m in rx.finditer(t):
            if tag in _NEGATABLE:
                before, after = _clause(t, m.start(), m.end())
                if _NEGATION.search(before):
                    continue
                if tag not in _CONDITIONAL_OK and (_CONDITION.search(after) or _CONDITION.search(before)):
                    conditional = True
                    continue
            return tag, CONFIDENCE["rule"], "rule"
    if conditional:
        return "monitoring", CONFIDENCE["conditional"], "conditional"
    return "unknown", CONFIDENCE["unknown"], "no_match"


def contract_tags() -> set[str]:
    return set(categories()["actions"])


def coverage(rows: list[tuple[int, str]], unknown_samples: dict[int, list[str]] | None = None,
             threshold: float = 0.90) -> dict:
    """rows: (year, tag). Per year: counts, shares, non-unknown share and pass/fail vs threshold."""
    by_year: dict[int, Counter] = {}
    for y, tag in rows:
        by_year.setdefault(y, Counter())[tag] += 1
    out = {}
    for y in sorted(by_year):
        c = by_year[y]
        n = sum(c.values())
        non_unknown = (n - c["unknown"]) / n if n else None
        out[str(y)] = {
            "n": n,
            "counts": dict(sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))),
            "share": {k: round(v / n, 4) for k, v in sorted(c.items())},
            "non_unknown": round(non_unknown, 4) if non_unknown is not None else None,
            "meets_threshold": bool(non_unknown is not None and non_unknown >= threshold),
            "unknown_samples": (unknown_samples or {}).get(y, [])[:15],
        }
    return {"threshold": threshold, "by_year": out}


def run(conn: psycopg.Connection) -> dict:
    tags = contract_tags()
    missing = {t for t, _ in RULES} - tags | ({"closed_no_action", "unknown"} - tags)
    if missing:
        raise RuntimeError(f"rules use tags not in contracts/categories.json: {sorted(missing)}")
    rows = conn.execute(
        """select id, closure_note, extract(year from opened_at at time zone 'America/New_York')::int,
                  action_tag, action_confidence
           from incidents where city = 'boston' and category = 'rodent' and status = 'closed'
           order by id"""
    ).fetchall()
    if not rows:
        from .common import MissingInput
        raise MissingInput({"table": "incidents", "where": "city='boston' and category='rodent' and status='closed'",
                            "loader": "rat_audit.ingest.t311", "why": "closure notes to classify"})
    updates, cov_rows, reasons = [], [], Counter()
    samples: dict[int, list[str]] = {}
    for iid, note, year, old_tag, old_conf in rows:
        tag, conf, reason = classify(note)
        reasons[reason] += 1
        cov_rows.append((year, tag))
        if tag == "unknown" and note:
            s = samples.setdefault(year, [])
            if len(s) < 15:
                s.append(note[:160])
        if tag != old_tag or old_conf is None or abs(old_conf - conf) > 1e-6:
            updates.append((iid, tag, conf))
    if updates:
        conn.execute("create temp table _tags (id text primary key, tag text, conf real) on commit drop")
        with conn.cursor().copy("copy _tags from stdin") as cp:
            for u in updates:
                cp.write_row(u)
        conn.execute("update incidents i set action_tag = t.tag, action_confidence = t.conf from _tags t where i.id = t.id")
    # Open cases have no closure yet: clear any stale tag.
    cleared = conn.execute(
        "update incidents set action_tag = null, action_confidence = null "
        "where city = 'boston' and category = 'rodent' and status = 'open' and action_tag is not null"
    ).rowcount
    conn.commit()
    return {"classified": len(rows), "updated": len(updates), "cleared_open": cleared,
            "reasons": dict(reasons), "coverage": coverage(cov_rows, samples)}
