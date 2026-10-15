import { mkdir, writeFile } from 'node:fs/promises';
const fingerprint = process.env.PLAY_APP_SIGNING_SHA256;
if (!fingerprint || !/^([A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/.test(fingerprint)) {
  throw new Error('Set PLAY_APP_SIGNING_SHA256 to the public SHA-256 app signing certificate fingerprint from Play Console → App integrity. Do not use the upload-key fingerprint.');
}
const directory = 'connect.zuporta.com/.well-known';
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/assetlinks.json`, JSON.stringify([{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: { namespace: 'android_app', package_name: 'com.zuporta.plus', sha256_cert_fingerprints: [fingerprint.toUpperCase()] },
}], null, 2) + '\n');
console.log('Generated Android association file. Publish it to the HTTPS domain and verify on a signed device.');
