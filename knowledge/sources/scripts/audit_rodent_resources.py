#!/usr/bin/env python3
"""Recheck public rodent data; retain schemas/aggregates, never complaint text.

Run from the repository: python3 -B knowledge/sources/scripts/audit_rodent_resources.py
Uses the bounded, unauthenticated curl helper in audit_public_resources.py.
Does not execute external code or treat administrative records as a census.
"""
import concurrent.futures
import csv
import datetime
import io
import json
import pathlib
import urllib.parse

from audit_public_resources import get, repo

ROOT = pathlib.Path(__file__).resolve().parents[1] / 'artifacts'
DATASETS = ["78bs-b5ig", "uz4w-baz5"]
REPOS = ["harvardinformatics/llm-workshop-smart-rat", "ishana-s/Invasive_Rats_Refuse"]


def portal(dataset):
    metadata, data, _ = get("https://data.cambridgema.gov/api/views/" + dataset + ".json")
    metadata["dataset_id"] = dataset
    if isinstance(data, dict):
        for key in ["name", "description", "attribution", "attributionLink", "licenseId", "rowsUpdatedAt", "viewLastModified"]:
            metadata[key] = data.get(key)
        metadata["columns"] = [{k: c.get(k) for k in ["name", "fieldName", "dataTypeName", "description"]}
                               for c in data.get("columns", []) if not c.get("fieldName", "").startswith(":")]
    query = urllib.parse.urlencode({"$select": "count(*) as records"})
    count_meta, count, _ = get("https://data.cambridgema.gov/resource/" + dataset + ".json?" + query)
    metadata["count_probe"] = count_meta
    metadata["count_result"] = count
    sample_meta, sample, _ = get("https://data.cambridgema.gov/resource/" + dataset + ".json?%24limit=3")
    metadata["sample_probe"] = sample_meta
    if isinstance(sample, list):
        metadata["sample_records"] = len(sample)
        metadata["sample_fields"] = sorted(set().union(*(r.keys() for r in sample))) if sample else []
    return metadata


def snapshot(filename):
    url = "https://raw.githubusercontent.com/harvardinformatics/llm-workshop-smart-rat/main/data/raw/" + filename
    meta, _, body = get(url)
    meta["filename"] = filename
    if meta["http_status"] != "200":
        return meta
    reader = csv.DictReader(io.StringIO(body.decode("utf-8-sig")))
    rows = list(reader)
    meta["columns"] = reader.fieldnames
    meta["records"] = len(rows)
    if filename == "smart_rat_boxes.csv":
        meta["distinct_serial_numbers"] = len({r.get("serial_number") for r in rows if r.get("serial_number")})
        meta["missing_latitude"] = sum(not r.get("latitude") for r in rows)
        meta["device_types"] = sorted({r.get("device_type", "") for r in rows})
        meta["installation_date_columns"] = [c for c in reader.fieldnames if "date" in c.lower() or "time" in c.lower()]
    else:
        dates = [datetime.datetime.strptime(r["ticket_created_date_time"], "%m/%d/%Y %I:%M:%S %p")
                 for r in rows if r.get("ticket_created_date_time")]
        meta["created_range"] = [min(dates).isoformat(), max(dates).isoformat()] if dates else []
    return meta


def boston(rid):
    old = rid == "1a0b420d-99f1-4887-9851-990b2a5a6e17"
    category, date = ("type", "open_dt") if old else ("service_name", "open_date")
    query = {"resource_id": rid, "filters": json.dumps({category: "Rodent Activity"}), "limit": 1}
    results = []
    for order in ["asc", "desc"]:
        query["sort"] = date + " " + order
        meta, data, _ = get("https://data.boston.gov/api/3/action/datastore_search?" + urllib.parse.urlencode(query))
        result = data.get("result", {}) if isinstance(data, dict) else {}
        meta["success"] = data.get("success") if isinstance(data, dict) else None
        meta["total_matching_category"] = result.get("total")
        meta["columns"] = [c["id"] for c in result.get("fields", [])]
        meta["boundary_date"] = [r.get(date) for r in result.get("records", [])]
        results.append(meta)
    return {"resource_id": rid, "category_field": category, "exact_category": "Rodent Activity", "probes": results}


def workshop_license():
    meta, _, body = get("https://raw.githubusercontent.com/harvardinformatics/llm-workshop-smart-rat/main/LICENSE")
    content = body.decode("utf-8", errors="replace")
    meta["conflicting_signals"] = [s for s in ["CC BY 4.0", "CC BY-NC-SA 4.0", "by-nc-nd/4.0"] if s in content]
    meta["interpretation"] = "Inconsistent license text; do not assert permissive code reuse. Prefer original City data subject to its terms."
    return meta


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        portals = list(pool.map(portal, DATASETS))
        repositories = list(pool.map(repo, REPOS))
        snapshots = list(pool.map(snapshot, ["smart_rat_boxes.csv", "rodent_311.csv"]))
        boston_sources = list(pool.map(boston, ["1a0b420d-99f1-4887-9851-990b2a5a6e17", "254adca6-64ab-4c5c-9fc0-a6da622be185"]))
    output = {
        "checked_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "scope": "Metadata, counts and small API samples; full workshop CSVs parsed only for aggregates. No individual rows retained. Cambridge records are not Boston records.",
        "portals": portals, "repositories": repositories, "workshop_snapshots": snapshots,
        "boston_exact_category_probes": boston_sources,
        "workshop_license_check": workshop_license(),
    }
    ROOT.joinpath("rodent_resource_audit.json").write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
