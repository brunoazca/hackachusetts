#!/usr/bin/env python3
"""Archive the Civic portal's catalog and bounded public source responses.

Python standard library + curl. Downloaded JavaScript is parsed as data, never run.
Run from the repository root; see --help. Raw HTML stays in a temporary cache.
"""
import argparse
import collections
import concurrent.futures
import csv
import datetime
import hashlib
import html.parser
import io
import json
import pathlib
import re
import subprocess
import tempfile
import urllib.parse
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'data/civic/inventory'
CACHE = pathlib.Path(tempfile.gettempdir()) / 'hackachusetts-civic-inventory'
BASE = 'https://hackachusetts2026.vercel.app'
SMALL = 5 * 1024 * 1024
SAMPLE = 100


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


class Literal:
    """Restricted JS literal parser. Reject expressions, calls and executable code."""
    def __init__(self, text, pos=0):
        self.text, self.pos = text, pos

    def ws(self):
        while self.pos < len(self.text) and self.text[self.pos].isspace():
            self.pos += 1

    def value(self):
        self.ws()
        ch = self.text[self.pos]
        if ch in '\"\'':
            return self.string()
        if ch in '{[':
            self.pos += 1
            obj = {} if ch == '{' else []
            end = '}' if ch == '{' else ']'
            while True:
                self.ws()
                if self.text[self.pos] == end:
                    self.pos += 1
                    return obj
                if ch == '{':
                    if self.text[self.pos] in '\"\'':
                        key = self.string()
                    else:
                        m = re.match(r'[\w$-]+', self.text[self.pos:])
                        if not m:
                            raise ValueError('Not a literal key')
                        key = m[0]
                        self.pos += len(key)
                    self.ws()
                    if self.text[self.pos] != ':':
                        raise ValueError('Expected colon')
                    self.pos += 1
                    obj[key] = self.value()
                else:
                    obj.append(self.value())
                self.ws()
                if self.text[self.pos] == ',':
                    self.pos += 1
                elif self.text[self.pos] != end:
                    raise ValueError('Not a literal collection')
        for token, value in [('true', True), ('false', False), ('null', None), ('!0', True), ('!1', False)]:
            if self.text.startswith(token, self.pos):
                self.pos += len(token)
                return value
        m = re.match(r'-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?', self.text[self.pos:])
        if not m:
            raise ValueError('Unsupported expression: ' + self.text[self.pos:self.pos+60])
        self.pos += len(m[0])
        return json.loads(m[0])

    def string(self):
        quote = self.text[self.pos]
        self.pos += 1
        out = []
        while self.pos < len(self.text):
            ch = self.text[self.pos]
            self.pos += 1
            if ch == quote:
                return ''.join(out)
            if ch == '\\':
                ch = self.text[self.pos]
                self.pos += 1
                if ch in ('u', 'x'):
                    n = 4 if ch == 'u' else 2
                    ch = chr(int(self.text[self.pos:self.pos+n], 16))
                    self.pos += n
                else:
                    ch = {'n':'\n', 'r':'\r', 't':'\t', 'b':'\b', 'f':'\f'}.get(ch, ch)
            out.append(ch)
        raise ValueError('Unterminated string')


def get(url, refresh=False):
    """Bounded public GET; no credentials, cookie jar, or TLS bypass."""
    CACHE.mkdir(parents=True, exist_ok=True)
    key = digest(url.encode())
    meta, body, headers = [CACHE / (key + ext) for ext in ('.json', '.body', '.headers')]
    if not refresh and meta.exists() and body.exists():
        return json.loads(meta.read_text()), body.read_bytes()
    p = subprocess.run(['curl', '--silent', '--show-error', '--location', '--globoff',
        '--proto', '=https', '--proto-redir', '=https', '--connect-timeout', '10',
        '--max-time', '40', '--max-redirs', '5', '--max-filesize', str(SMALL),
        '--user-agent', 'Hackachusetts-Civic-Inventory/1.0', '-D', str(headers),
        '-o', str(body), '-w', '%{http_code}\t%{url_effective}\t%{content_type}', url.replace(' ', '%20')],
        capture_output=True, text=True)
    parts = p.stdout.split('\t')
    raw = body.read_bytes() if body.exists() else b''
    header_text = headers.read_text(errors='replace') if headers.exists() else ''
    blocks = re.split(r'\r?\n\r?\n', header_text.strip())
    header = dict((k.lower(), v.strip()) for k,v in re.findall(r'^([^:\n]+):\s*(.*)$', blocks[-1], re.M)) if blocks else {}
    result = {'url':url, 'checked_at_utc':now(), 'http_status':int(parts[0] or 0) if parts else 0,
        'final_url':parts[1] if len(parts)>1 else url,
        'content_type':parts[2] if len(parts)>2 else '', 'curl_exit_code':p.returncode,
        'response_bytes':len(raw), 'content_length':header.get('content-length'),
        'etag':header.get('etag'), 'last_modified':header.get('last-modified'),
        'response_sha256':digest(raw) if raw else None, 'error':p.stderr.strip() or None}
    if not body.exists():
        body.write_bytes(b'')
    save_json(meta, result)
    return result, raw


