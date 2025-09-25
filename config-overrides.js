const path = require('path');

module.exports = function override(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@screens': path.resolve(__dirname, 'src/screens'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@styles': path.resolve(__dirname, 'src/styles'),
  };
  return config;
};
