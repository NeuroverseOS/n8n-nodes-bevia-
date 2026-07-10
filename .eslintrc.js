/**
 * ESLint config for the n8n community node review.
 *
 * n8n's verified-node process runs `eslint-plugin-n8n-nodes-base`,
 * which enforces the node/credential authoring conventions (naming,
 * option ordering, credential test shape, package.json fields). The
 * `npm run lint` script (eslint nodes credentials --ext .ts) resolves
 * this config.
 *
 * The parser (@typescript-eslint/parser) ships as a dependency of
 * eslint-plugin-n8n-nodes-base, so it does not need to be listed
 * separately in devDependencies.
 */
module.exports = {
  root: true,
  env: { node: true, es6: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    extraFileExtensions: ['.json'],
  },
  ignorePatterns: ['.eslintrc.js', '**/*.js', 'dist/**', 'node_modules/**'],
  overrides: [
    {
      files: ['package.json'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/community'],
    },
    {
      files: ['credentials/**/*.ts'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/credentials'],
    },
    {
      files: ['nodes/**/*.ts'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/nodes'],
    },
  ],
};