class Page(html.parser.HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base, self.links, self.parts, self.title = base, [], [], []
        self.skip, self.in_title, self.anchor = 0, False, None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style', 'noscript'):
            self.skip += 1
        if tag == 'title':
            self.in_title = True
        if tag == 'a' and attrs.get('href'):
            url = urllib.parse.urljoin(self.base, attrs['href'])
            # Google Docs export wraps external hyperlinks in a redirect.
            if urllib.parse.urlparse(url).netloc in ('www.google.com', 'google.com') and '/url?' in url:
                url = urllib.parse.parse_qs(urllib.parse.urlparse(url).query).get('q', [url])[0]
            if url.startswith('https://'):
                self.anchor = {'url': url.split('#')[0], 'label': ''}
        if tag == 'iframe' and attrs.get('src', '').startswith(('https://', '//')):
            self.links.append({'url': urllib.parse.urljoin(self.base, attrs['src']), 'label':'Embedded dashboard'})

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'):
            self.skip = max(0, self.skip-1)
        if tag == 'title':
            self.in_title = False
        if tag == 'a' and self.anchor:
            self.anchor['label'] = ' '.join(self.anchor['label'].split())[:300]
            self.links.append(self.anchor)
            self.anchor = None

    def handle_data(self, text):
        if self.in_title:
            self.title.append(text)
        if not self.skip:
            self.parts.append(text)
            if self.anchor:
                self.anchor['label'] += text


def parse_page(body, url):
    page = Page(url)
    page.feed(body.decode('utf-8', errors='replace'))
    page.links = list({x['url']: x for x in page.links}.values())
    return page


def extract_portal(script):
    start = script.index('{slug:"civic"')
    civic = Literal(script, start).value()
    all_kits = json.loads(Literal(script, script.index("JSON.parse('{\"boston-311\"") + len('JSON.parse(')).value())
    track = Literal(script, script.index('{civic:{bytes:')).value()['civic']
    challenges = Literal(script, script.index('{v1:{bytes:')).value()
    civic['track_kit'] = track
    civic['challenge_kits'] = {k:v for k,v in challenges.items() if k in {c['id'] for c in civic['challenges']}}
    civic['dataset_kits'] = {k:all_kits[k] for k in track['datasets']}
    civic['source_url'] = BASE + '/#/civic'
    civic['bundle_sha256'] = digest(script.encode())
    civic['retrieved_at_utc'] = now()
    return civic


def profile_csv(path):
    with path.open(newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        missing = collections.Counter()
        rows, sample = 0, []
        for row in reader:
            rows += 1
            missing.update(k for k,v in row.items() if not (v or '').strip())
            if len(sample) < SAMPLE:
                sample.append(row)
    return {'rows':rows, 'columns':columns, 'blank_cells':dict(missing),
        'bytes':path.stat().st_size, 'sha256':digest(path.read_bytes()), 'sample':sample}


def request_entry(entry):
    meta, body = get(entry['url'])
    result = {**entry, **meta}
    result['access'] = 'fetched' if 200 <= meta['http_status'] < 300 and not meta['curl_exit_code'] else 'unavailable'
    if meta['curl_exit_code'] == 63 or re.search(r'(file size exceeded|maximum allowed file size)', meta.get('error') or '', re.I):
        result['access'] = 'large_remote_file'
        result['retention'] = 'metadata_and_existing_starter_preview'
    if result['access'] != 'fetched':
        return result
    suffix = pathlib.PurePosixPath(urllib.parse.urlparse(meta['final_url']).path).suffix.lower()
    try:
        data = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        data = None
    target = None
    if data is not None:
        result['format'] = 'json'
        result['retention'] = 'complete_response_not_necessarily_complete_dataset'
        if isinstance(data, dict):
            result['top_level_keys'] = list(data)
            if data.get('error') or data.get('errors') or data.get('success') is False:
                result['access'] = 'api_error'
                result['api_error'] = data.get('error', data.get('errors'))
            candidates = [data.get('data'), data.get('features'), data.get('results'), data.get('DisasterDeclarationsSummaries')]
            if isinstance(data.get('result'),dict):
                candidates.append(data['result'].get('records'))
                result['reported_total'] = data['result'].get('total')
                result['fields'] = data['result'].get('fields')
            if data.get('exceededTransferLimit'):
                result['truncated_by_api'] = True
        else:
            candidates = [data]
        for rows in candidates:
            if isinstance(rows, list):
                result['returned_rows'] = len(rows)
                if rows and isinstance(rows[0],dict):
                    result['row_fields'] = list(rows[0])
                break
        target = OUT / 'responses' / (entry['id'] + '.json')
    elif 'text/html' in meta['content_type'] or body.lstrip().lower().startswith((b'<!doctype html', b'<html')):
        result['format'] = 'html'
        result['retention'] = 'title_short_excerpt_and_link_inventory'
        page = parse_page(body, meta['final_url'])
        result['page_title'] = ' '.join(' '.join(page.title).split())
        result['excerpt'] = ' '.join(' '.join(page.parts).split()[:25])
        result['outbound_links'] = page.links
        text = ' '.join(page.parts).lower()
        if any(s in text for s in ('access denied', 'request rejected', 'verify you are human', 'enable javascript and cookies to continue')):
            result['access'] = 'blocked_page'
        if len(text.strip()) < 250:
            result['content_note'] = 'JavaScript shell or very little readable HTML; content not independently extracted.'
    elif body.startswith(b'PK'):
        result['format'] = 'zip'
        result['retention'] = 'full_file'
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as z:
                result['members'] = [{'path':x.filename, 'bytes':x.file_size, 'compressed_bytes':x.compress_size} for x in z.infolist()]
                result['csv_members'] = [x['path'] for x in result['members'] if x['path'].endswith('.csv')]
        except zipfile.BadZipFile:
            result['access'] = 'invalid_archive'
        target = OUT / 'downloads' / (entry['id'] + (suffix if suffix in ('.zip','.xlsx','.docx') else '.zip'))
    elif body.startswith(b'%PDF'):
        result['format'], result['retention'] = 'pdf', 'full_file'
        target = OUT / 'downloads' / (entry['id'] + '.pdf')
    elif suffix in ('.csv', '.tsv', '.txt', '.xls', '.xlsx', '.geojson') or 'text/csv' in meta['content_type']:
        result['format'], result['retention'] = suffix.lstrip('.') or 'csv', 'full_file'
        target = OUT / 'downloads' / (entry['id'] + (suffix or '.csv'))
        if suffix in ('.csv', '.tsv'):
            try:
                rows = list(csv.reader(io.StringIO(body.decode('utf-8-sig')), delimiter='\t' if suffix == '.tsv' else ','))
                result['returned_rows'], result['columns'] = max(0,len(rows)-1), rows[0] if rows else []
            except UnicodeDecodeError:
                result['content_note'] = 'Non-UTF-8 text; original retained.'
    else:
        result['format'], result['retention'] = suffix or 'unknown', 'metadata_only'
    if target:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(body)
        result['local_path'] = str(target.relative_to(ROOT))
        result['local_sha256'] = digest(body)
    return result


def fetch_entries(entries, name):
    path = OUT / (name + '.json')
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for r in pool.map(request_entry, entries):
            results.append(r)
            print(r['id'], r['http_status'], r['access'], r.get('returned_rows',''), flush=True)
            save_json(path, results)
    return results


def initial(portal):
    entries = []
    for resource in portal['resources']:
        entries.append({'id':resource['id'], 'url':resource['href'], 'name':resource['name'], 'role':'portal_resource'})
    for key, kit in portal['dataset_kits'].items():
        entries.append({'id':'kit-'+key, 'url':BASE+kit['zip'], 'name':kit.get('title',key), 'role':'dataset_kit'})
    for key,kit in portal['challenge_kits'].items():
        entries.append({'id':'challenge-'+key, 'url':BASE+kit['zip'], 'name':key, 'role':'challenge_kit'})
    entries.append({'id':'track-civic', 'url':BASE+portal['track_kit']['zip'], 'name':'Civic track kit', 'role':'track_kit'})
    return fetch_entries(entries, 'requests')


def socrata_resource(item):
    domain, sid, parent = item['domain'], item['id'], item['parent']
    key = item.get('prefix', 'e2c') + '-' + sid
    base = 'https://' + domain
    requests = []
    def request(suffix, url, role):
        entry = {'id':key+'-'+suffix, 'name':item.get('name', sid),
                 'url':url, 'role':role, 'parent':parent}
        r = request_entry(entry)
        requests.append(r)
        data = None
        if r.get('local_path') and r.get('format') == 'json':
            data = json.loads((ROOT/r['local_path']).read_text())
        return r, data
    metadata_request, metadata = request('metadata', base+'/api/views/'+sid+'.json', 'socrata_schema')
    result = {**item, 'page_url':base+'/d/'+sid, 'requests':requests,
              'retention':'metadata_only', 'access':metadata_request['access']}
    if not isinstance(metadata, dict) or not metadata.get('id'):
        return result
    result.update({'name':metadata.get('name', sid), 'description':metadata.get('description'),
        'display_type':metadata.get('displayType'), 'view_type':metadata.get('viewType'),
        'rows_updated_at':metadata.get('rowsUpdatedAt'), 'license':metadata.get('license'),
        'columns':[{'name':c.get('name'), 'field':c.get('fieldName'), 'type':c.get('dataTypeName'),
                    'description':c.get('description')} for c in metadata.get('columns',[]) if not c.get('fieldName','').startswith(':')]})
    if metadata.get('viewType') != 'tabular' or not result['columns']:
        page_request, _ = request('page', base+'/d/'+sid, 'socrata_story_or_dashboard')
        result['retention'] = 'reference_preview'
        result['content_note'] = 'Story, external link or dashboard: metadata and landing-page preview; no exported table established.'
        return result
    _, count = request('count', base+'/resource/'+sid+'.json?$select=count(*)', 'socrata_count')
    if isinstance(count,list) and count and isinstance(count[0],dict):
        try:
            result['source_rows'] = int(next(iter(count[0].values())))
        except (ValueError,TypeError,StopIteration):
            pass
    sample_request, sample = request('preview', base+'/resource/'+sid+'.json?$limit=100', 'socrata_preview')
    if isinstance(sample,list):
        result['preview_rows'] = len(sample)
        result['retention'] = 'preview'
        result['preview_path'] = sample_request.get('local_path')
        total = result.get('source_rows')
        # Conservative estimate; curl enforces the actual byte cap independently.
        estimated = sample_request['response_bytes'] / max(len(sample),1) * (total or 0)
        if total is not None and (total <= 50000 or estimated <= SMALL):
            full_request, _ = request('full', base+'/api/views/'+sid+'/rows.csv?accessType=DOWNLOAD', 'socrata_full_csv')
            if full_request.get('local_path') and full_request['access'] == 'fetched' and full_request.get('format') == 'csv':
                local = ROOT / full_request['local_path']
                profile = profile_csv(local)
                result['downloaded_rows'] = profile['rows']
                result['data_path'] = full_request['local_path']
                result['retention'] = 'full_dataset' if profile['rows'] == total else 'download_count_mismatch'
                result['data_sha256'] = profile['sha256']
        result['sample_method'] = 'First 100 rows returned without ordering; not random or representative. Null-valued fields may be omitted in JSON.'
    return result


def socrata(items):
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for r in pool.map(socrata_resource, items):
            results.append(r)
            save_json(OUT/'socrata_inventory.json',results)
            print(r['id'],r.get('name'),r['retention'],r.get('source_rows',''),flush=True)
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=pathlib.Path, help='Already downloaded portal bundle (parsed, never executed)')
    parser.add_argument('--initial', action='store_true', help='Fetch all portal cards and kits')
    parser.add_argument('--entries', type=pathlib.Path, help='Fetch an explicit reviewed JSON list of {id,url,name,role}')
    parser.add_argument('--output-name', default='followup_requests')
    parser.add_argument('--socrata', type=pathlib.Path, help='Reviewed list of {domain,id,parent,prefix,name} to inventory')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if args.bundle:
        portal = extract_portal(args.bundle.read_text())
        save_json(OUT / 'portal.json', portal)
        print('Catalog:',len(portal['resources']),'resources;',len(portal['dataset_kits']),'datasets')
    else:
        portal = json.loads((OUT / 'portal.json').read_text())
    if args.initial:
        initial(portal)
    if args.entries:
        fetch_entries(json.loads(args.entries.read_text()), args.output_name)
    if args.socrata:
        socrata(json.loads(args.socrata.read_text()))


if __name__ == '__main__':
    main()
