#!/usr/bin/env python3
"""Inspect an already downloaded Civic ZIP; never execute its included scripts.

Usage: python3 knowledge/sources/audit_civic_kit.py /path/to/civic.zip
Writes civic_dataset_audit.json beside this script. Python standard library only.
"""
import collections
import csv
import datetime
import hashlib
import io
import json
import pathlib
import re
import sys
import zipfile

archive = pathlib.Path(sys.argv[1])
datasets = []
tables = {}
with zipfile.ZipFile(archive) as kit:
    for path in kit.namelist():
        if not path.endswith('/data.csv'):
            continue
        raw = kit.read(path)
        rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
        name = path.split('/')[-2]
        tables[name] = rows
        fields = list(rows[0]) if rows else []
        readme = kit.read(path.rsplit('/', 1)[0] + '/README.md').decode()
        sources = re.findall(r'https?://[^\s]+', readme)
        ranges = {}
        for field in fields:
            if field in {'when', 'time', 'year', 'date', 'updated', 'open_date',
                         'declarationDate', 'issued_date', 'expiration_date', 'status_date'}:
                values = sorted({row[field] for row in rows if row[field]})
                ranges[field] = {
                    'min_lexical': values[0] if values else None,
                    'max_lexical': values[-1] if values else None,
                    'distinct': len(values),
                }
        datasets.append({
            'dataset': name, 'rows': len(rows), 'columns': fields,
            'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
            'source_urls_from_kit_readme': sources,
            'blank_cells': {f: sum(not row[f].strip() for row in rows) for f in fields},
            'date_ranges': ranges,
        })

scorecard_ids = {row['unitid'] for row in tables['scorecard']}
ipeds_ids = {row['unitid'] for row in tables['ipeds']}
neighborhoods = {row['neighborhood'] for row in tables['neighborhoods']}
unmatched = collections.Counter(row['neighborhood'] for row in tables['boston-311']
                                if row['neighborhood'] not in neighborhoods)
result = {
    'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'source': 'https://hackachusetts2026.vercel.app/kits/tracks/civic.zip',
    'archive_sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
    'method': 'CSV parsing, blank-string counts, lexical date ranges, exact string joins. '
              'Not a completeness, source authenticity, numeric-sentinel or live API audit.',
    'datasets': datasets,
    'join_checks': {
        'scorecard_ipeds_unitid': {
            'scorecard_unique': len(scorecard_ids), 'ipeds_unique': len(ipeds_ids),
            'matched_unique': len(scorecard_ids & ipeds_ids),
            'scorecard_only': sorted(scorecard_ids - ipeds_ids),
            'ipeds_only': sorted(ipeds_ids - scorecard_ids),
        },
        '311_neighborhood_exact_name_unmatched_rows': dict(unmatched),
    },
}
target = pathlib.Path(__file__).with_name('civic_dataset_audit.json')
target.write_text(json.dumps(result, indent=2) + '\n')
print(f'Wrote {target.name}: {len(datasets)} datasets, {sum(d["rows"] for d in datasets):,} rows')
