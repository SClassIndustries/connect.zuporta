import { copyFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Use the existing approved PWA artwork. The generator scales the 512px
// source for native assets; a higher-resolution source can replace it later.
mkdirSync('.native-assets', { recursive: true });
copyFileSync('connect.zuporta.com/assets/img/icon-512.png', '.native-assets/logo.png');
const result = spawnSync('node_modules/.bin/capacitor-assets', [
  'generate', '--android', '--ios', '--assetPath', '.native-assets',
  '--iconBackgroundColor', '#ffffff', '--iconBackgroundColorDark', '#ffffff',
  '--splashBackgroundColor', '#ffffff', '--splashBackgroundColorDark', '#0f1720',
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
