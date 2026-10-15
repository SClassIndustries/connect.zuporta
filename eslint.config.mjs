import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'android/**', 'ios/**', 'archive/**', 'connect.zuporta.com/assets/js/native.js', 'connect.zuporta.com/assets/js/monitoring.js'] },
  { files: ['connect.zuporta.com/assets/js/*.js', 'connect.zuporta.com/sw.js', 'src/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...globals.serviceworker, __ZUPORTA_SENTRY_DSN__: 'readonly', __ZUPORTA_RELEASE__: 'readonly' } },
    rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-dupe-args': 'error', 'no-dupe-keys': 'error',
      'no-dupe-else-if': 'error', 'no-const-assign': 'error', 'no-import-assign': 'error',
      'no-invalid-regexp': 'error', 'valid-typeof': 'error', 'no-debugger': 'error', 'no-console': 'error' } },
  { files: ['scripts/*.mjs', 'tests/*.mjs', '*.config.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
    rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-dupe-keys': 'error', 'no-debugger': 'error' } },
];
