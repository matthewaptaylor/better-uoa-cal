/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsdoc/recommended',
    'eslint-config-prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: [
      'tsconfig.json',
      'tsconfig.dev.json',
      'client/tsconfig.json',
      'server/tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'jsdoc'],
  root: true,
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/require-returns-description': 'off',
    'no-console': [
      'warn',
      { allow: ['warn', 'error', 'info', 'trace', 'dir', 'assert'] },
    ],
  },
  overrides: [
    {
      // Every file covered by tsconfig.dev.json
      files: [
        '.eslintrc.cjs',
        '.prettierrc.cjs',
        'commitlint.config.cjs',
        'client/vite.config.ts',
      ],
      env: {
        node: true,
      },
    },
  ],
};
