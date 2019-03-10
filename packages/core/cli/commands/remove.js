/* eslint no-console:0 */

// dep modules
const fs = require('fs-extra');

// own modules
const OCLI = require('../../lib/OCLI');
const Styles = require('../../lib/Styles');
const pkg = require('../../package.json');
const utils = require('../../lib/utils');

// vars
const ocli = new OCLI('REMOVE');
const s = new Styles(true);

const defaultOptions = {
    force: false,
    dereference: false, // fs-extra but also globs option as followSymlinkedDirectories
    cwd: process.cwd(), // fs-x and globs option
    dot: false // globs option
};

function fnSeed(fPath) {
    return fs.remove(fPath);
}

const describe = 'Remove path(s) recursively.';
const cmdOptionsMeta = {
    f: {
        alias: 'force',
        describe: 'Try to continue when errors occur.',
        type: 'boolean',
        // default: false,
        global: false
    },
    c: {
        alias: 'config',
        type: 'string',
        description: 'Path to a JSON configuration file for batch remove operations as a task. When set, all other CLI options are ignored. They should be defined in the config file.',
        global: false,
        normalize: true // apply path.normalize
    }
};

/* istanbul ignore next */
function builder(yargs) {
    return yargs
        .usage(`\n${s.accent('o')} ${s.accent('remove')} ${s.white('<dest>')}\n\n${describe}`)
        .help('h', `Show ${pkg.name} help`).alias('h', 'help')
        .version('v', `Output ${pkg.name} version`, pkg.version)
        .alias('v', 'version')
        .positional('path', {
            describe: 'File or directory path to be removed. The directory can have contents.',
            type: 'string'
        })
        .conflicts('config', ['path'])
        // .group('config', s.subtitle('Run a JSON task from config:'))
        .options(cmdOptionsMeta)
        .example(
            `${s.hilight('o remove')} ${s.white('path/to/file')}`,
            s.faded('Remove a file')
        );
}

function handler(argv) {
    // task config (single argument)
    if (argv.config) return ocli.fn(argv.config);

    if (!argv.path) return ocli.fail('No path is specified.', 'warn');
    // never omit second argument or it will be treated as task config.
    const options = utils.pickOptsFromArgv(argv, cmdOptionsMeta);
    return ocli.fn(argv.path, options);
}

module.exports = ocli.define(fnSeed, {
    batchProcess: {
        defaultOptions,
        verb: 'Removed',
        useGlobs: true,
        files: true,
        directories: true
    },
    command: ['remove <path>', 'rm'],
    describe,
    builder,
    handler
});
