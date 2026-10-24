"""Fixture builders. Every id and source here is synthetic ("fx-..."), never real data."""
from datetime import datetime, timedelta, timezone

from rat_audit.analytics.common import Report

T0 = datetime(2025, 3, 1, 15, 0, tzinfo=timezone.utc)  # 10:00 in Boston


def rep(i, key="k1", day=0, closed_after=1, tag="monitoring", hour=0, source="fx-311"):
    opened = T0 + timedelta(days=day, hours=hour)
    closed = None if closed_after is None else opened + timedelta(days=closed_after)
    return Report(f"fx:{i}", key, opened, closed, tag, source)
