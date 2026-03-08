// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierPlugin = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierPlugin,
  {
    ignores: ['dist/*', 'coverage/*', 'node_modules/*'],
  },
]);
