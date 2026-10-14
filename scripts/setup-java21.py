"""Complete this Debian cloud image's Java 21 runtime with its matching signed JDK package."""
from pathlib import Path
import hashlib
import os
import re
import shutil
import subprocess
from urllib.parse import urlparse

jdk = Path('/workspace/zuporta-jdk/usr/lib/jvm/java-21-openjdk-amd64')
if (jdk / 'bin/javac').is_file():
    result = subprocess.run([str(jdk / 'bin/java'), '-XshowSettings:properties', '-version'], capture_output=True, text=True, check=True)
    if f'java.home = {jdk}' not in result.stderr:
        raise SystemExit('Existing JDK reports another java.home; inspect the installation before proceeding.')
    subprocess.run([str(jdk / 'bin/javac'), '-version'], check=True)
    print('Java 21 compiler is available at ' + str(jdk))
    raise SystemExit(0)

java = shutil.which('java')
if not java:
    raise SystemExit('This helper requires the cloud image Java 21 runtime.')
runtime_home = Path(java).resolve().parent.parent
runtime_version = subprocess.check_output(['dpkg-query', '-W', '-f=${Version}', 'openjdk-21-jre-headless'], text=True).strip()
root = Path('/workspace/zuporta-apt')
for name in ('lists/partial', 'cache/archives/partial', 'downloads', 'empty'):
    (root / name).mkdir(parents=True, exist_ok=True)
(root / 'sources.list').write_text(
    'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian trixie main\n'
    'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://security.debian.org/debian-security trixie-security main\n')
config = (
    f'Dir::Etc::Parts "{root}/empty";\n'
    f'Dir::Etc::sourcelist "{root}/sources.list";\n'
    f'Dir::Etc::sourceparts "{root}/empty";\n'
    f'Dir::State::lists "{root}/lists";\n'
    f'Dir::Cache "{root}/cache";\n')
proxy_url = os.environ.get('HTTPS_PROXY')
if proxy_url:
    proxy = urlparse(proxy_url)
    if proxy.username or proxy.password:
        raise SystemExit('Proxy credentials will not be copied into setup files.')
    config += f'Acquire::https::Proxy "{proxy_url}";\n'
(root / 'apt.conf').write_text(config)
environment = {**os.environ, 'APT_CONFIG': str(root / 'apt.conf')}
package = 'openjdk-21-jdk-headless=' + runtime_version
subprocess.run(['apt-get', 'update'], env=environment, check=True)
metadata = subprocess.check_output(['apt-cache', 'show', package], env=environment, text=True)
expected = re.search(r'^SHA256: ([0-9a-f]{64})$', metadata, re.MULTILINE)
if not expected:
    raise SystemExit('Matching JDK checksum unavailable from signed Debian metadata.')
subprocess.run(['apt-get', 'download', package], cwd=root / 'downloads', env=environment, check=True)
archives = list((root / 'downloads').glob('openjdk-21-jdk-headless_*.deb'))
archive = None
for candidate in archives:
    with candidate.open('rb') as downloaded:
        if hashlib.file_digest(downloaded, 'sha256').hexdigest() == expected.group(1):
            archive = candidate
            break
if archive is None:
    raise SystemExit('JDK package checksum mismatch; refusing installation.')
subprocess.run(['dpkg-deb', '-x', str(archive), '/workspace/zuporta-jdk'], check=True)
# Debian splits JDK tools and the runtime into separate packages. Copy the
# exact installed matching runtime so native libraries report this complete
# JDK as java.home. No system files are modified.
shutil.copytree(runtime_home, jdk, dirs_exist_ok=True, symlinks=False)
subprocess.run([str(jdk / 'bin/java'), '-version'], check=True)
subprocess.run([str(jdk / 'bin/javac'), '-version'], check=True)
print('Installed matching checksum-verified Java 21 JDK at ' + str(jdk))
