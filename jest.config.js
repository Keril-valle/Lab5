/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test-integration/**/*.test.js'],
  testTimeout: 15000,
  verbose: true,
  clearMocks: true,
};
