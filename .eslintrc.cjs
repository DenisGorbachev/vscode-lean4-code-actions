module.exports = {
  env: {
    node: true,
    es6: true,
  },
  plugins: [
    '@typescript-eslint',
    'eslint-plugin-node',
    'eslint-plugin-import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    ...getWhitespaceRules(),
    'max-len': 'off',
    'sort-keys': 'off',
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'indent': ['error', getIndent(), { SwitchCase: 1 }],
    'object-curly-spacing': 'off', // must be disabled according to https://typescript-eslint.io/rules/object-curly-spacing
    'comma-dangle': ['error', 'always-multiline'],
    'array-bracket-newline': ['error', 'consistent'],
    'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    'dot-location': ['error', 'property'],
    'spaced-comment': ['error', 'always', {
      'line': {
        'markers': ['/'],
        'exceptions': ['-', '+'],
      },
      'block': {
        'markers': ['!'],
        'exceptions': ['*'],
        'balanced': true,
      },
    }],
    'generator-star-spacing': ['error', { 'before': true, 'after': true }],
    'space-before-function-paren': ['error', { 'anonymous': 'always', 'named': 'never', 'asyncArrow': 'always' }],
    'function-paren-newline': ['error', 'multiline-arguments'],
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-trailing-spaces': ['error', { 'skipBlankLines': true, 'ignoreComments': true }],
    "padding-line-between-statements": "off", // in favor of @typescript-eslint/padding-line-between-statements
    'import/extensions': 'off',
    'prefer-rest-params': 'off',
    '@typescript-eslint/padding-line-between-statements': [
      'error',
      { 'blankLine': 'always', 'prev': '*', 'next': ['export', 'function'] },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    "@typescript-eslint/object-curly-spacing": ["error", "always"],
    // "node/file-extension-in-import": ["error", "always"],
  },
  ignorePatterns: [
    "out",
    "dist",
    "**/*.d.ts"
  ]
}

function getIndent() {
  return 2
}

function getWhitespaceRuleNames() {
  // Source: https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb/whitespace.js#L43
  return [
    'array-bracket-newline',
    'array-bracket-spacing',
    'arrow-spacing',
    'block-spacing',
    'comma-spacing',
    'computed-property-spacing',
    'dot-location',
    'eol-last',
    'func-call-spacing',
    'function-paren-newline',
    'generator-star-spacing',
    'implicit-arrow-linebreak',
    'indent',
    'key-spacing',
    'keyword-spacing',
    'linebreak-style',
    'no-irregular-whitespace',
    'no-mixed-spaces-and-tabs',
    'no-multi-spaces',
    'no-regex-spaces',
    'no-spaced-func',
    'no-trailing-spaces',
    'no-whitespace-before-property',
    'nonblock-statement-body-position',
    'object-curly-newline',
    'object-curly-spacing',
    'object-property-newline',
    'one-var-declaration-per-line',
    'operator-linebreak',
    'rest-spread-spacing',
    'semi-spacing',
    'semi-style',
    'space-before-blocks',
    'space-in-parens',
    'space-infix-ops',
    'space-unary-ops',
    'spaced-comment',
    'switch-colon-spacing',
    'template-tag-spacing',
    'import/newline-after-import',
    '@typescript-eslint/type-annotation-spacing',
  ]

}

function getWhitespaceRules() {
  return addErrors(getWhitespaceRuleNames())
}

function addErrors(names) {
  const rules = {}
  for (let i = 0; i < names.length; i++) {
    rules[names[i]] = ['error']
  }
  return rules
}
