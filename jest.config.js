
module.exports = {
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/doc/**",
    "!**/vendor/**"
  ],
  coverageReporters: [
    "json",
    "html"
  ],
  coverageDirectory: "reports/js",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/reports/",
    "/docs/",
    "/dist/"
  ],
  globals: {
    "NODE_ENV": "test"
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/reports/"
  ],
  modulePathIgnorePatterns: [
    "/static_root/",
    "/reports/"
  ],
  moduleFileExtensions: [
    "js"
  ],
  moduleDirectories: [
    "node_modules"
  ],
};