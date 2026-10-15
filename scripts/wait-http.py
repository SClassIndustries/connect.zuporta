"""Wait for the local test server without relying on a fixed sleep."""
import time
import urllib.request

deadline = time.monotonic() + 15
while time.monotonic() < deadline:
    try:
        with urllib.request.urlopen('http://127.0.0.1:8000/', timeout=1) as response:
            if response.status == 200:
                break
    except OSError:
        time.sleep(0.2)
else:
    raise SystemExit('Local test server did not become ready.')
