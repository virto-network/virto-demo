const sharedConfig = require('./jest.config.js');

module.exports = {
 ...sharedConfig,
 testRegex: '.unit-spec.ts$',
};