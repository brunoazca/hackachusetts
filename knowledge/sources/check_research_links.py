#!/usr/bin/env python3
"""Bounded HEAD checks of public URLs in knowledge/*.md; no credentials or bodies.

Usage: python3 knowledge/sources/check_research_links.py
Reachability is distinct from content verification. Some sites reject HEAD.
"""
import collections
import concurrent.futures
import datetime
import json
import pathlib
import re
import subprocess
import urllib.parse

root = pathlib.Path(__file__).resolve().parents[1]
references = collections.defaultdict(set)
for path in root.glob('*.md'):
    for url in re.findall(r'https?://[^\s<>\]"`]+', path.read_text()):
        # Our Markdown URLs use percent encoding for parentheses within URLs.
        url = url.split(')')[0].rstrip('.,;')
        url = urllib.parse.urldefrag(url)[0]
        references[url].add(path.name)

def check(url):
    process = subprocess.run([
        'curl', '--silent', '--show-error', '--head', '--location', '--globoff',
        '--connect-timeout', '8', '--max-time', '18', '--max-redirs', '5',
        '--output', '/dev/null', '--write-out', '%{http_code}\t%{url_effective}', url,
    ], capture_output=True, text=True)
    parts = process.stdout.split('\t', 1)
    code = parts[0] if parts else '000'
    return {
        'url': url, 'documents': sorted(references[url]), 'method': 'HEAD',
        'http_status': code, 'final_url': parts[1] if len(parts) > 1 else None,
        'curl_exit_code': process.returncode,
        'error': process.stderr.strip()[:400] or None,
        'interpretation': 'reachable; content not validated by this check'
        if process.returncode == 0 and code.startswith('2')
        else 'requires review; HEAD failure does not prove source is unavailable',
    }

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(check, sorted(references)))
output = {
    'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Unique public URLs in knowledge/*.md, excluding fragments. '
             'HTTP reachability only; not link content or API validation.',
    'status_counts': dict(collections.Counter(r['http_status'] for r in results)),
    'results': results,
}
target = pathlib.Path(__file__).with_name('link_audit.json')
target.write_text(json.dumps(output, indent=2) + '\n')
print(json.dumps({'checked': len(results), 'status_counts': output['status_counts']}))
