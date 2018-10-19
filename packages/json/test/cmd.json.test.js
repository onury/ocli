/* eslint max-statements:0, no-console:0 */

// core modules
const path = require('path');
// const globby = require('globby');

// own modules
const { cmd } = require('../index');
const tmp = require('../../../helpers/tmp')(__dirname, 'tmp2');

describe('@ocli/json/cmd', () => {

    beforeEach(async () => {
        // Resets the module registry - the cache of all required modules. This
        // is useful to isolate modules where local state might conflict between
        // tests.
        jest.resetModules();
        await tmp.clean();
    });

    afterAll(async () => {
        await tmp.remove();
    });

    test('cmd.handler(argv) src, dest', async () => {
        expect.assertions(2);

        const argv = {
            src: './package.json',
            dest: './packages/json/test/tmp2',
            parents: true
        };
        const stats = await cmd.handler(argv);
        expect(stats.completed).toEqual(1);
        expect(await tmp.exists('package.json')).toEqual(true);
    });

    test('cmd.handler(argv) config', async () => {
        expect.assertions(4);

        const argv = {
            quiet: true,
            src: '../package.json', // should be ignored
            dest: './tmp2/dest', // should be ignored
            config: path.join(__dirname, 'config', 'cmd.json.json')
        };
        const stats = await cmd.handler(argv);
        expect(stats.completed).toEqual(1);
        expect(await tmp.exists('lerna.json')).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(false);
        expect(await tmp.exists('dest')).toEqual(false);
    });

    test('cmd.handler(argv) noop', async () => {
        expect.assertions(1);

        const stats = await cmd.handler({ quiet: true });
        expect(stats).toEqual(null);
    });

});

