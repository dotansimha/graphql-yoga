module.exports = {
  root: true,
  env: {
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-else-return': ['error', { allowElseIf: false }],
    'object-shorthand': ['error', 'always'],
  },
}
