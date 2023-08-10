const config = require('./.eslintrc.cjs')

module.exports = {
  ...config,
  rules: {
    ...config.rules,
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    'no-debugger': ['error'],
  },
}
