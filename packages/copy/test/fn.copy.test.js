/* eslint max-statements:0, no-console:0, no-process-env:0 */

// core modules
const path = require('path');
const fs = require('fs-extra');

// own modules
const { fn: copy, getGlobPaths } = require('../index');
const tmp = require('../../../helpers/tmp')(__dirname, 'tmp');

describe('@ocli/copy/fn', () => {

    const dest = './tmp';

    beforeAll(() => {
        jest.resetModules();
        process.env.NODE_ENV = 'test';
    });

    beforeEach(async () => {
        // Resets the module registry - the cache of all required modules. This
        // is useful to isolate modules where local state might conflict between
        // tests.
        jest.resetModules();
        await tmp.clean();
    });

    afterAll(async () => {
        await tmp.clean();
    });

    test('copy(one), overwrite', async () => {
        expect.assertions(6);
        let err;
        try {
            const src = '../../../package.json';
            const opts = {
                cwd: __dirname,
                overwrite: true,
                quiet: true
            };
            const stats = await copy(src, dest, opts);
            expect(stats.total).toEqual(1);
            expect(stats.completed).toEqual(1);
            expect(stats.percent).toEqual(1);
            expect(await tmp.exists('package.json')).toEqual(true);
            // make sure the file is overwritten
            expect((await fs.readJson(tmp.pathTo('package.json'))).name).toEqual('ocli');
        } catch (ex) {
            err = ex;
            if (err) console.log(err);
        }
        expect(err).toBeUndefined();
    });

    test('copy(one), no options', async () => {
        expect.assertions(3);

        const src = 'lerna.json';
        const destination = 'packages/copy/test/tmp';
        const stats = await copy(src, destination);
        expect(stats.completed).toEqual(1);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('lerna.json')).toEqual(true);
    });

    test('copy(globs), src out of cwd', async () => {
        expect.assertions(13);

        const src = ['../**/*', '!../node_modules/**', '!../test/**'];
        const opts = {
            cwd: __dirname,
            overwrite: true,
            parents: true,
            quiet: true
        };
        const stats = await copy(src, dest, opts);
        expect(stats).toEqual(expect.any(Object));
        expect(stats.total).toEqual(4);
        expect(stats.completed).toEqual(4);
        expect(stats.percent).toEqual(1);
        expect(stats.elapsedTime).toBeGreaterThan(0);
        expect(new Date(stats.startTime).getFullYear()).toEqual(new Date().getFullYear());
        expect(new Date(stats.endTime).getFullYear()).toEqual(new Date().getFullYear());
        expect(await tmp.exists('LICENSE')).toEqual(true);
        expect(await tmp.exists('index.js')).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(true);
        // ../ is outside of cwd, we shouldn't have any dirs created
        expect(await tmp.exists('/lib')).toEqual(false);
        expect(await tmp.exists('/lib/fn.js')).toEqual(false);
        expect((await fs.readJson(tmp.pathTo('package.json'))).name).toEqual('@ocli/copy');
    });

    test('copy(config)', async () => {
        expect.assertions(9);

        // one of the paths array items in fn.copy.json has a different dest like this:
        const diffDest = path.join(__dirname, 'different-dest');

        const configFile = path.join(__dirname, 'config', 'fn.copy.json');
        const stats = await copy(configFile);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('packages/core/cli/register.js')).toEqual(true);
        expect(await tmp.exists('lerna.json')).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(true);
        // make sure the file is overwritten
        expect((await fs.readJson(tmp.pathTo('package.json'))).name).toEqual('ocli');
        // there should be no files with names starting with "in". e.g. index.js or info.js
        const filesStartingWithIn = await getGlobPaths('./tmp/**/in*.js', { cwd: __dirname }, false);
        expect(filesStartingWithIn).toEqual([]);

        expect(await tmp.exists('different-cwd/package.json')).toEqual(true);
        expect((await fs.readJson(tmp.pathTo('different-cwd/package.json'))).name).toEqual('@ocli/core');

        expect(await fs.pathExists(diffDest)).toEqual(true);

        await fs.remove(diffDest);
    });

    test('copy(), no paths', async () => {
        jest.setTimeout(10000);
        // for some reason example with '../*.no-file' is too slow with jest.
        try {
            await copy('../*.no-file', dest);
        } catch (ex) {
            expect(ex).toBeDefined();
            // console.log(ex);
        }

        expect.assertions(2);
        try {
            await copy('', dest);
        } catch (ex) {
            expect(ex).toBeDefined();
        }
    });

});

