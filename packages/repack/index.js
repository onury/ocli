/* eslint no-sync:0, no-console:0, no-param-reassign:0, max-statements:0, complexity:0 */

// core modules
const path = require('path');

// dep modules

// own modules
const pkg = require('./package.json');
const { OCLI, Styles, utils } = require('@ocli/core');

// constants
const { fs } = utils;
const ocli = new OCLI('REPACK');
const s = new Styles(true);
const { log } = ocli;

const defaultOptions = Object.freeze({
    indent: 2,
    install: false,
    bundle: false,
    private: false,
    set: [],
    remove: [],
    removeDeps: false,
    removeDevDeps: false,
    removeBundledDeps: false,
    removeOptDeps: false,
    removePeerDeps: false,
    danger: false,
    cwd: process.cwd()
});

// src is path to package.json (optional), if omitted, we'll use the
// package.json in cwd. dest is a directory. if src is omitted, dest is src.

async function prepare(src, dest, opts) {
    if (!src && !dest) {
        throw new Error('Destination directory is not specified.');
    }

    let pkgPath = src
        ? path.resolve(opts.cwd, src)
        : opts.cwd;
    const destDir = dest
        ? path.resolve(opts.cwd, dest)
        : path.resolve(opts.cwd, src);

    const srcStat = await fs.lstat(pkgPath);
    if (await srcStat.isDirectory()) {
        pkgPath = path.join(pkgPath, 'package.json');
    }
    if (!(/package\.json$/).test(pkgPath)) {
        throw new Error('Invalid source package.json path.');
    }

    if (path.dirname(pkgPath) === destDir) {
        throw new Error('Destination cannot be the same as source directory.');
    }

    // using fs.readJson() instead of utils.requireSafe() to avoid cached read.
    let pkgObj;
    try {
        pkgObj = await fs.readJson(pkgPath);
    } catch (ignored) {} // eslint-disable-line no-empty
    if (utils.type(pkgObj) !== 'object') {
        throw new Error(`Source is not a valid package.json: ${pkgPath}`);
    }

    return { pkgObj, destDir };
}

function has(destDir, itemName) {
    return fs.pathExists(path.join(destDir, itemName));
}

function cleanStdErr(str) {
    str = str.replace(/[^.]+package-lock\.json[^.]*\./gi, '')
        .replace(/\s*You should commit this file\.?\s*/gi, '')
        .replace(/[\s\r\n]/g, '')
        .trim();
    return utils.removeSurWhitespace(str).trim();
}

async function nonSafeDest(destDir) {
    return await has(destDir, 'package.json')
        || await has(destDir, 'package-lock.json')
        || await has(destDir, 'node_modules')
        || await has(destDir, '.git')
        || await has(destDir, '.bin'); // eslint-disable-line no-return-await
}

// overloads:
// repack(config)
// repack(src, dest, options)
async function repack(src, dest, options) {
    if (arguments.length === 1) {
        const config = await ocli.getConfig(src);
        src = config.src; // eslint-disable-line prefer-destructuring
        dest = config.dest; // eslint-disable-line prefer-destructuring
        options = config.options; // eslint-disable-line prefer-destructuring
    }
    const opts = {
        ...defaultOptions,
        ...(options || {})
    };
    let { pkgObj, destDir } = await prepare(src, dest, opts); // eslint-disable-line prefer-const

    if (!opts.danger && await nonSafeDest(destDir)) {
        throw new Error('It\'s not safe to overwrite the destination. Looks like a project folder.');
    }

    if (opts.private) pkgObj.private = true;
    if (typeof opts.name === 'string') pkgObj.name = opts.name;
    if (typeof opts.description === 'string') pkgObj.description = opts.description;
    if (opts.removeDeps) delete pkgObj.dependencies;
    if (opts.removeDevDeps) delete pkgObj.devDependencies;
    if (opts.removeBundledDeps) delete pkgObj.bundledDependencies;
    if (opts.removeOptDeps) delete pkgObj.optionalDependencies;
    if (opts.removePeerDeps) delete pkgObj.peerDependencies;

    /* istanbul ignore else */
    if (opts.remove) utils.removeProps(pkgObj, opts.remove);
    /* istanbul ignore else */
    if (opts.set) utils.setProps(pkgObj, opts.set, true);

    if (opts.smart) {
        // if marked as private, it probably means you do not wish to grant
        // others the right to use a private or unpublished package under any
        // terms. So we set the license: UNLICENSED (if license is not defined?).

        /* istanbul ignore else */
        if (opts.private === true) { // && !pkgObj.license
            utils.set(pkgObj, 'license', 'UNLICENSED');
        }
        // smart sort
        pkgObj = utils.sortKeys(pkgObj, {
            comparer: 'asc',
            deep: false,
            top: ['private', 'name', 'version', 'description', 'repository', 'homepage', 'bugs', 'license', 'author', 'main', 'files', 'directories', 'bin', 'scripts', 'engines'],
            bottom: ['types', 'typings', 'keywords', 'dependencies', 'peerDependencies', 'optionalDependencies', 'bundledDependencies', 'bundleDependencies', 'devDependencies']
        });
    }

    if (opts.sort && !opts.smart) {
        // aplhabetic sort
        pkgObj = utils.sortKeys(pkgObj, {
            comparer: 'asc',
            deep: false
        });
    }

    const destFile = path.join(destDir, 'package.json');
    await fs.outputFile(destFile, JSON.stringify(pkgObj, null, opts.indent), 'utf8');

    if (opts.install) {
        const result = await utils.exec(`cd "${destDir}" && npm install`);
        const stdout = utils.removeSurWhitespace(result.stdout || /* istanbul ignore next */ '');
        if (stdout) console.info(utils.indentNewLines(stdout));
        if (cleanStdErr(result.stderr)) {
            throw new Error('npm install failed: ' + utils.indentNewLines(utils.removeSurWhitespace(result.stderr)));
        }
    }

    if (opts.bundle) {
        const result = await utils.exec(`cd "${destDir}" && npm pack`);
        const stdout = (result.stdout || /* istanbul ignore next */ '').toLowerCase();
        /* istanbul ignore if */
        if (stdout.indexOf('.tgz\n') === -1) { // or we could check if .tgz is created
            throw new Error('npm pack (bundle) failed.');
        }
    }
    return true;
}

