/* eslint no-sync:0, no-console:0, no-param-reassign:0, max-statements:0 */

// global options can be defined with config.options
// paths is an array that can take a string, string array or an object.
// each path item can have its own option paramters within the object, which
// will override global options for that item.

// example config
// {
//     "options": {
//         "cwd": "../src/",
//         "dest": "../dist/release/",
//          ... (other global options)
//     },
//     "paths": [
//         { "src": ["file1.js", "file2.js"] },
//         { "src": "fileX.js" },
//         ["file3.js", "file4.js"],
//         "file5.js",
//         { "src": ["./lib/**/*.js"], "parents": true },
//         { "src": ["./core/**/*.js"], "dest": "../dist/other" }
//     ]
// }

// core modules
const path = require('path');

// dep modules
// const fs = require('fs-extra');

// own modules
const Stats = require('./Stats');
const utils = require('./utils');

// vars
const { safe } = utils;

module.exports = (ocli, fn, batchProcessSettings) => {

    const { name, log } = ocli;
    const s = log.styles;
    const logPrefix = s.text('[') + s.subtitle(name) + s.text(']');
    const {
        defaultOptions,
        // verb to be used in logs
        verb = 'Processed',
        // whether to use/allow globs in paths
        useGlobs = true,
        // whether files are being processed
        files = true,
        // whether directories are being processed
        directories = true
    } = batchProcessSettings;

    // preparing words for logs
    let wItem = 'item';
    let wItems = 'items';
    if (files && !directories) {
        wItem = 'file';
        wItems = 'files';
    } else if (!files && directories) {
        wItem = 'directory';
        wItems = 'directories';
    }
    const plural = num => num === 1 ? wItem : wItems;

    // prepare options and dest
    function prepare(options, dest) {
        const opts = {
            ...defaultOptions,
            ...(options || {})
        };
        if (typeof dest === 'string') dest = path.resolve(opts.cwd, dest);
        return { dest, opts };
    }

    async function getPaths(source, opts) {
        if (useGlobs) {
            const globOpts = {
                cwd: opts.cwd || process.cwd(),
                dot: opts.dot,
                onlyFiles: files,
                onlyDirectories: directories,
                followSymlinkedDirectories: opts.dereference
            };
            const [err, paths] = await safe(ocli.getGlobPaths(source, globOpts));
            if (err && !opts.force) throw err;
            return paths || [];
        }
        return Promise.resolve(utils.ensureSrcArray(source));
    }

    // number of expected arguments (at design-time) can either be 2 or 3.
    // e.g. a copy operation needs a source and a destination defined.
    // but a clean operation needs only a target.
    // plus, both should accept an options object.
    const arity = fn.length;
    if (arity < 2 && arity > 3) {
        throw new Error('Batch process seed function arity is invalid.');
    }

    // we wrap the original seed fn here (to clean away some complexity.)
    function fnSeed(src, dest, opts) {
        if (arity === 2) {
            return fn(src, opts);
        }
        return fn(src, dest, opts);
    }

    async function fnBatch(source, destination, options, _taskBatchNo) {
        if (!source) throw new Error('Invalid source.');

        const stats = new Stats();
        const { opts, dest } = prepare(options, destination);
        const paths = await getPaths(source, opts);
        stats.total = paths.length;

        // _taskBatchNo is an undocumented, private argument. if set, we know
        // this is a task batch operation so the log output will respect that.
        if (!_taskBatchNo && stats.total > 1) log.title(`[${ocli.name}]`);

        await utils.pmap(paths, async file => {
            await fnSeed(file, dest, opts);
            stats.update();
            if (stats.total > 1) log.data(`${verb} ${wItem} ${stats.completed} of ${stats.total}: "${file}" to "${destination}"`);
        });

        stats.end();
        if (!_taskBatchNo) {
            log.empty();
            // log the item if only 1 is processed.
            const item1 = stats.completed === 1 ? ` ('${paths[0]}')` : '';
            log.ok(`${logPrefix} ${verb} ${s.accent(stats.completed)} ${plural(stats.completed)}${item1} in ${stats.elapsedTime} secs.`);
        }
        return stats.toObject();
    }

    async function fnTask(configFile) {
        let stats = new Stats();

        log.title(`[${name} Task]`);
        log.info(`Reading task config from "${configFile}"...`);

        const { options: configOpts, paths } = await ocli.getBatchConfig(configFile, defaultOptions);
        const { opts: globalOpts, dest: globalDest } = prepare(configOpts, configOpts.dest);

        const len = paths.length;
        let taskBatchNo;

        await utils.pmap(paths, async (batch, index) => {
            batch = utils.normalizeBatchItem(batch, globalOpts, globalDest);
            taskBatchNo = index + 1;
            log.data(`Processing batch ${taskBatchNo} of ${len}...`);
            const batchStats = await fnBatch(batch.src, batch.dest, batch.options, taskBatchNo);
            stats = stats.mergeWith(batchStats);
        });
        stats.end();
        log.empty();
        // log the item if only 1 is processed.
        const item1 = stats.completed === 1 ? ` ('${paths[0]}')` : '';
        log.ok(`${logPrefix} ${verb} ${s.accent(stats.completed)} ${plural(stats.completed)}${item1} in ${stats.elapsedTime} secs.`);
        return stats.toObject();
    }

    async function batchProcessor(...args) {
        if (args.length < 1) {
            return ocli.fail('No arguments passed.');
        }
        let stats;
        try {
            if (args.length === 1) {
                stats = await fnTask(...args);
            } else if (args.length === 2) {
                stats = typeof args[1] === 'string'
                    ? await fnBatch(args[0], args[1]) // src, dest
                    : await fnBatch(args[0], null, args[1]); // src, null, opts
            } else {
                stats = await fnBatch(...args);
            }
            // stats = args.length === 1
            //     ? await fnTask(...args)
            //     : await fnBatch(...args);
        } catch (err) {
            ocli.fail(err); // re-throws
        }
        return stats;
    }

    return batchProcessor;

};
