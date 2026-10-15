"""Prepare ephemeral CI signing assets. Never log credential values."""
import base64
import os
from pathlib import Path
import plistlib
import secrets
import shlex
import shutil
import subprocess
import sys

task = sys.argv[1]
root = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'zuporta-signing'

def require(name):
    value = os.environ.get(name, '')
    if not value:
        raise SystemExit(f'Configure {name} in the mobile-signing environment.')
    return value

def write_secret(name, value):
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    path = root / name
    path.write_bytes(value)
    path.chmod(0o600)
    return path

def decode(name, filename):
    try:
        data = base64.b64decode(require(name), validate=True)
    except ValueError:
        raise SystemExit(f'{name} must contain valid base64.') from None
    if not data:
        raise SystemExit(f'{name} is empty.')
    return write_secret(filename, data)

def run(command):
    result = subprocess.run(command, capture_output=True)
    if result.returncode:
        raise SystemExit(f'Signing command failed: {command[0]} {command[1]}. Check the configured certificate/profile/password.')
    return result.stdout

def publish(name, value):
    if '\n' in str(value) or '\r' in str(value):
        raise SystemExit('Invalid signing setting.')
    with open(require('GITHUB_ENV'), 'a') as output:
        output.write(f'{name}={value}\n')

if task == 'clean':
    keychain = root / 'signing.keychain-db'
    if keychain.exists():
        subprocess.run(['security', 'delete-keychain', str(keychain)], capture_output=True)
    installed = root / 'installed-profile.txt'
    if installed.exists():
        Path(installed.read_text()).unlink(missing_ok=True)
    shutil.rmtree(root, ignore_errors=True)
elif task == 'android':
    publish('ANDROID_KEYSTORE_PATH', decode('ANDROID_KEYSTORE_BASE64', 'upload.jks'))
elif task == 'ios':
    team = require('APPLE_TEAM_ID')
    certificate = decode('IOS_DISTRIBUTION_P12_BASE64', 'distribution.p12')
    profile = decode('IOS_PROVISION_PROFILE_BASE64', 'profile.mobileprovision')
    profile_data = plistlib.loads(run(['security', 'cms', '-D', '-i', str(profile)]))
    entitlement = profile_data.get('Entitlements', {})
    if team not in profile_data.get('TeamIdentifier', []) or entitlement.get('application-identifier') != f'{team}.com.zuporta.plus':
        raise SystemExit('The provisioning profile must belong to this Team ID and com.zuporta.plus.')
    if entitlement.get('get-task-allow') or profile_data.get('ProvisionedDevices') or profile_data.get('ProvisionsAllDevices'):
        raise SystemExit('Use an App Store distribution profile, not a development/ad hoc/enterprise profile.')
    from datetime import datetime, timezone
    if profile_data['ExpirationDate'].replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise SystemExit('The provisioning profile has expired.')
    keychain = root / 'signing.keychain-db'
    password = secrets.token_urlsafe(32)
    run(['security', 'create-keychain', '-p', password, str(keychain)])
    run(['security', 'set-keychain-settings', '-lut', '3600', str(keychain)])
    run(['security', 'unlock-keychain', '-p', password, str(keychain)])
    run(['security', 'import', str(certificate), '-k', str(keychain), '-P', require('IOS_DISTRIBUTION_P12_PASSWORD'), '-T', '/usr/bin/codesign'])
    run(['security', 'set-key-partition-list', '-S', 'apple-tool:,apple:', '-s', '-k', password, str(keychain)])
    existing = shlex.split(run(['security', 'list-keychains', '-d', 'user']).decode())
    run(['security', 'list-keychains', '-d', 'user', '-s', str(keychain), *existing])
    destination = Path.home() / 'Library/MobileDevice/Provisioning Profiles' / f'{profile_data["UUID"]}.mobileprovision'
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise SystemExit('A profile with this UUID is already installed; refusing to overwrite it.')
    shutil.copyfile(profile, destination)
    write_secret('installed-profile.txt', str(destination).encode())
    export = {'method': 'app-store-connect', 'teamID': team, 'signingStyle': 'manual',
        'signingCertificate': 'Apple Distribution', 'provisioningProfiles': {'com.zuporta.plus': profile_data['UUID']},
        'manageAppVersionAndBuildNumber': False, 'stripSwiftSymbols': True, 'uploadSymbols': True}
    write_secret('ExportOptions.plist', plistlib.dumps(export))
    publish('IOS_PROFILE_UUID', profile_data['UUID'])
    publish('IOS_SIGNING_KEYCHAIN', keychain)
    publish('IOS_EXPORT_OPTIONS', root / 'ExportOptions.plist')
else:
    raise SystemExit('Expected android, ios or clean.')
