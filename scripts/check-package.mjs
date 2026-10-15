import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const config = JSON.parse(await readFile('capacitor.config.json', 'utf8'));
assert.equal(config.appId, 'com.zuporta.plus');
assert.equal(config.appName, 'Zuporta+');
assert.equal(config.server, undefined, 'Store build must bundle web assets, not load a remote development server');
const sw = await readFile('connect.zuporta.com/sw.js', 'utf8');
for (const match of sw.matchAll(/'\.\/(.*?)'/g)) {
  if (match[1]) await access(`connect.zuporta.com/${match[1]}`);
}
const shipped = execFileSync('git', ['ls-files', 'connect.zuporta.com'], { encoding: 'utf8' }).trim().split('\n');
for (const path of shipped.filter((file) => /\.(js|html)$/.test(file) && !file.endsWith('native.js'))) {
  const source = await readFile(path, 'utf8');
  assert(!/console\.(log|debug)\s*\(/.test(source), `Debug logging in ${path}`);
  assert(!/lorem ipsum/i.test(source), `Placeholder copy in ${path}`);
}
const manifest = await readFile('android/app/src/main/AndroidManifest.xml', 'utf8');
assert(manifest.includes('android:allowBackup="false"'));
assert(manifest.includes('android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove"'));
assert((await readFile('ios/App/App/PrivacyInfo.xcprivacy', 'utf8')).includes('NSPrivacyTracking'));
console.log('PASS: packaged identity, local web assets, service-worker files, source hygiene and privacy configuration');
