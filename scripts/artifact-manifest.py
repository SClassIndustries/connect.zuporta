"""Inventory only distributable artifacts; never include signing material."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('name')
parser.add_argument('directory', type=Path)
parser.add_argument('--require-signed', action='store_true')
args = parser.parse_args()
records = []
for path in sorted(args.directory.rglob('*')):
    if path.suffix not in ('.apk', '.aab', '.ipa') or not path.is_file():
        continue
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        signed = any(name.startswith('META-INF/') and name.endswith(('.RSA', '.DSA', '.EC')) for name in names)
        if path.suffix == '.ipa':
            signed = any('/_CodeSignature/CodeResources' in name for name in names)
    if args.require_signed and not signed:
        raise SystemExit(f'{path.name} lacks a distribution signature.')
    if args.require_signed and path.suffix == '.aab':
        check = subprocess.run(['jarsigner', '-verify', str(path)], capture_output=True, text=True)
        if check.returncode or 'jar verified.' not in check.stdout:
            raise SystemExit('The Android bundle signature did not verify.')
    records.append({'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                    'bytes': path.stat().st_size, 'signature_present': signed})
if not records:
    raise SystemExit('No distributable artifacts were found.')
destination = Path('build') / f'{args.name}.json'
destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps({'commit': os.environ.get('GITHUB_SHA') or subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
    'build_number': os.environ.get('GITHUB_RUN_NUMBER'), 'artifacts': records}, indent=2) + '\n')
print(f'Wrote {len(records)} artifact checksums to {destination}')
