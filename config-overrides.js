// Absolute imports (aliases) are handled uniformly by `baseUrl: "src"` in
// tsconfig.json — e.g. `core/...`, `context/...`, `services/...`. That scheme
// works for the webpack build, the TypeScript compiler and Jest alike, so no
// extra webpack alias wiring is needed here.
module.exports = function override(config) {
  return config;
};
