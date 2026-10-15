"""Configure Gradle's standard Java proxy options from a credential-free proxy URL."""
from pathlib import Path
import os
from urllib.parse import urlparse

proxy_url = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
if not proxy_url:
    print('No HTTPS proxy supplied; preserving Gradle settings.')
    raise SystemExit(0)
proxy = urlparse(proxy_url)
if not proxy.hostname or proxy.username or proxy.password:
    raise SystemExit('A credential-free HTTPS proxy URL is required; no credential values will be saved.')
root = Path(os.environ.get('GRADLE_USER_HOME', '/workspace/.gradle-cache'))
root.mkdir(parents=True, exist_ok=True)
path = root / 'gradle.properties'
text = path.read_text() if path.exists() else ''
existing = {}
for line in text.splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        key, value = line.split('=', 1)
        existing[key.strip()] = value.strip()
settings = {
    'systemProp.https.proxyHost': proxy.hostname,
    'systemProp.https.proxyPort': str(proxy.port or 80),
    'systemProp.http.proxyHost': proxy.hostname,
    'systemProp.http.proxyPort': str(proxy.port or 80),
    'systemProp.http.nonProxyHosts': 'localhost|127.*',
}
for key, value in settings.items():
    if key in existing and existing[key] != value:
        raise SystemExit('Existing Gradle proxy settings differ; preserve them and resolve the runtime configuration.')
additions = [f'{key}={value}' for key, value in settings.items() if key not in existing]
if additions:
    path.write_text(text.rstrip() + '\n' + '\n'.join(additions) + '\n')
print('Gradle proxy configured without credentials; TLS verification remains enabled.')
