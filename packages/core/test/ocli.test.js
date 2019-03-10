/* eslint max-statements:0, max-statements-per-line:0, no-empty-function:0 */

// core modules
const path = require('path');
// own modules
const OCLI = require('../lib/OCLI');

describe('@ocli/core/lib/OCLI', () => {

    const ocli = new OCLI('TEST');

    test('basic', () => {
        expect(ocli.name).toEqual('test');
        expect(ocli.pkgName).toEqual('@ocli/test');
        expect(ocli.repoLink).toMatch(/packages\/test$/);
        expect(ocli.docsLink).toMatch(/ocli\/test$/);

        // initial global options
        expect(ocli.log.enabled).toEqual(false);
        expect(ocli.log.verbose).toEqual(false);

        expect(ocli.prefix()).toEqual('[test]');
        expect(ocli.prefix('message')).toEqual('[test] message');
        expect(ocli.prefix('[test] message')).toEqual('[test] message');
    });

    test('#define(), #fn, #cmd', async () => {
        const fn = () => 'test';
        ocli.define(fn, {
            batchProcess: false
        });
        expect(ocli.fn.name).toMatch('bound fn');
        expect(ocli.fn()).toEqual('test');
        expect(ocli.cmd).toEqual({});

        ocli.define(fn, {
            batchProcess: {
                defaultOptions: { parents: false }
            },
            command: 'test [src]',
            handler() {
                return 'handler';
            }
        });
        expect(ocli.supportsBatchTask).toEqual(true);
        expect(ocli.cmdCall).toEqual(false);
        expect(ocli.fn.name).toMatch('batchProcessor');
        await expect(ocli.fn()).rejects.toThrow('No arguments');
        await expect(ocli.fn('./test')).rejects.toThrow('ENOENT');
        expect(ocli.cmd.command).toBeDefined();
        expect(ocli.cmd.handler()).toEqual('handler');
        expect(ocli.cmdCall).toEqual(true);

        ocli.cmd.handler({ quiet: false, verbose: true });
        expect(ocli.log.enabled).toEqual(true);
        expect(ocli.log.verbose).toEqual(true);
        ocli.cmd.handler({ quiet: true, verbose: false });
        expect(ocli.log.enabled).toEqual(false);
        expect(ocli.log.verbose).toEqual(false);
    });

    test('#getGlobPaths()', async () => {
        expect.assertions(6);
        await expect(ocli.getGlobPaths(null, null, true)).rejects.toThrow();
        await expect(ocli.getGlobPaths(true, null, true)).rejects.toThrow();
        await expect(ocli.getGlobPaths(true, null, false)).resolves.toEqual([]);
        expect(await ocli.getGlobPaths('./**/*.js')).toEqual(expect.any(Array));
        await expect(ocli.getGlobPaths('./**/*.none')).rejects.toThrow();
        expect(await ocli.getGlobPaths('', null, false)).toEqual([]);
    });

    test('#getConfig(), #getBatchConfig()', async () => {
        expect.assertions(15);

        await expect(ocli.getConfig()).rejects.toBeDefined();
        await expect(ocli.getBatchConfig()).rejects.toBeDefined();

        let filepath = path.join(__dirname, './config/dev.repack.json');
        let config = await ocli.getConfig(filepath, null);
        expect(config).toEqual(expect.any(Object));
        expect(config.src).toBeDefined();
        expect(config.dest).toBeDefined();
        expect(config.options).toBeDefined();

        filepath = path.join(__dirname, './config/dev.repack-no-opts.json');
        config = await ocli.getConfig(filepath, { prop: true });
        expect(config.options).toEqual({ prop: true });


        filepath = path.join(__dirname, './config/dev.copy.json');
        config = await ocli.getBatchConfig(filepath, null);
        expect(config).toEqual(expect.any(Object));

        filepath = path.join(__dirname, './config/no-opts-dev.copy.json');
        config = await ocli.getBatchConfig(filepath, {
            overwrite: true,
            parents: false,
            cwd: 'here/'
        });
        expect(config).toEqual(expect.any(Object));
        expect(config.options.parents).toEqual(false);
        expect(config.options.overwrite).toEqual(true);
        expect(config.options.cwd).toEqual('here/');

        filepath = path.join(__dirname, './config/empty-config.json');
        config = await ocli.getBatchConfig(filepath);
        expect(config.options).toEqual({});
        expect(config).toEqual(expect.any(Object));
        expect(config.paths).toEqual([]);
    });

    test('#fail()', () => {
        expect(() => ocli.fail()).toThrow();
        expect(() => ocli.fail('ocli-error')).toThrow(/ocli-error/);
        expect(() => ocli.fail('[Test] msg')).toThrow(/msg/);
    });

});

