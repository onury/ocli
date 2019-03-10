/* eslint no-console:0 */

// dep modules
const fs = require('fs-extra');

// own modules
const OCLI = require('../../lib/OCLI');
const Styles = require('../../lib/Styles');
const pkg = require('../../package.json');

// vars
const ocli = new OCLI('CLEAN');
const s = new Styles(true);

function fnSeed(dirPath) {
    return fs.emptyDir(dirPath);
}

const describe = 'Clean (empty) a directory.';
const cmdOptionsMeta = {
    c: {
        alias: 'config',
        type: 'string',
        description: 'Path to a JSON configuration file for batch clean operations as a task. When set, all other CLI options are ignored. They should be defined in the config file.',
        global: false,
        normalize: true // apply path.normalize
    }
};

/* istanbul ignore next */
function builder(yargs) {
    return yargs
        .usage(`\n${s.accent('o')} ${s.accent('clean')} ${s.white('<dest>')}\n\n${describe}`)
        .help('h', `Show ${pkg.name} help`).alias('h', 'help')
        .version('v', `Output ${pkg.name} version`, pkg.version)
        .alias('v', 'version')
        .positional('path', {
            describe: 'Directory path to be cleaned. If the directory does not exist, it is created. The directory itself is not deleted.',
            type: 'string'
        })
        .conflicts('config', ['path'])
        // .group('config', s.subtitle('Run a JSON task from config:'))
        .options(cmdOptionsMeta)
        .example(
            `${s.hilight('o clean')} ${s.white('path/to/dir')}`,
            s.faded('Empty a directory')
        );
}

function handler(argv) {
    // task config (single argument)
    if (argv.config) return ocli.fn(argv.config);

    if (!argv.path) return ocli.fail('No directory path is specified.', 'warn');
    // never omit second argument or it will be treated as task config.
    return ocli.fn(argv.path, {});
}

module.exports = ocli.define(fnSeed, {
    batchProcess: {
        defaultOptions: {},
        verb: 'Cleaned',
        useGlobs: false,
        files: false,
        directories: true
    },
    command: ['clean <path>', 'cl'],
    describe,
    builder,
    handler
});
