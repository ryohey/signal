module.exports = {
  testEnvironment: "./src/test/CustomEnvironment.ts",
  preset: "ts-jest/presets/js-with-babel-esm",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transformIgnorePatterns: ["/node_modules/(?!(midifile-ts|use-l10n)/)"],
}
