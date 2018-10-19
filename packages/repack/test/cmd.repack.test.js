/* eslint max-statements:0, no-console:0 */

// core modules
const path = require('path');

// dep modules
const fs = require('fs-extra');

// own modules
const { cmd } = require('../index');
const tmp2 = require('../../../helpers/tmp')(__dirname, 'tmp2');

describe('@ocli/repack/cmd', () => {

    beforeEach(async () => {
        // Resets the module registry - the cache of all required modules. This
        // is useful to isolate modules where local state might conflict between
        // tests.
        jest.resetModules();
        await tmp2.clean();
    });

    afterAll(async () => {
        await tmp2.remove();
    });

    test('cmd.handler(argv) src, dest', async () => {
        expect.assertions(6);

        const argv = {
            src: 'packages/repack/test/data/package.json',
            dest: './packages/repack/test/tmp2',
            removeDevDeps: true,
            set: ['license:Apache', 'prop.prop2:false'],
            smart: true
        };
        expect(await cmd.handler(argv)).toEqual(true);
        expect(await tmp2.exists('package.json')).toEqual(true);
        const processed = await fs.readJson(tmp2.pathTo('package.json'));
        expect(processed.private).toBeUndefined();
        expect(processed.devDependencies).toBeUndefined();
        expect(processed.license).toEqual('Apache');
        expect(processed.prop.prop2).toEqual(false);
    });

    test('cmd.handler(argv) config', async () => {
        expect.assertions(2);

        const argv = {
            quiet: true,
            src: '../package.jso', // should be ignored
            dest: './tmp2/dest', // should be ignored
            config: path.join(__dirname, 'config', 'cmd.repack.json')
        };
        expect(await cmd.handler(argv)).toEqual(true);
        expect(await tmp2.exists('package.json')).toEqual(true);
    });

    test('cmd.handler(argv) noop', async () => {
        expect.assertions(1);

        const result = await cmd.handler({ quiet: true });
        expect(result).toEqual(null);
    });

});

