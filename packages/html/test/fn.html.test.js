/* eslint max-statements:0, max-lines-per-function:0, no-console:0 */

// core modules
const path = require('path');
const fs = require('fs-extra');

// own modules
const { fn: html } = require('../index');
const { utils } = require('@ocli/core');
const tmp = require('../../../helpers/tmp')(__dirname, 'tmp');

describe('@ocli/html/fn', () => {

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

    test('html(one), no options', async () => {
        expect.assertions(6);

        const src = 'packages/html/test/data/test1.html';
        const destination = 'packages/html/test/tmp';
        const opts = {};
        const stats = await html(src, destination, opts);
        expect(stats.completed).toEqual(1);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('test1.html')).toEqual(true);
        const original = await fs.readFile(src, 'utf8');
        const processed = await fs.readFile(tmp.pathTo('test1.html'), 'utf8');
        expect(processed).toMatch('HTML Test');
        expect(original).toEqual(processed);

        // re-running the same, should throw when exists
        await expect(html(src, destination, opts)).rejects.toThrow();
    });

    test('html(one), with options', async () => {
        expect.assertions(8);

        const src = 'data/test1.html';
        const destination = 'tmp';
        const opts = {
            cwd: __dirname,
            minify: true,
            css: true,
            js: true,
            html5: true,
            overwrite: true,
            parents: true
        };
        const stats = await html(src, destination, opts);
        expect(stats.completed).toEqual(1);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('data/test1.html')).toEqual(true);
        const processed = tmp.pathTo('data/test1.html');
        expect(await fs.readFile(processed, 'utf8')).toMatch('HTML Test');

        const original = path.join(__dirname, src);
        const oSize = await utils.getFileSize(original);
        const pSize = await utils.getFileSize(processed);
        expect(pSize).toBeLessThan(oSize);

        // re-running the same, should overwrite
        await expect(html(src, destination, opts)).resolves.not.toThrow();
        opts.overwrite = false;
        opts.errorOnExists = true;
        await expect(html(src, destination, opts)).rejects.toThrow();
        opts.errorOnExists = false;
        await expect(html(src, destination, opts)).resolves.not.toThrow();
    });

    test('html(one), no dest', async () => {
        expect.assertions(1);

        const src = 'data/test1.html';
        const opts = {
            cwd: __dirname,
            overwrite: false
        };
        await expect(html(src, null, opts)).rejects.toThrow();
    });

    test('html(one), out of cwd', async () => {
        expect.assertions(3);

        const src = '../../test_/test/data2/test2.html';
        const destination = 'tmp';
        const opts = {
            cwd: __dirname,
            parents: true,
            overwrite: false
        };
        const stats = await html(src, destination, opts);
        expect(stats.completed).toEqual(1);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('test2.html')).toEqual(true);
    });

    test('html(one), non-existing src', async () => {
        expect.assertions(1);

        await expect(html('no.file', 'packages/html/test/tmp', {})).rejects.toThrow();
    });

    test('html(globs), src out of cwd', async () => {
        expect.assertions(6);

        const src = ['../../../packages/**/*.html', '!../node_modules/**', '!../test/**'];
        const opts = {
            minify: true,
            cwd: __dirname,
            overwrite: true,
            parents: true
        };
        const stats = await html(src, dest, opts);
        expect(stats.percent).toEqual(1);
        expect(stats.elapsedTime).toBeGreaterThan(0);
        expect(new Date(stats.startTime).getFullYear()).toEqual(new Date().getFullYear());
        expect(await tmp.exists('test2.html')).toEqual(true);
        expect(await tmp.exists('data/test1.html')).toEqual(true);
        // ../ is outside of cwd, we shouldn't have any dirs created
        expect(await tmp.exists('/data2')).toEqual(false);
    });

    test('html(config)', async () => {
        expect.assertions(4);

        const configFile = path.join(__dirname, 'config', 'fn.html.json');
        const stats = await html(configFile);
        expect(stats.percent).toEqual(1);
        expect(await tmp.exists('different-dest/packages/test_/test/data2/test2.html')).toEqual(true);
        expect(await tmp.exists('different-cwd/test/data/test1.html')).toEqual(true);
        expect(await tmp.exists('packages')).toEqual(true);
    });

    test('html(), no paths', async () => {
        jest.setTimeout(10000);
        expect.assertions(2);

        // for some reason example with '../*.no-file' is too slow with jest.
        await expect(html('../*.no-file', dest)).rejects.toThrow();
        await expect(html('', dest)).rejects.toThrow();
    });

});

