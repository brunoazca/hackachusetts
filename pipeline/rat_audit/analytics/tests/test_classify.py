import pytest

from rat_audit.analytics.classify import RULES, classify, contract_tags, coverage


def tag(note):
    return classify(note)[0]


def test_every_rule_tag_is_in_the_contract():
    tags = contract_tags()
    assert {t for t, _ in RULES} <= tags
    assert {"closed_no_action", "unknown"} <= tags


@pytest.mark.parametrize("note", [None, "", "   ", "Case Closed.", "case closed"])
def test_empty_is_closed_no_action(note):
    assert classify(note) == ("closed_no_action", 1.0, "empty")


def test_no_match_is_unknown():
    assert classify("Rodent activity reported again") == ("unknown", 0.0, "no_match")


@pytest.mark.parametrize("note,expected", [
    # precedence: first matching rule wins
    ("Violation issued; placed in for collections", "collections"),
    ("Inspector confirmed rodent activity; abatement order", "abatement_order"),
    ("Ticket issued, owner warned and baited", "citation"),
    ("Spoke with owner, baited the rear yard", "warning"),
    ("Baited burrows; inspection done", "baiting"),
    ("Duplicate of existing case 101005", "duplicate"),
    ("Referred to code enforcement for trash issues", "referral"),
    ("Area inspector monitoring", "monitoring"),
    ("Area inspector working on the issue", "monitoring"),
    ("Violation issued by code enforcement", "citation"),
    ("Property will be issued violation for rodent activity", "citation"),
    ("Violation issued to owners of the adjacent lot", "citation"),
    ("Citation issued for overgrown weeds", "citation"),
])
def test_rule_precedence(note, expected):
    assert tag(note) == expected


@pytest.mark.parametrize("note,expected", [
    ("No violations issued at this time", "no_violation"),
    ("No code enforcement violation found at this time", "no_violation"),
    ("Not treated. Inspector visited", "inspection"),
    ("Did not bait; no rodent activity observed", "no_violation"),
    ("No signs of rodent activity", "no_violation"),
    ("Unable to locate, no ticket issued", "no_violation"),
])
def test_negations_cancel_the_action(note, expected):
    assert tag(note) == expected


@pytest.mark.parametrize("note,expected,reason", [
    ("Will bait as needed", "monitoring", "conditional"),
    ("Will issue violation if necessary", "monitoring", "conditional"),
    ("ISD will investigate and issue violation if necessary", "inspection", "rule"),  # scheduled inspection kept
    ("Abatement order will be issued if activity persists", "abatement_order", "rule"),
    ("Will issue violation if necessary. Baited the burrows.", "baiting", "rule"),  # completed action wins
])
def test_conditional_intent(note, expected, reason):
    t, _, r = classify(note)
    assert (t, r) == (expected, reason)


def test_case_insensitive_and_deterministic():
    assert tag("ABATEMENT ORDER ISSUED") == "abatement_order"
    assert [classify("Baited") for _ in range(3)] == [classify("Baited")] * 3


@pytest.mark.parametrize("note,expected", [
    # patterns from real 2025/2026 public notes after ingest's clean_note + scrub_note
    ("Violations found.", "citation"),
    ("Property will be written up for rodent activity", "citation"),
    ("Activity found for further information please email [staff]", "inspection"),
    ("No activity found at this time", "no_violation"),
    ("Rodent activity not found.", "no_violation"),
    ("Nothing was found at the location.", "no_violation"),
    ("City will treat burrows in tree pit", "baiting"),
    ("Smoke team is scheduled to treat this area this Friday morning", "baiting"),
    ("Dead rat picked up", "cleanup"),
    ("See new case BCS-1234", "duplicate"),
    ("Case currently open for property for further information please email [staff]", "duplicate"),
    ("Case has been abated. Scheduled hearing for February 25th.", "abatement_order"),
    ("Timed out; please contact Boston 311 if issue remains unaddressed", "closed_no_action"),
    ("Working with homeowner to resolve recent activity.", "monitoring"),
    ("Referring to Boston Public Works for pick up.", "cleanup"),
    ("Message has been left with constituent", "unknown"),  # contact only: no action named
])
def test_real_note_patterns(note, expected):
    assert tag(note) == expected


def test_coverage_report():
    rows = [(2025, "monitoring")] * 9 + [(2025, "unknown")] + [(2026, "unknown")] * 2 + [(2026, "baiting")] * 3
    cov = coverage(rows, {2026: ["x"]})
    y25, y26 = cov["by_year"]["2025"], cov["by_year"]["2026"]
    assert y25["n"] == 10 and y25["non_unknown"] == 0.9 and y25["meets_threshold"]
    assert y26["non_unknown"] == 0.6 and not y26["meets_threshold"]
    assert y26["unknown_samples"] == ["x"]
    assert abs(sum(y25["share"].values()) - 1) < 1e-9
