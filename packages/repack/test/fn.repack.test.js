/* eslint max-statements:0, max-lines-per-function:0, no-console:0 */

// core modules
const path = require('path');
const fs = require('fs-extra');

// own modules
const { fn: repack } = require('../index');
// const { utils } = require('@ocli/core');
const tmp = require('../../../helpers/tmp')(__dirname, 'tmp');

describe('@ocli/repack/fn', () => {

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

    test('repack(), no options', async () => {
        expect.assertions(5);

        const src = 'packages/repack/test/data/package.json';
        const dest = 'packages/repack/test/tmp';
        const opts = {};
        expect(await repack(src, dest, opts)).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(true);
        const original = await fs.readJson(src);
        const processed = await fs.readJson(tmp.pathTo('package.json'));
        expect(processed.name).toEqual('repack-test');
        expect(original).toEqual(processed);

        // re-running the same, should throw when exists
        await expect(repack(src, dest, opts)).rejects.toThrow('not safe');
    });

    test('repack(), with options', async () => {
        expect.assertions(28);

        const src = 'data/package.json';
        const dest = 'tmp';
        const opts = {
            cwd: __dirname,
            indent: 4,
            private: true,
            name: 'repacktest',
            description: 'Some description...',
            removeDeps: true,
            removeDevDeps: true,
            removePeerDeps: true,
            removeBundledDeps: true,
            removeOptDeps: true,
            remove: ['scripts, license', 'jest.testEnvironment'],
            set: ['license:ISC', 'prop.prop:true'],
            sort: true, // redundant when smart = true
            smart: true
        };
        expect(await repack(src, dest, opts)).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(true);
        const original = await fs.readJson(path.join(__dirname, src));
        const processed = await fs.readJson(tmp.pathTo('package.json'));
        expect(original.private).toBeUndefined();
        expect(processed.private).toEqual(true);
        expect(original.name).not.toEqual(processed.name);
        expect(processed.name).toEqual(opts.name);
        expect(original.description).not.toEqual(opts.description);
        expect(processed.description).toEqual(opts.description);
        expect(original.dependencies).toBeDefined();
        expect(processed.dependencies).toBeUndefined();
        expect(original.devDependencies).toBeDefined();
        expect(processed.devDependencies).toBeUndefined();
        expect(original.peerDependencies).toBeDefined();
        expect(processed.peerDependencies).toBeUndefined();
        expect(original.bundledDependencies).toBeDefined();
        expect(processed.bundledDependencies).toBeUndefined();
        expect(original.optionalDependencies).toBeDefined();
        expect(processed.optionalDependencies).toBeUndefined();
        expect(processed.jest).toBeDefined();
        expect(original.jest.testEnvironment).toBeDefined();
        expect(processed.jest.testEnvironment).toBeUndefined();
        expect(original.license).toEqual('MIT');
        expect(processed.license).toEqual('UNLICENSED'); // bec. private = true, smart = true
        expect(original.prop).toBeUndefined();
        expect(processed.prop.prop).toEqual(true);
        expect(Object.keys(processed)[0]).toEqual('private'); // smart-sorted

        // re-running the same, should throw (not safe)
        await expect(repack(src, dest, opts)).rejects.toThrow('not safe');
        opts.danger = true;
        await expect(repack(src, dest, opts)).resolves.not.toThrow();
    });

    test('repack(), no dest', async () => {
        expect.assertions(1);

        const src = 'data/package.json';
        const opts = {
            cwd: __dirname,
            danger: false
        };
        await expect(repack(src, null, opts)).rejects.toThrow();
    });

    test('repack(), out of cwd', async () => {
        expect.assertions(3);

        const src = '../../test_/package.json';
        const dest = 'tmp';
        const opts = {
            cwd: __dirname,
            name: 'repack-test2'
        };
        expect(await repack(src, dest, opts)).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(true);
        expect((await fs.readJson(tmp.pathTo('package.json'))).name).toEqual('repack-test2');
    });

    test('repack(), non-existing src', async () => {
        expect.assertions(2);

        let err;
        try {
            await expect(repack('none/package.json', 'packages/repack/test/tmp', {})).rejects.toThrow();
        } catch (ex) {
            err = ex;
            if (err) console.log(err);
        }
        expect(err).toBeUndefined();
    });

    test('repack(), bundle', async () => {
        jest.setTimeout(10000);
        expect.assertions(3);

        const src = 'data/package.json';
        const dest = 'tmp';
        const opts = {
            cwd: __dirname,
            bundle: true,
            danger: false
        };
        await expect(repack(src, dest, opts)).rejects.toThrow('version');
        await tmp.clean();
        opts.set = ['version:"1.0.0"'];
        expect(await repack(src, dest, opts)).toEqual(true);
        expect(await tmp.exists('repack-test-1.0.0.tgz')).toEqual(true);
    });

    test('repack(config), install', async () => {
        jest.setTimeout(10000);
        expect.assertions(11);

        const configFile = path.join(__dirname, 'config', 'fn.repack.json');
        expect(await repack(configFile)).toEqual(true);
        expect(await tmp.exists('package.json')).toEqual(true);
        const processed = await fs.readJson(tmp.pathTo('package.json'));
        expect(Object.keys(processed)[0]).toEqual('author');
        expect(processed.name).toEqual('repack-config-test');
        expect(processed.description).toMatch('some desc');
        expect(processed.dependencies).toBeDefined();
        expect(processed.devDependencies).toBeUndefined();
        expect(processed.license).toEqual('BSD');
        expect(processed.some.string).toEqual('true');
        // check if installed
        expect(await tmp.exists('package-lock.json')).toEqual(true);
        expect(await tmp.exists('node_modules/notation')).toEqual(true);
    });

    test('repack(), no or invalid paths', async () => {
        jest.setTimeout(10000);
        expect.assertions(7);

        await expect(repack('packages/repack/test/config/fn.repack.json', './tmp', {})).rejects.toThrow('Invalid source');
        await expect(repack()).rejects.toThrow('Destination directory');
        await expect(repack('packages/repack/test/data/package.json', 'packages/repack/test/data')).rejects.toThrow('Destination cannot be the same');
        await expect(repack('packages/repack/test/data/invalid-package.json', 'packages/repack/test/tmp')).rejects.toThrow('not a valid package.json');
        await expect(repack('packages/repack/test/data/invalid-json-package.json', 'packages/repack/test/tmp')).rejects.toThrow('not a valid package.json');
        // for some reason example with '../*.no-file' is too slow with jest.
        await expect(repack('../no-file', './tmp')).rejects.toThrow();
        // when src is falsy like below, repack looks for a package.json in cwd.
        // so below wouldn't throw if a package.json is found in cwd.
        await expect(repack('', './tmp', { cwd: 'packages/repack/test/' })).rejects.toThrow();
    });

});

