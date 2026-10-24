"""Boston 311 'Rodent Activity' closure_reason -> action tag (contracts/categories.json).

Ordered, first-match-wins regex rules. Drafted by Kiro Crew campaign d19b46b7 on
2024-2026 notes, then aligned to the categories.json meanings:
- "violation issued" / "cited" / "ticket" are `citation` (Citation / ticket / violation).
- `collections` means a fine sent to collections, not DPW picking something up.
- DPW pickups and removals are `cleanup` (Public Works).
- Empty notes are `closed_no_action`; text that matches nothing is `unknown`.

Ambiguity policy: tag the strongest completed action. Future or conditional intent
("will bait as needed", "will issue violation if necessary") is `monitoring`,
except abatement (usually written in future tense) and scheduled inspections.

Usage: python3 closure_classifier_rules.py notes.json   (CKAN records with closure_reason)
"""
import json
import re
import sys
from collections import Counter

RULES = [
    ("duplicate",       r"duplicate of existing case|resubmitted as|duplicate complaint"),
    ("collections",     r"collections"),
    ("abatement_order", r"abatement|order to abate|24[- ]?hour (notice|order)"),
    ("citation",        r"\bcitations?\b|ticket(ed)?\b|fined|violations? (has been |have been )?issued|"
                        r"issued (a )?violation|found in violation|already been cited|\bcited\b"),
    ("warning",         r"warning|notice of violation|notice to (the )?owner|spoke (to|with) (the )?owner|"
                        r"contacted (the )?(owner|landlord|management)|letter (sent|mailed)"),
    ("baiting",         r"\bbait|rodenticide|\btraps?\b|exterminat|pest (control|mitigation|treatment)|"
                        r"private pest|\btreated\b|treatment"),
    ("barrels",         r"rat[- ]?resistant|barrel lid|sealed lid"),
    ("cleanup",         r"dpw (will )?pick up|pick up (the )?(dead|trash|rat)|contact dpw|clean[- ]?up|cleaned|"
                        r"debris removed|trash removed|\bremoved\b"),
    ("no_violation",    r"case invalid|no violations? (found|at this time)|not in violation|unable to (locate|find)|"
                        r"gone on arrival|wrong address|e[- ]?form denied|unfounded|no evidence|"
                        r"no rat (burrow|activity)|found no rat|no ars|\bars\b (not )?found"),
    ("referral",        r"esd will follow|referred to|refer to|sent to housing court|forwarded to|animal control|"
                        r"housing court"),
    ("inspection",      r"as a result of an? inspection|inspector (visited|responded|found)|site visit|"
                        r"\binspection\b|inspected|\binspect\b|investigate"),
    ("monitoring",      r"monitor|will check (the )?area|look for rodent activity|case noted|\bnoted\b|working on"),
]
_COMPILED = [(tag, re.compile(rx, re.I)) for tag, rx in RULES]


def classify_closure_reason(text):
    t = (text or "").strip()
    if not t or t.lower() in ("case closed", "case closed."):
        return "closed_no_action"
    for tag, rx in _COMPILED:
        if rx.search(t):
            return tag
    return "unknown"


if __name__ == "__main__":
    rows = json.load(open(sys.argv[1]))["result"]["records"]
    c = Counter(classify_closure_reason(r.get("closure_reason")) for r in rows)
    n = sum(c.values())
    for tag, k in c.most_common():
        print(f"{tag:16} {k:5} {100*k/n:5.1f}%")
    print(f"non-unknown {100*(n-c['unknown'])/n:.1f}% of {n}")
