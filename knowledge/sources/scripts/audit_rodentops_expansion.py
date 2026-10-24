#!/usr/bin/env python3
"""Bounded public metadata/schema audit; does not save individual record values.

Run with python3 -B. Imports only our existing local GET helper. No downloaded
code is executed and no credentials, submissions, or third-party writes occur.
"""
import concurrent.futures
import csv
import datetime
import io
import json
import pathlib
import urllib.parse

from audit_public_resources import get

OUT = pathlib.Path(__file__).resolve().parents[1] / 'artifacts'
PACKAGES = [
    'food-establishment-inspections', 'active-food-establishment-licenses',
    'rentsmart', 'public-works-violations', 'trash-schedules-by-address',
    'big-belly-locations', 'rainfall-data',
    'dnd-managed-city-property-inventory-all', 'park-features',
    'street-sweeping-schedules',
]


def package(slug):
    meta, data, _ = get('https://data.boston.gov/api/3/action/package_show?id=' + slug)
    meta['id'] = slug
    if not isinstance(data, dict) or not data.get('success'):
        meta['api_error'] = data
        return meta
    p = data['result']
    meta.update({k: p.get(k) for k in ['title', 'metadata_modified', 'license_id', 'license_url']})
    meta['resources'] = []
    for raw in p.get('resources', []):
        r = {k: raw.get(k) for k in ['id', 'name', 'format', 'url', 'last_modified', 'datastore_active']}
        if raw.get('datastore_active'):
            url = 'https://data.boston.gov/api/3/action/datastore_search?' + urllib.parse.urlencode({'resource_id': raw['id'], 'limit': 3})
            check, sample, _ = get(url)
            r['probe'] = check
            if isinstance(sample, dict) and sample.get('success'):
                result = sample['result']
                r['total_rows'] = result.get('total')
                r['fields'] = result.get('fields')
                rows = result.get('records', [])
                r['sample_size'] = len(rows)
                r['sample_nonnull_counts'] = {
                    f['id']: sum(row.get(f['id']) not in [None, ''] for row in rows)
                    for f in result.get('fields', [])
                }
            else:
                r['probe']['api_error'] = sample
        meta['resources'].append(r)
    return meta


def socrata(domain, ident):
    meta, data, _ = get(f'https://{domain}/api/views/{ident}.json')
    meta['id'] = ident
    if isinstance(data, dict):
        meta.update({k: data.get(k) for k in ['name', 'rowsUpdatedAt', 'licenseId', 'attribution', 'attributionLink']})
        meta['columns'] = [{k: c.get(k) for k in ['fieldName', 'name', 'dataTypeName', 'description']} for c in data.get('columns', []) if not c.get('fieldName', '').startswith(':')]
    for label, query in [('sample', {'$limit': 3}), ('count', {'$select': 'count(*)'})]:
        check, rows, _ = get(f'https://{domain}/resource/{ident}.json?' + urllib.parse.urlencode(query))
        if isinstance(rows, list):
            check['returned_rows'] = len(rows)
            if label == 'count':
                check['aggregate'] = rows
            elif rows:
                check['returned_fields'] = sorted(set().union(*(r.keys() for r in rows)))
        else:
            check['api_error'] = rows
        meta[label] = check
    return meta


def noaa():
    url = 'https://www.ncei.noaa.gov/access/services/data/v1?' + urllib.parse.urlencode({
        'dataset': 'daily-summaries', 'stations': 'USW00014739',
        'startDate': '2026-10-01', 'endDate': '2026-10-03',
        'format': 'csv', 'units': 'metric', 'includeAttributes': 'true'})
    meta, _, body = get(url)
    if meta['http_status'] == '200':
        reader = csv.DictReader(io.StringIO(body.decode('utf-8-sig')))
        rows = list(reader)
        meta['fields'] = reader.fieldnames
        meta['returned_rows'] = len(rows)
        meta['dates'] = [r.get('DATE') for r in rows]
        meta['selected_nonempty_counts'] = {
            key: sum(r.get(key) not in [None, ''] for r in rows)
            for key in ['PRCP', 'TMAX', 'TMIN', 'AWND']
        }
    return meta


def main():
    result = {'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'scope': 'Metadata, total row counts, three-row schema probes and aggregate-only summaries; not a full-data quality audit or validated join.'}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        result['boston_packages'] = list(pool.map(package, PACKAGES))
    result['nyc_inspections'] = socrata('data.cityofnewyork.us', 'p937-wjvj')
    result['noaa_logan'] = noaa()
    OUT.mkdir(exist_ok=True)
    (OUT / 'rodentops_expansion_audit.json').write_text(json.dumps(result, indent=2) + '\n')
    with (OUT / 'rodentops_expansion_inventory.csv').open('w', newline='') as f:
        writer = csv.DictWriter(f, lineterminator='\n', fieldnames=['package', 'resource_id', 'name', 'url', 'format', 'last_modified', 'license_id', 'total_rows', 'fields'])
        writer.writeheader()
        for package_result in result['boston_packages']:
            for r in package_result.get('resources', []):
                writer.writerow({'package': package_result['id'], 'resource_id': r['id'], 'name': r['name'], 'url': r['url'], 'format': r['format'], 'last_modified': r['last_modified'], 'license_id': package_result.get('license_id'), 'total_rows': r.get('total_rows'), 'fields': ' | '.join(c['id'] for c in r.get('fields', []))})
    print(json.dumps({'packages': len(result['boston_packages']), 'resource_entries': sum(len(p.get('resources', [])) for p in result['boston_packages']), 'output': str(OUT / 'rodentops_expansion_audit.json')}))


if __name__ == '__main__':
    main()
