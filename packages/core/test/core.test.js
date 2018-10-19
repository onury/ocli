/* eslint max-statements:0, max-statements-per-line:0, no-empty-function:0 */

// core modules

// own modules
const core = require('../index');

describe('@ocli/core/index', () => {

    test('exported modules', () => {
        const { OCLI, Stats, Logger, utils } = core;
        expect(() => new OCLI()).not.toThrow();
        expect(() => new Stats()).not.toThrow();
        expect(() => new Logger()).not.toThrow();
        expect(() => utils.type(true)).not.toThrow();
    });

});

