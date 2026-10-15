"""Install the Linux SDK tools used by this project, verifying Google's published checksum."""
from pathlib import Path
import hashlib
import os
import shutil
import subprocess
import tempfile
from urllib.parse import urlparse
from urllib.request import urlopen
import zipfile

sdk = Path(os.environ.get('ANDROID_HOME', '/workspace/android-sdk')).resolve()
tools = sdk / 'cmdline-tools/23.0'
archive_name = 'commandlinetools-linux-16111833_latest.zip'
# From https://dl.google.com/android/repository/repository2-3.xml (retrieved 2026-10-15).
expected_sha1 = 'e025545c62a8e64c7559119566a569fb1dec5f60'
if not (tools / 'bin/android').is_file():
    with tempfile.TemporaryDirectory(prefix='zuporta-android-') as temp:
        archive = Path(temp) / archive_name
        with urlopen('https://dl.google.com/android/repository/' + archive_name, timeout=60) as source, archive.open('wb') as target:
            shutil.copyfileobj(source, target)
        with archive.open('rb') as downloaded:
            digest = hashlib.file_digest(downloaded, 'sha1').hexdigest()
        if digest != expected_sha1:
            raise SystemExit('Android tools checksum mismatch; refusing installation.')
        with zipfile.ZipFile(archive) as package:
            for item in package.infolist():
                destination = (Path(temp) / item.filename).resolve()
                if not destination.is_relative_to(Path(temp).resolve()):
                    raise SystemExit('Unexpected path in SDK archive.')
            package.extractall(temp)
        tools.parent.mkdir(parents=True, exist_ok=True)
        if tools.exists():
            raise SystemExit('An incomplete SDK tools directory exists; inspect it before replacing anything.')
        shutil.move(str(Path(temp) / 'cmdline-tools'), tools)
        for binary in (tools / 'bin').iterdir():
            binary.chmod(binary.stat().st_mode | 0o111)
    print('Installed checksum-verified Android command-line tools 23.0.')

runtime = os.environ.copy()
user_root = Path(runtime.get('ANDROID_USER_HOME', '/workspace/.android-user'))
user_root.mkdir(parents=True, exist_ok=True)
runtime['ANDROID_USER_HOME'] = str(user_root)
runtime['ANDROID_HOME'] = str(sdk)
java_options = [f'-Djava.util.prefs.userRoot={user_root / "prefs"}']
proxy = urlparse(runtime.get('HTTPS_PROXY', ''))
if proxy.hostname:
    if proxy.username or proxy.password:
        raise SystemExit('Use supported Java proxy authentication; credentials are never copied into setup files.')
    for protocol in ('https', 'http'):
        java_options += [f'-D{protocol}.proxyHost={proxy.hostname}', f'-D{protocol}.proxyPort={proxy.port or 80}']
runtime['JAVA_TOOL_OPTIONS'] = ' '.join(filter(None, [runtime.get('JAVA_TOOL_OPTIONS', ''), *java_options]))
# The official tools bootstrap Android CLI and retain its normal verification.
# --no-metrics avoids collecting tool-usage metrics during environment setup.
subprocess.run([
    str(tools / 'bin/android'), '--no-metrics', '--sdk=' + str(sdk), 'sdk', 'install',
    'platform-tools', 'platforms/android-36', 'build-tools/35.0.0',
], env=runtime, check=True)
for required in ('platform-tools/adb', 'platforms/android-36/android.jar', 'build-tools/35.0.0/aapt2'):
    if not (sdk / required).is_file():
        raise SystemExit('SDK installation incomplete: ' + required)
print('Android SDK 36, build tools 35.0.0 and platform tools are installed.')
