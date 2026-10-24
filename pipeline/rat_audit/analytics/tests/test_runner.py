"""Runner/CLI regression tests with mocked steps and connection; no database is used."""
from unittest.mock import Mock

import pytest

from rat_audit import analytics
from rat_audit.analytics.common import MissingInput


@pytest.fixture
def runner(monkeypatch):
    conn = Mock()
    start, end = Mock(return_value=7), Mock()
    monkeypatch.setattr(analytics, "_log_start", start)
    monkeypatch.setattr(analytics, "_log_end", end)
    steps = {}
    for name in analytics.STEPS:
        result = {"by_tag": {}} if name == "outcomes" else {}
        if name == "correlations":
            result = {fid: {"status": "ok"} for fid in analytics.correlations.FINDINGS}
        if name == "costs":
            result = {"rows": {"repeat_cases": {"status": "ok"}}, "missing_inputs": []}
        steps[name] = Mock(return_value=result)
        monkeypatch.setattr(getattr(analytics, name), "run", steps[name])
    return conn, steps, start, end


@pytest.mark.parametrize("steps", [[], ["typo"], ["classify", "typo"]])
def test_invalid_steps_fail_before_touching_database(runner, steps):
    conn, runs, start, end = runner
    with pytest.raises(ValueError):
        analytics.run_all(conn, steps)
    start.assert_not_called()
    end.assert_not_called()
    assert not conn.mock_calls
    assert all(not run.called for run in runs.values())


@pytest.mark.parametrize("status", ["missing_input", "error", "skipped"])
def test_partial_findings_are_not_a_success(runner, status):
    conn, runs, _, end = runner
    runs["correlations"].return_value = {
        "trash-storage-vs-rodent": {"status": status},
        "what-worked": {"status": "ok"}, "move-out-spike": {"status": "ok"},
    }
    result = analytics.run_all(conn, ["correlations"])
    assert result["ok"] is False
    assert result["steps"]["correlations"]["status"] == "partial"
    assert result["steps"]["correlations"]["findings"]["trash-storage-vs-rodent"]["status"] == status
    end.assert_called_once_with(conn, 7, False, result["steps"])


def test_all_findings_failed_is_error(runner):
    conn, runs, _, _ = runner
    runs["correlations"].return_value = {fid: {"status": "error"} for fid in analytics.correlations.FINDINGS}
    result = analytics.run_all(conn, ["correlations"])
    assert result["ok"] is False
    assert result["steps"]["correlations"]["status"] == "error"


def test_missing_cost_input_is_partial(runner):
    conn, runs, _, _ = runner
    runs["costs"].return_value["missing_inputs"] = [{"table": "spending"}]
    result = analytics.run_all(conn, ["costs"])
    assert result["ok"] is False
    assert result["steps"]["costs"]["status"] == "partial"
    assert result["steps"]["costs"]["missing_inputs"] == [{"table": "spending"}]


def test_complete_run_still_succeeds(runner):
    conn, runs, _, end = runner
    result = analytics.run_all(conn)
    assert result["ok"] is True
    assert list(result["steps"]) == analytics.STEPS
    assert all(v["status"] == "ok" for v in result["steps"].values())
    assert all(run.call_count == 1 for run in runs.values())
    end.assert_called_once_with(conn, 7, True, result["steps"])


def test_failed_classifier_skips_dependents_but_runs_independent_steps(runner):
    conn, runs, _, _ = runner
    runs["classify"].side_effect = MissingInput({"table": "incidents"})
    result = analytics.run_all(conn)
    assert result["ok"] is False
    assert result["steps"]["classify"]["status"] == "missing_input"
    assert result["steps"]["sites"]["status"] == "skipped"
    assert result["steps"]["outcomes"]["status"] == "skipped"
    runs["sites"].assert_not_called()
    runs["outcomes"].assert_not_called()
    runs["correlations"].assert_called_once_with(conn, outcomes=None, skip={"what-worked"})
    runs["costs"].assert_called_once_with(conn, use_sites=False)
    conn.rollback.assert_called_once()


@pytest.mark.parametrize("value", ["typo", "", "classify,", "classify,typo"])
def test_cli_rejects_invalid_steps_before_connecting(monkeypatch, value):
    from rat_audit.analytics import __main__ as cli
    connect = Mock()
    monkeypatch.setattr(cli.db, "connect", connect)
    with pytest.raises(SystemExit) as exc:
        cli.main(["--steps", value])
    assert exc.value.code == 2
    connect.assert_not_called()


def test_cli_partial_run_exits_nonzero(monkeypatch, capsys):
    from contextlib import nullcontext
    from rat_audit.analytics import __main__ as cli
    conn = Mock()
    run = Mock(return_value={"ok": False, "steps": {"costs": {"status": "partial"}}})
    monkeypatch.setattr(cli.db, "connect", lambda: nullcontext(conn))
    monkeypatch.setattr(cli, "run_all", run)
    assert cli.main(["--steps", " costs "]) == 1
    run.assert_called_once_with(conn, ["costs"])
    assert '"partial"' in capsys.readouterr().out
