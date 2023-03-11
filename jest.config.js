/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["./jest.setup.js"],
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.spec.ts?(x)"],
  // TODO: collectCoverageFrom: ["src/graphql/**/*.spec.ts?(x)"]
};
