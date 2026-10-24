#!/usr/bin/env python3
"""Inspect public resource schemas and GitHub metadata, without credentials.

Uses bounded GET requests and normal TLS via curl. Never runs repository code,
submits government forms, creates accounts, or retains individual data rows.
This is a research audit, not a production connector or uptime test.
"""
import base64
import concurrent.futures
import csv
import datetime
import hashlib
import io
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent
REPOS = [
    'CityOfBoston/OpenContext', 'OETBoston/Coastmix',
    'transitmatters/t-performance-dash', 'AccessMap/accessmap',
    'TaskarCenterAtUW/AccessMapBeyondTheCurb', 'ProjectSidewalk/SidewalkWebpage',
    'mysociety/fixmystreet', 'codeforamerica/ohana-api',
    'openreferral/specification', 'openreferral/api-specification',
    'opentripplanner/OpenTripPlanner', 'jhpyle/docassemble',
    'streetmix/streetmix', 'NaturalCapitalProject/invest',
    'maplibre/maplibre-gl-js', 'cambridgegis/cambridgegis_data',
    'natcap/invest', 'OETBoston/blue', 'OETBoston/boston-parking-pwa',
    'OETBoston/curb-atlas', 'OETBoston/cds_translator', 'OETBoston/BidBot',
]
RESOURCES = [
    ('bluebikes-discovery', 'https://gbfs.bluebikes.com/gbfs/gbfs.json'),
    ('bluebikes-station-csv', 'https://assets.ctfassets.net/p6ae3zqfb1e3/3BswRZgQMp0f8XWBLY6T19/60da57a4630102788a127902bfda9888/-External-_Bluebikes_Station_List__updated_08.21.26_.csv'),
    ('cambridge-ramps-files', 'https://api.github.com/repos/cambridgegis/cambridgegis_data/contents/DPW/Pedestrian_Ramps'),
    ('boston-cooling', 'https://gisportal.boston.gov/arcgis/rest/services/StoryMaps/CoolingCenters/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&resultRecordCount=3&f=geojson'),
    ('mbta-alerts', 'https://api-v3.mbta.com/alerts?page%5Blimit%5D=3'),
    ('mbta-facilities', 'https://api-v3.mbta.com/facilities?page%5Blimit%5D=3'),
    ('mbta-live-facilities', 'https://api-v3.mbta.com/live_facilities?page%5Blimit%5D=3'),
    ('mbta-stops', 'https://api-v3.mbta.com/stops?filter%5Broute%5D=Red&page%5Blimit%5D=3'),
    ('nws-boston-point', 'https://api.weather.gov/points/42.3601,-71.0589'),
    ('nws-ma-alerts', 'https://api.weather.gov/alerts/active?area=MA'),
    ('noaa-boston-tide', 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=HackachusettsResearch&begin_date=20261024&end_date=20261024&datum=MLLW&station=8443970&time_zone=gmt&units=metric&interval=h&format=json'),
    ('census-acs-2024-suffolk', 'https://api.census.gov/data/2024/acs/acs5?get=NAME,B01003_001E&for=tract:*&in=state:25%20county:025'),
    ('openalex-works', 'https://api.openalex.org/works?filter=publication_year:2026&search=Boston%20urban%20heat&per_page=3&select=id,doi,display_name,publication_date,authorships,open_access'),
    ('onet-essential-skills', 'https://www.onetcenter.org/dl_files/database/db_31_0_csv/essential_skills.csv'),
    ('oet-public-repos', 'https://api.github.com/orgs/OETBoston/repos?per_page=100'),
    ('cambridge-ramp-geojson', 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/DPW/Pedestrian_Ramps/DPW_PedestrianRamps.geojson'),
    ('massgis-ej-geometry', 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=MUNICIPALITY%3D%27BOSTON%27&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=3&f=geojson'),
    ('massgis-ej-boston-corrected', 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=MUNICIPALITY%3D%27Boston%27&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=3&f=geojson'),
    ('mbta-live-harvard', 'https://api-v3.mbta.com/live_facilities?filter%5Bstop%5D=place-harsq'),
    ('mbta-elevator-alerts', 'https://api-v3.mbta.com/alerts?filter%5Beffect%5D=ELEVATOR_CLOSURE&page%5Blimit%5D=3'),
    ('mbta-facility-922-alerts', 'https://api-v3.mbta.com/alerts?filter%5Bfacility%5D=922&page%5Blimit%5D=3'),
    ('boston-permits-schema', 'https://data.boston.gov/api/3/action/datastore_search?resource_id=6ddcd912-32a0-43df-9908-63574f8c7e77&limit=0'),
    ('boston-violations-schema', 'https://data.boston.gov/api/3/action/datastore_search?resource_id=800a2663-1d6a-46e7-9356-bedb70f5332c&limit=0'),
]
LICENSE_REPOS = ['OETBoston/Coastmix', 'mysociety/fixmystreet',
                 'openreferral/specification', 'opentripplanner/OpenTripPlanner',
                 'streetmix/streetmix', 'maplibre/maplibre-gl-js']


def get(url):
    with tempfile.NamedTemporaryFile() as output:
        p = subprocess.run([
            'curl', '--silent', '--show-error', '--location', '--globoff',
            '--connect-timeout', '8', '--max-time', '30', '--max-redirs', '4',
            '--max-filesize', '15000000', '--user-agent', 'Hackachusetts-public-research/1.0',
            '--output', output.name, '--write-out', '%{http_code}\t%{url_effective}', url,
        ], text=True, capture_output=True)
        body = pathlib.Path(output.name).read_bytes()
    code, _, final = p.stdout.partition('\t')
    result = {'url': url, 'http_status': code, 'final_url': final,
              'curl_exit_code': p.returncode, 'bytes': len(body),
              'sha256': hashlib.sha256(body).hexdigest(),
              'error': p.stderr.strip()[:400] or None}
    try:
        parsed = json.loads(body)
        result['format'] = 'json'
    except (ValueError, UnicodeDecodeError):
        parsed = None
    return result, parsed, body


def repo(name):
    result, data, _ = get('https://api.github.com/repos/' + name)
    result['requested_repo'] = name
    if isinstance(data, dict) and data.get('full_name'):
        result.update({k: data.get(k) for k in [
            'full_name', 'html_url', 'description', 'default_branch',
            'archived', 'disabled', 'pushed_at', 'language', 'size',
        ]})
        result['license'] = data.get('license')
    elif isinstance(data, dict):
        result['api_message'] = data.get('message')
    return result


def resource(item):
    name, url = item
    result, data, body = get(url)
    result['id'] = name
    if isinstance(data, dict):
        result['top_level_fields'] = sorted(data)
        if 'error' in data or 'errors' in data:
            result['api_error'] = data.get('error', data.get('errors'))
        if 'last_updated' in data:
            result['feed_last_updated'] = data['last_updated']
            result['feed_ttl'] = data.get('ttl')
        for key in ['features', 'data', 'results', 'predictions']:
            rows = data.get(key)
            if isinstance(rows, list):
                result['returned_rows'] = len(rows)
                if rows and isinstance(rows[0], dict):
                    result['row_fields'] = sorted(rows[0])
                    for sub in ['attributes', 'properties', 'relationships']:
                        if isinstance(rows[0].get(sub), dict):
                            result[sub + '_fields'] = sorted(rows[0][sub])
        if isinstance(data.get('properties'), dict):
            result['top_level_properties_fields'] = sorted(data['properties'])
        if isinstance(data.get('result'), dict):
            result['success'] = data.get('success')
            result['columns'] = [f.get('id') for f in data['result'].get('fields', [])]
        if name == 'cambridge-ramp-geojson':
            points = [f['geometry']['coordinates'] for f in data.get('features', [])
                      if f.get('geometry', {}).get('type') == 'Point']
            if points:
                result['point_coordinate_bounds'] = [min(p[0] for p in points), min(p[1] for p in points),
                                                     max(p[0] for p in points), max(p[1] for p in points)]
        if name == 'bluebikes-discovery':
            feeds = data.get('data', {}).get('en', {}).get('feeds', [])
            result['discovered_feeds'] = feeds
        if name.startswith('bluebikes-') and isinstance(data.get('data'), dict):
            stations = data['data'].get('stations')
            if isinstance(stations, list):
                result['returned_rows'] = len(stations)
                result['row_fields'] = sorted(stations[0]) if stations else []
    elif isinstance(data, list):
        result['returned_rows'] = len(data)
        if data and isinstance(data[0], list):
            result['columns'] = data[0]
            result['returned_rows'] -= 1
        elif data and isinstance(data[0], dict):
            result['row_fields'] = sorted(data[0])
        if name.endswith('-files'):
            result['files'] = [{k: row.get(k) for k in ['name', 'size', 'download_url']} for row in data]
        if name == 'oet-public-repos':
            result['repositories'] = [{'name': row['name'], 'html_url': row['html_url'], 'description': row.get('description')} for row in data]
    elif url.endswith('.csv') and result['http_status'] == '200':
        rows = list(csv.reader(io.StringIO(body.decode('utf-8-sig', errors='replace'))))
        result['format'] = 'csv'
        header = 1 if name == 'bluebikes-station-csv' and rows and rows[0][0] == 'Last Updated:' else 0
        result['preamble_rows'] = header
        result['columns'] = rows[header] if len(rows) > header else []
        result['returned_rows'] = sum(bool(row and any(value.strip() for value in row)) for row in rows[header + 1:])
    return result


def license_file(name):
    result, data, _ = get('https://api.github.com/repos/' + name + '/license')
    if isinstance(data, dict) and data.get('content'):
        content = base64.b64decode(data['content']).decode('utf-8', errors='replace')
        return {'repository': name, 'url': data.get('html_url'),
                'sha': data.get('sha'), 'opening_lines': content[:650]}
    return {'repository': name, 'http_status': result['http_status'],
            'error': result.get('error') or 'No license content returned'}


def main():
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        repositories = list(pool.map(repo, REPOS))
        resources = list(pool.map(resource, RESOURCES))
        licenses = list(pool.map(license_file, LICENSE_REPOS))
    discovery = next(r for r in resources if r['id'] == 'bluebikes-discovery')
    for feed in discovery.get('discovered_feeds', []):
        if feed['name'] in ['station_information', 'station_status']:
            resources.append(resource(('bluebikes-' + feed['name'], feed['url'])))
    result = {'checked_at_utc': started,
              'scope': 'Public GET requests; schemas/metadata only. No application integration, code execution, or current operational accuracy established.',
              'repositories': repositories, 'resources': resources,
              'license_file_checks': licenses}
    ROOT.joinpath('public_resource_audit.json').write_text(json.dumps(result, indent=2) + '\n')
    write_inventory(result)
    for row in repositories:
        print('REPO', row['requested_repo'], row['http_status'],
              (row.get('license') or {}).get('spdx_id'), 'archived=' + str(row.get('archived')))
    for row in resources:
        print('DATA', row['id'], row['http_status'], 'rows=' + str(row.get('returned_rows')), row.get('api_error', ''))


def write_inventory(result):
    """A catalog CSV, not a mirror of the underlying records."""
    with ROOT.joinpath('public_resource_inventory.csv').open('w', newline='') as f:
        writer = csv.DictWriter(f, lineterminator='\n', fieldnames=['kind', 'id', 'url', 'http_status', 'format',
                                              'returned_rows', 'columns', 'license_metadata', 'archived'])
        writer.writeheader()
        for row in result['resources']:
            fields = row.get('columns') or row.get('attributes_fields') or row.get('properties_fields') or row.get('row_fields') or []
            writer.writerow({'kind': 'data_probe', 'id': row['id'], 'url': row['url'],
                             'http_status': row['http_status'], 'format': row.get('format', ''),
                             'returned_rows': row.get('returned_rows', ''), 'columns': ' | '.join(fields)})
        for row in result['repositories']:
            writer.writerow({'kind': 'repository', 'id': row['requested_repo'],
                             'url': row.get('html_url', row['url']), 'http_status': row['http_status'],
                             'license_metadata': (row.get('license') or {}).get('spdx_id', 'unresolved'),
                             'archived': row.get('archived', '')})


if __name__ == '__main__':
    main()
