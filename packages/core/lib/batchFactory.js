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

module.exports = (ocli, fn, batchProcessSettings) => {

    const { log } = ocli;
    const {
        defaultOptions,
        verb = 'Processed',
        useGlobs = true
    } = batchProcessSettings;

    function prepare(options, dest) {
        const opts = {
            ...defaultOptions,
            ...(options || {})
        };
        if (dest) dest = path.resolve(opts.cwd, dest);
        return { dest, opts };
    }

    function getPaths(source, opts) {
        if (useGlobs) {
            const globOpts = {
                cwd: opts.cwd,
                dot: opts.dot,
                followSymlinkedDirectories: opts.dereference
            };
            return ocli.getGlobPaths(source, globOpts);
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
        if (arity === 2) return fn(src, opts);
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
            /* istanbul ignore else */
            if (await fnSeed(file, dest, opts)) {
                stats.update();
                if (stats.total > 1) log.data(`${verb} file ${stats.completed} of ${stats.total}: "${file}" to "${destination}"`);
            }
        });

        stats.end();
        if (!_taskBatchNo) {
            log.empty();
            log.ok(`${verb} ${log.styles.accent(stats.completed)} file(s) in ${stats.elapsedTime} secs.`);
        }
        return stats.toObject();
    }

    async function fnTask(configFile) {
        let stats = new Stats();

        log.title(`[${ocli.name} Task]`);
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
        log.ok(`${verb} ${log.styles.accent(stats.completed)} file(s) in ${stats.elapsedTime} secs.`);
        return stats.toObject();
    }

    async function batchProcessor(...args) {
        if (args.length < 1) {
            return ocli.fail('No arguments passed.');
        }
        let stats;
        try {
            stats = args.length > 1
                ? await fnBatch(...args)
                : await fnTask(...args);
        } catch (err) {
            ocli.fail(err); // re-throws
        }
        return stats;
    }

    return batchProcessor;

};
