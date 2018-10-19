/* eslint no-sync:0, no-console:0, no-param-reassign:0, max-statements:0 */

// core modules
const path = require('path');

// own modules
const pkg = require('./package.json');
const { OCLI, Styles, utils } = require('@ocli/core');
const { fs } = utils;

const ocli = new OCLI('Copy');
const { log } = ocli;
const s = new Styles(true);

const defaultOptions = {
    parents: false, // fs-extra
    overwrite: false, // fs-extra
    errorOnExists: true, // fs-extra
    dereference: false, // fs-extra but also globs option as followSymlinkedDirectories
    timestamps: false, // fs-extra (preserveTimestamps)
    cwd: process.cwd(), // fs-x and globs option
    dot: false // globs option
};

// src is a file and dest is a directory
async function copyOne(src, dest, options) {
    // copyOne is never called directly, so we're sure we have options set.
    src = path.resolve(options.cwd, src);

    // with fs-extra's copy; if `src` is a file, `dest` cannot be a directory.
    // but here, we enable passed `dest` to be a directory and we'll turn it
    // into a file path.
    const basename = path.basename(src);
    let parents = '';
    if (options.parents) {
        const p = path.relative(options.cwd, path.dirname(src));
        // if source is outside of cwd; normally, it ends up outside of dest
        // dir when parents = true. so we'll check for "../" (or "..\\" on
        // windows) and never copy to outside of dest dir.
        const isOutsideOfCwd = p.includes('..');
        parents = isOutsideOfCwd ? '' : p;
    }
    dest = path.join(dest, parents, basename);

    // fs-extra: if src is a directory it will copy everything inside of this
    // directory (not the entire directory itself). but we get the src path out
    // of globs and globs are always file paths.

    // remove non-fs-extra options, as opts
    const { dot: ignored, ...rest } = options; // node v8.6+  https://node.green/#ES2018-features-object-rest-spread-properties-object-rest-properties
    rest.preserveTimestamps = rest.timestamps;
    await fs.copy(src, dest, rest);
    return true;
}

const describe = 'Copy files and directories.';
const cmdOptionsMeta = {
    c: {
        alias: 'config',
        type: 'string',
        description: 'Path to a JSON configuration file for batch copy operations as a task. When set, all other CLI options are ignored. They should be defined in the config file.',
        global: false,
        normalize: true // apply path.normalize
    },
    p: {
        alias: 'parents',
        describe: 'Also copy parent directory structure.',
        type: 'boolean',
        // default: false,
        global: false
    },
    o: {
        alias: 'overwrite',
        describe: 'Overwrite the destination if exists.',
        type: 'boolean',
        // default: false,
        global: false
    },
    e: {
        alias: 'error-on-exists',
        describe: 'Throw if overwrite is false and file exists.',
        type: 'boolean',
        // default: false,
        global: false
    },
    deref: {
        alias: 'dereference',
        type: 'boolean',
        description: 'Dereference symlinks.',
        // default: false,
        global: false
    },
    t: {
        alias: 'timestamps',
        type: 'boolean',
        description: 'Set last modification and access times of the copied files from their originals. If false, behavior is OS-dependent.',
        // default: false,
        global: false
    }
};

// builder function used to provide advanced command specific help.
/* istanbul ignore next */
function builder(yargs) {
    return yargs
        .usage(`\n${s.accent('o')} ${s.accent('copy')} ${s.white('[src]')} ${s.white('[dest]')}\n\n${describe}`)
        .help('h', `Show ${pkg.name} help`).alias('h', 'help')
        .version('v', `Output ${pkg.name} version`, pkg.version)
        .alias('v', 'version')
        .positional('src', {
            describe: 'Source file paths or globs. Can be comma-separated if multiple.',
            type: 'string'
        })
        .positional('dest', {
            describe: 'Destination directory. Required if `src` is set.',
            type: 'string'
        })
        .implies('src', 'dest')
        // .demandOption(['src', 'dest'], 'Please provide both src and dest arguments for copy command.')
        .conflicts('config', ['src', 'dest'])
        .group('config', s.subtitle('Run a Copy task from config:'))
        .options(cmdOptionsMeta)
        .example(
            `${s.hilight('do copy')} ${s.white('src/**/*.png dest/')} ${s.opt('-p -o')}`,
            s.faded('Copy PNG files, (over)write to dest with parent dirs')
        )
        .example(
            `${s.hilight('do copy')} ${s.opt('-c')} ${s.white('path/to/copy.config.json')}`,
            s.faded('Copy files defined in a JSON config file')
        );
}

// handler will be executed with the parsed argv object.
function handler(argv) {
    if (argv.config) {
        /* istanbul ignore next */
        if (argv.src || argv.dest) {
            log.warn(ocli.prefix() + ' Running from batch config file. `src` and `dest` paramters are ignored.');
        }
        return ocli.fn(argv.config);
    }
    if (argv.src && argv.dest) {
        const options = utils.pickOptsFromArgv(argv, cmdOptionsMeta);
        return ocli.fn(argv.src, argv.dest, options);
    }

    return ocli.fail('Please either provide `src` and `dest` parameters or `--config` option.\nRun `do copy --help` to get help.', 'warn');
}

module.exports = ocli.define(copyOne, {
    batchProcess: {
        defaultOptions,
        verb: 'Copied'
    },
    command: ['copy [src] [dest]', 'cp'],
    describe,
    builder,
    handler
});
