import { defaults } from 'jest-config'
import { merge } from 'remeda'

/**
 * NOTE: Next.js provides a Jest integration, but it's a little slower than the current config (https://nextjs.org/docs/advanced-features/compiler#jest)
 */

const config = merge(defaults, {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  extensionsToTreatAsEsm: ['.jsx', '.ts', '.tsx'],
  globalSetup: './jest.setup.js',
  setupFilesAfterEnv: ['./jest.setupAfterEnv.js'],
  // maxWorkers: 1, // Speedup tests: https://github.com/kulshekhar/ts-jest/issues/259#issuecomment-504088010
  modulePaths: ['<rootDir>'],
  transformIgnorePatterns: [
    ...defaults.transformIgnorePatterns,
    'node_modules/(?!(stack-trace)/)',
  ],
})

export default config
