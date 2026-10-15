"""Check bundled native libraries against the Android 16 KB page-size requirement."""
from pathlib import Path
import struct
import sys
import zipfile

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'android/app/build/outputs/bundle/release/app-release.aab')
count = 0
with zipfile.ZipFile(path) as archive:
    for name in archive.namelist():
        if not name.endswith('.so') or not any('/' + abi + '/' in name for abi in ('arm64-v8a', 'x86_64')):
            continue
        data = archive.read(name)
        if data[:4] != b'\x7fELF' or data[4] != 2:
            raise SystemExit(f'Unexpected 64-bit native library: {name}')
        endian = '<' if data[5] == 1 else '>'
        phoff = struct.unpack_from(endian + 'Q', data, 32)[0]
        phsize, phcount = struct.unpack_from(endian + 'HH', data, 54)
        for index in range(phcount):
            position = phoff + index * phsize
            kind = struct.unpack_from(endian + 'I', data, position)[0]
            if kind == 1 and struct.unpack_from(endian + 'Q', data, position + 48)[0] < 16384:
                raise SystemExit(f'{name} has a LOAD segment below 16 KB alignment.')
        count += 1
print(f'PASS: {count} bundled 64-bit native libraries have 16 KB compatible LOAD alignment.')
