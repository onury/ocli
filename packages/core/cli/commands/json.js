/* eslint no-sync:0, no-console:0, no-param-reassign:0, max-statements:0 */

// core modules
const path = require('path');

// dep modules

// own modules
const OCLI = require('../../lib/OCLI');
const Styles = require('../../lib/Styles');
const pkg = require('../../package.json');
const utils = require('../../lib/utils');

const { fs, jsonc } = utils;

const ocli = new OCLI('JSON');
const s = new Styles(true);
const { log } = ocli;

const defaultOptions = {
    indent: 0,
    removeComments: false,
    parents: false, // boolean (for all parent dirs) or number for limiting levels
    overwrite: false, // fs-extra
    errorOnExists: true,
    dereference: false, // fs-extra but also globs option as followSymlinkedDirectories
    cwd: process.cwd(), // fs-x and globs option
    dot: false // globs option
};

// src is a file and dest is a directory
async function fnSeed(src, dest, options) {
    // fnSeed is never called directly, so we're sure we have options set.
    src = path.resolve(options.cwd, src);

    const basename = path.basename(src);
    let parents = '';

    if (dest) {
        // ensure dir only if dest is set initially. otherwise, dir paths
        // will be created only if --parents is set. jsonMore does that with
        // autoPath option. see at the bottom.
        await fs.ensureDir(dest);
        if (options.parents) {
            const p = path.relative(options.cwd, path.dirname(src));
            // if source is outside of cwd; normally, it ends up outside of dest
            // dir when parents = true. so we'll check for "../" (or "..\\" on
            // windows) and never write outside of dest dir.
            const isOutsideOfCwd = p.includes('..');
            parents = isOutsideOfCwd ? '' : p;
            if (parents && typeof options.parents === 'number' && options.parents > 0) {
                parents = utils.getParents(parents, options.parents, path.sep);
            }
        }
    } else {
        // If dest is omitted, directory of the source file is used. This
        // results in overwriting the source file, if --overwrite option is
        // set.
        dest = path.dirname(src);
    }

    dest = path.join(dest, parents, basename);

    if (!options.overwrite) {
        if (await fs.pathExists(dest)) {
            if (options.errorOnExists) ocli.fail(`JSON file already exists: ${dest}`);
            log.warn(`JSON file already exists. Will not overwrite: ${dest}`);
            return false;
        }
    }

    const content = await jsonc.read(src, { stripComments: options.removeComments });
    const jOpts = {
        space: options.indent || 0,
        autoPath: options.parents
    };
    await jsonc.write(dest, content, jOpts);
    return true;
}

const describe = 'Uglify/beautify JSON file(s).';
const cmdOptionsMeta = {
    i: {
        alias: 'indent',
        describe: 'Beautify JSON content by setting an indent. Or omit to uglify.',
        type: 'number',
        default: 0,
        global: false
    },
    r: {
        alias: 'remove-comments',
        describe: 'Remove comments from JSON file(s).',
        type: 'boolean',
        // default: false,
        global: false
    },
    c: {
        alias: 'config',
        type: 'string',
        description: 'Path to a JSON configuration file for batch JSON operations as a task. When set, all other CLI options are ignored. They should be defined in the config file.',
        global: false,
        normalize: true // apply path.normalize
    },
    p: {
        alias: 'parents',
        describe: 'Also create parent directory structure. Redundant if `dest` is not set.',
        // type: 'boolean', // boolean or number
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
        // default: true,
        global: false
    },
    deref: {
        alias: 'dereference',
        type: 'boolean',
        description: 'Dereference symlinks.',
        // default: false,
        global: false
    }
};

// builder function used to provide advanced command specific help.
/* istanbul ignore next */
function builder(yargs) {
    return yargs
        .usage(`\n${s.accent('o')} ${s.accent('json')} ${s.white('[src]')} ${s.white('[dest]')}\n\n${describe}`)
        .help('h', `Show ${pkg.name} help`).alias('h', 'help')
        .version('v', `Output ${pkg.name} version`, pkg.version)
        .alias('v', 'version')
        .positional('src', {
            describe: 'Source file paths or globs. Can be comma-separated if multiple.',
            type: 'string'
        })
        .positional('dest', {
            describe: 'Destination directory. If omitted, directory of the source file is used. This results in overwriting the source file, if --overwrite is set.',
            type: 'string'
        })
        // .implies('src', 'dest')
        .conflicts('config', ['src'])
        .group('config', s.subtitle('Run a JSON task from config:'))
        .options(cmdOptionsMeta)
        .example(
            `${s.hilight('o json')} ${s.white('src/**/*.json dest/')} ${s.opt('--rc -p -o')}`,
            s.faded('Remove comments and uglify JSON files, (over)write to dest with parent dirs')
        )
        .example(
            `${s.hilight('o json')} ${s.opt('-c')} ${s.white('path/to/json.config.json')}`,
            s.faded('Process JSON files from a JSON config file')
        );
}

// handler will be executed with the parsed argv object.
function handler(argv) {

    if (argv.config) {
        /* istanbul ignore next */
        if (argv.src || argv.dest) {
            log.warn('Running from batch config file. `src` and `dest` paramters are ignored.');
        }
        return ocli.fn(argv.config);
    }
    if (argv.src) {
        const options = utils.pickOptsFromArgv(argv, cmdOptionsMeta);
        return ocli.fn(argv.src, argv.dest, options);
    }

    log.warn('Please either provide `src` (and `dest`) parameter or `--config` option.');
    log.warn('Run `do json --help` to get help.');
    return Promise.resolve(null);
}

module.exports = ocli.define(fnSeed, {
    batchProcess: {
        defaultOptions,
        verb: 'Wrote',
        useGlobs: true,
        files: true,
        directories: false
    },
    command: ['json [src] [dest]'],
    describe,
    builder,
    handler
});