const describe = 'Repack an npm package.json.';
const cmdOptionsMeta = {
    n: {
        alias: 'name',
        describe: 'New name for the package',
        type: 'string',
        global: false
    },
    D: {
        alias: 'description',
        describe: 'New description for the package',
        type: 'string',
        global: false
    },
    i: {
        alias: 'install',
        describe: 'Run npm install when package is ready',
        type: 'boolean',
        global: false
    },
    b: {
        alias: 'bundle',
        describe: 'Run npm pack and bundle any defined deps within a .tgz file',
        type: 'boolean',
        global: false
    },
    indent: {
        describe: 'Number of spaces for indenting package.json content.',
        type: 'number',
        default: 2,
        global: false
    },
    sort: {
        describe: 'Sort package.json keys alphabetically. Also see --smart option',
        type: 'boolean',
        global: false
    },
    smart: {
        describe: 'Sort package.json keys by relevance, set unlincensed if private, etc',
        type: 'boolean',
        global: false
    },
    P: {
        alias: 'private',
        describe: 'Mark package as private',
        type: 'boolean',
        global: false
    },
    s: {
        alias: 'set',
        describe: 'Set a key/value in package.json. For multiple use repetitively.',
        type: 'string',
        global: false
    },
    r: {
        alias: 'remove',
        describe: 'Remove given property from package.json. For multiple use repetitively or separate with commas.',
        type: 'string',
        global: false
    },
    rd: {
        alias: 'remove-deps',
        describe: 'Remove dependencies',
        type: 'boolean',
        global: false
    },
    rdd: {
        alias: 'remove-dev-deps',
        describe: 'Remove development dependencies',
        type: 'boolean',
        global: false
    },
    rbd: {
        alias: 'remove-bundled-deps',
        describe: 'Remove bundled dependencies',
        type: 'boolean',
        global: false
    },
    rod: {
        alias: 'remove-opt-deps',
        describe: 'Remove optional dependencies',
        type: 'boolean',
        global: false
    },
    rpd: {
        alias: 'remove-peer-deps',
        describe: 'Remove peer dependencies',
        type: 'boolean',
        global: false
    },
    c: {
        alias: 'config',
        type: 'string',
        description: 'Path to a JSON configuration file for Repack task. When set, all other CLI options are ignored. They should be defined in the config file.',
        global: false,
        normalize: true // apply path.normalize
    },
    danger: {
        describe: 'Normally repack will abort if the destination already contains a package.json, a .git or .bin directory, etc. If you run repack with --danger, you\'re on your own.',
        type: 'boolean',
        global: false
    }
};

// builder function used to provide advanced command specific help.
/* istanbul ignore next */
function builder(yargs) {
    return yargs
        .usage(`\n${s.accent('o')} ${s.accent('repack')} ${s.white('[src]')} ${s.white('[dest]')}\n\n${describe}`)
        .help('h', `Show ${pkg.name} help`).alias('h', 'help')
        .version('v', `Output ${pkg.name} version`, pkg.version)
        .alias('v', 'version')
        .positional('src', {
            describe: 'Path to an original package.json file or a folder containing it.',
            type: 'string'
        })
        .positional('dest', {
            describe: 'Destination directory. Cannot be the source directory.',
            type: 'string'
        })
        // .implies('src', 'dest')
        .conflicts('config', ['src'])
        .group('config', s.subtitle('Run a Repack task from config:'))
        .options(cmdOptionsMeta)
        .example(
            `${s.hilight('o repack')} ${s.white('package.json dest/')} ${s.opt('-i -P --rdd')}`,
            s.faded('Remove devDependencies, mark as private, write modified package.json to dest and finally run npm-install')
        )
        .example(
            `${s.hilight('o repack')} ${s.opt('-c')} ${s.white('path/to/repack.config.json')}`,
            s.faded('Repack from a JSON config file')
        );
}

// handler will be executed with the parsed argv object.
function handler(argv) {

    if (argv.config) {
        /* istanbul ignore next */
        if (argv.src || argv.dest) {
            log.warn('Running from task config file. `src` and `dest` paramters are ignored.');
        }
        return ocli.fn(argv.config);
    }
    if (argv.src) {
        const options = utils.pickOptsFromArgv(argv, cmdOptionsMeta);
        return ocli.fn(argv.src, argv.dest, options);
    }

    log.warn('Please either provide `src` (and `dest`) parameter or `--config` option.');
    log.warn('Run `do repack --help` to get help.');
    return Promise.resolve(null);
}

module.exports = ocli.define(repack, {
    batchProcess: false,
    command: ['repack [src] [dest]'],
    describe,
    builder,
    handler
});
