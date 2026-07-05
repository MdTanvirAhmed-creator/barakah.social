const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// RLS integration tests — run against a LOCAL Supabase stack (`supabase start`),
// separately from unit tests: `npm run test:rls`.
const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/rls/**/*.test.[jt]s'],
  testTimeout: 30000,
  maxWorkers: 1,
}

module.exports = createJestConfig(customJestConfig)
