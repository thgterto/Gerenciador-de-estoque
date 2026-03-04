
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-return-assign': 'off',
    'require-atomic-updates': 'off',
    'react/self-closing-comp': 'off',
    'react/no-unescaped-entities': 'off',
    'promise/param-names': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@rushstack/no-new-null': 'off',
    'dot-notation': 'off',
    'no-void': 'off',
    'eqeqeq': 'off',
    'no-unused-expressions': 'off',
    'no-throw-literal': 'off',
    '@typescript-eslint/ban-types': 'off',
    'no-cond-assign': 'off',
    'no-sequences': 'off'
  }
};
