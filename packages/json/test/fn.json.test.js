/* eslint max-statements:0, max-lines-per-function:0, no-console:0 */

// core modules
const path = require('path');
const fs = require('fs-extra');

// own modules
const { fn: json } = require('../index');
const { utils } = require('@ocli/core');
const tmp = require('../../../helpers/tmp')(__dirname, 'tmp');

const { jsonc } = utils;

describe('@ocli/json/fn', () => {

    const dest = './tmp';

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

    test('json(one), no options', async () => {
        expect.assertions(5);

        const src = 'packages/json/test/data/test1.json';
        const destination = 'packages/json/test/tmp';
        const opts = {};
        const stats = await json(src, destination, opts);
        expect(stats.completed).toEqual(1);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('test1.json')).toEqual(true);
        expect(await fs.readFile(tmp.pathTo('test1.json'), 'utf8')).toEqual('{"test":"json"}\n');

        // re-running the same, should throw when exists
        await expect(json(src, destination, opts)).rejects.toThrow();
    });

    test('json(one), with options', async () => {
        expect.assertions(8);

        const src = 'data/test1.json';
        const destination = 'tmp';
        const opts = {
            cwd: __dirname,
            overwrite: true,
            parents: true
        };
        const stats = await json(src, destination, opts);
        expect(stats.completed).toEqual(1);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('data/test1.json')).toEqual(true);
        const processed = tmp.pathTo('data/test1.json');
        expect(await fs.readFile(processed, 'utf8')).toEqual('{"test":"json"}\n');

        const original = path.join(__dirname, src);
        const oSize = await utils.getFileSize(original);
        const pSize = await utils.getFileSize(processed);
        expect(pSize).toBeLessThan(oSize);

        // re-running the same, should overwrite
        await expect(json(src, destination, opts)).resolves.not.toThrow();
        opts.overwrite = false;
        opts.errorOnExists = true;
        await expect(json(src, destination, opts)).rejects.toThrow();
        opts.errorOnExists = false;
        await expect(json(src, destination, opts)).resolves.not.toThrow();
    });

    test('json(one), no dest', async () => {
        expect.assertions(1);

        const src = 'data/test1.json';
        const opts = {
            cwd: __dirname,
            overwrite: false
        };
        await expect(json(src, null, opts)).rejects.toThrow();
    });

    test('json(one), out of cwd', async () => {
        expect.assertions(3);

        const src = '../package-lock.json';
        const destination = 'tmp';
        const opts = {
            cwd: __dirname,
            parents: true,
            overwrite: false
        };
        const stats = await json(src, destination, opts);
        expect(stats.completed).toEqual(1);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('package-lock.json')).toEqual(true);
    });

    test('json(one), non-existing src', async () => {
        expect.assertions(1);

        await expect(json('no.file', 'packages/json/test/tmp', {})).rejects.toThrow();
    });

    test('json(globs), src out of cwd', async () => {
        expect.assertions(7);

        const src = ['../**/*.json', '!../node_modules/**', '!../test/**'];
        const opts = {
            cwd: __dirname,
            overwrite: true,
            parents: true
        };
        const stats = await json(src, dest, opts);
        expect(stats.percent).toEqual(1);
        expect(stats.elapsedTime).toBeGreaterThan(0);
        expect(new Date(stats.startTime).getFullYear()).toEqual(new Date().getFullYear());
        expect(await tmp.exists('package.json')).toEqual(true);
        expect(await tmp.exists('package-lock.json')).toEqual(true);
        // ../ is outside of cwd, we shouldn't have any dirs created
        expect(await tmp.exists('/lib')).toEqual(false);
        expect((await jsonc.read(tmp.pathTo('package.json'))).name).toEqual('@ocli/json');
    });

    test('json(config)', async () => {
        expect.assertions(10);

        const configFile = path.join(__dirname, 'config', 'fn.json.json');
        const stats = await json(configFile);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('different-dest/packages/core/package.json')).toEqual(true);
        expect(await tmp.exists('different-dest/packages/core/package-lock.json')).toEqual(true);
        expect(await tmp.exists('lerna.json')).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(true);
        // make sure the file is overwritten
        expect((await jsonc.read(tmp.pathTo('package.json'))).name).toEqual('ocli');
        expect(await tmp.exists('different-cwd/package.json')).toEqual(true);
        expect((await jsonc.read(tmp.pathTo('different-cwd/package.json'))).name).toEqual('@ocli/core');

        expect(await tmp.exists('different-dest')).toEqual(true);
        expect(await tmp.exists('different-cwd')).toEqual(true);
    });

    test('json(), no paths', async () => {
        jest.setTimeout(10000);
        // for some reason example with '../*.no-file' is too slow with jest.
        try {
            await json('../*.no-file', dest);
        } catch (ex) {
            expect(ex).toBeDefined();
            // console.log(ex);
        }

        expect.assertions(2);
        try {
            await json('', dest);
        } catch (ex) {
            expect(ex).toBeDefined();
        }
    });

});

