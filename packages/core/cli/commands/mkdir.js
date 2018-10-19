/* eslint no-console:0 */

// core modules
// const path = require('path');

// dep modules
const fs = require('fs-extra');

// own modules
const OCLI = require('../../lib/OCLI');
const Styles = require('../../lib/Styles');
const pkg = require('../../package.json');
const utils = require('../../lib/utils');

// vars
const ocli = new OCLI('MKDIR');
// const { log } = ocli;
const s = new Styles(true);

function fnSeed(dirPath, options) {
    let { mode } = options || {};
    if (typeof mode === 'string') {
        let [err, m] = utils.parseSafe(mode, 'octal');
        if (err) [err, m] = utils.parseSafe(mode, 'number');
        if (err) {
            return Promise.reject(new Error(`Invalid file mode: ${mode}`));
        }
        mode = m;
    }
    return fs.mkdir(dirPath, { mode });
}

const describe = 'Ensure/create directory structure.';
const cmdOptionsMeta = {
    m: {
        alias: 'mode',
        describe: 'File system mode to be used. Either octal or integer value.',
        type: 'string',
        // default: false,
        global: false
    },
    c: {
        alias: 'config',
        type: 'string',
        description: 'Path to a JSON configuration file for batch mkdir operations as a task. When set, all other CLI options are ignored. They should be defined in the config file.',
        global: false,
        normalize: true // apply path.normalize
    }
};

/* istanbul ignore next */
function builder(yargs) {
    return yargs
        .usage(`\n${s.accent('do')} ${s.accent('mkdir')} ${s.white('<dest>')}\n\n${describe}`)
        .help('h', `Show ${pkg.name} help`).alias('h', 'help')
        .version('v', `Output ${pkg.name} version`, pkg.version)
        .alias('v', 'version')
        .positional('path', {
            describe: 'Directory path to be created. If parents do not exist, they are also created.',
            type: 'string'
        })
        .conflicts('config', ['path'])
        // .group('config', s.subtitle('Run a JSON task from config:'))
        .options(cmdOptionsMeta)
        .example(
            `${s.hilight('do mkdir')} ${s.white('path/to/non-existing/dirs')}`,
            s.faded('Create directory structure')
        )
        .example(
            `${s.hilight('do mkdir')} ${s.white('path/to/dir')} ${s.opt('-m')} ${s.white('0o2775')}`,
            s.faded('Create directory with mode 0o2775')
        );
}

function handler(argv) {
    // task config (single argument)
    if (argv.config) return ocli.fn(argv.config);

    if (!argv.path) return ocli.fail('No directory path is specified.', 'warn');
    // never omit second argument or it will be treated as task config.
    const { mode } = argv;
    return ocli.fn(argv.path, { mode });
}

module.exports = ocli.define(fnSeed, {
    batchProcess: {
        defaultOptions: {},
        verb: 'Created'
    },
    command: ['mkdir [path]', 'md'],
    describe,
    builder,
    handler
});
