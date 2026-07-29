import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  maxWorkers: '50%',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees/', '<rootDir>/references/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // react-markdown@10 est ESM pur (non transformé par next/jest) → stub en test.
    '^react-markdown$': '<rootDir>/tests/__mocks__/react-markdown.tsx',
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.test.tsx',
    '<rootDir>/tests/contract/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.tsx',
  ],
}

export default createJestConfig(config)
