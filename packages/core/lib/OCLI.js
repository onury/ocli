/* eslint global-require:0, no-process-env:0, no-process-exit:0 */

// core modules
// const path = require('path');

// dep modules
const glob = require('fast-glob');
const jsonc = require('jsonc');

// own modules
const batchFactory = require('./batchFactory');
const Logger = require('./Logger');
const utils = require('./utils');

const repoBaseURL = 'https://github.com/onury/ocli/tree/master/packages/';
const docsBaseURL = 'https://onury.io/ocli/';

// vars
const defaultGlobOptions = {
    // fast-glob options
    // https://github.com/mrmlnc/fast-glob#options-1
    // cwd: process.cwd(),
    dot: false, // default: false
    deep: true, // default: true
    ignore: [], // default: []
    stats: false, // default: false
    onlyFiles: true, // default: true
    onlyDirectories: false, // default: false
    followSymlinkedDirectories: true, // default: true
    unique: true, // default: true
    markDirectories: false, // default: false
    absolute: false, // default: false
    nobrace: false, // default: false
    brace: true, // default: true
    noglobstar: false, // default: false
    globstar: true, // default: true
    noext: false, // default: false
    extension: true, // default: true
    nocase: false, // default: false
    case: true, // default: true
    matchBase: false, // default: false
    transform: null
};

/**
 *  Core class that builds the core function and command for a
 *  `@ocli/<package>`.
 */
class OCLI {

    /**
     *  Initializes a new instance of `OCLI` class.
     *  @param {String} libName  Name of the library.
     *  @param {Object} [options]  Global options.
     */
    constructor(libName, options) {
        this._ = {
            name: (libName || '').toLowerCase(),
            fn: null,
            cmd: {},
            cmdCall: false,
            options: {
                quiet: true,
                verbose: false,
                ...(options || {})
            }
        };
        this._.log = new Logger({
            enabled: !this._.options.quiet,
            verbose: this._.options.verbose
        });
    }

    /**
     *  Gets the (short) name of this package.
     *  @type {String}
     */
    get name() {
        return this._.name;
    }

    /**
     *  Gets the (scoped) name of this @ocli package.
     *  @type {String}
     */
    get pkgName() {
        return '@ocli/' + this.name.toLowerCase();
    }

    /**
     *  Gets the repository link for this @ocli package.
     *  @type {String}
     */
    get repoLink() {
        return repoBaseURL + this.name.toLowerCase();
    }

    /**
     *  Gets the documentation link for this @ocli package.
     *  @type {String}
     */
    get docsLink() {
        return docsBaseURL + this.name.toLowerCase();
    }

    /**
     *  Gets the core function of the command.
     *  @type {Function}
     */
    get fn() {
        return this._.fn;
    }

    /**
     *  Gets command metadata.
     *  @type {Object}
     */
    get cmd() {
        return this._.cmd;
    }

    /**
     *  Specifies whether this @ocli command supports batch and task
     *  operations.
     *  @type {Boolean}
     */
    get supportsBatchTask() {
        return Boolean(this._.supportsBatchTask);
    }

    /**
     *  Specifies whether `fn` is being called from a yargs command. If so, logs
     *  will be enabled, and when `#fail()` is called, it will not only throw
     *  but also exit the process.
     *  @type {Boolean}
     */
    get cmdCall() {
        return this._.cmdCall;
    }

    static get devMode() {
        return process.env.NODE_ENV === 'development';
    }

    static get testMode() {
        return process.env.NODE_ENV === 'test';
    }

    static get productionMode() {
        return !OCLI.devMode && !OCLI.testMode;
    }

    /**
     *  Command logger.
     *  @type {Logger}
     */
    get log() {
        return this._.log;
    }

    prefix(str) {
        const pre = `[o ${this.name}]`;
        if (!str) return pre;
        if (str.toLowerCase().slice(0, pre.length) !== pre.toLowerCase()) {
            return pre + ' ' + str;
        }
        return str;
    }

    /**
     *  Gets a list of resolved paths from the given glob pattern(s).
     *  @param {String|Array} patterns  Glob patterns to be resolved.
     *  @param {Object} [options]  Glob options.
     *  @param {Boolean} [failOnEmpty=true]  Whether to throw an error if no
     *  files are returned from given patterns.
     *  @returns {Promise<Array>}  Promise of a list of resolved file paths.
     */
    async getGlobPaths(patterns, options, failOnEmpty = true) { // eslint-disable-line class-methods-use-this
        const [ignore, str] = jsonc.safe.stringify(patterns);
        const errMsg = `No usable or existing paths found: ${str || ''}`;
        if (!patterns) {
            if (failOnEmpty) throw new Error(errMsg);
            return [];
        }
        const opts = {
            ...defaultGlobOptions,
            ...(options || {})
        };

        const paths = await glob(utils.ensureSrcArray(patterns), opts);
        if (!paths || paths.length === 0) {
            if (failOnEmpty) throw new Error(errMsg);
            return [];
        }
        return paths;
    }

    /**
     *  Reads and parses the contents of the given JSON configuration file. A
     *  config file has the following signature:
     * `{ src: String, dest: String, options: Object }`
     *  @param {String} filePath  Path to the configuration file.
     *  @param {Object} [defaultOptions]  Default options.
     *  @returns {Object}  Parsed config object.
     */
    async getConfig(filePath, defaultOptions = {}) { // eslint-disable-line class-methods-use-this
        const config = await jsonc.read(filePath, { stripComments: true });
        return {
            src: config.src,
            dest: config.dest,
            options: {
                ...(defaultOptions || {}),
                ...(config.options || {})
            }
        };
    }

    /**
     *  Reads and parses the contents of the given JSON batch configuration
     *  file. A batch config file has the following signature:
     * `{ options: Object, paths: Array }`
     *  @param {String} filePath  Path to the configuration file.
     *  @param {Object} [defaultGlobalOptions]  Default global options.
     *  @returns {Object}  Parsed config object.
     */
    async getBatchConfig(filePath, defaultGlobalOptions = {}) { // eslint-disable-line class-methods-use-this
        const config = await jsonc.read(filePath, { stripComments: true });
        return {
            options: {
                ...(defaultGlobalOptions || {}),
                ...(config.options || {})
            },
            paths: [...(config.paths || [])]
        };
    }

    /**
     *  Core method to initialize a `@ocli/<package>`. This exports the core
     *  function and the (yargs) command.
     *  @param {Function} fn  Core function of the package. This can either be
     *  the standalone function or the seed function (that processes a single
     *  item) for a batch command.
     *  @param {Object} meta  Command metadata.
     *      @param {Object} [meta.batchProcess]  Whether this command should
     *      support batch processing in a built-in, specific way. If enabled,
     *      the core function will be treated as a single-item processor and
     *      passed to the `batchFactory`; that adds support for batch and task
     *      operations.
     *      @param {Object} [meta.batchProcess.defaultOptions]  Default options for batch
     *      process. If not a batch process, options should be handled by the
     *      core function.
     *      @param {String} [meta.batchProcess.verb="Processed"]  Verb to be used in
     *      command logs, when an item or all items complete.
     *      @param {String} meta.command  CLI command definition (yargs).
     *      @param {String} meta.describe  Short description of the command
     *      (used in command help).
     *      @param {Function} meta.builder  CLI builder function (for yargs).
     *      @param {Function} meta.handler  CLI handler function (for yargs).
     *  @returns {OCLI}  Self instance.
     */
    define(fn, meta) {
        const { batchProcess, ...cmdMeta } = meta;
        if (batchProcess) {
            // mark so that help outputs, etc provide extra info
            this._.supportsBatchTask = true;
            // encapsulate the seed fn to enable support for built-in batch/task
            // logic.
            this._.fn = batchFactory(this, fn.bind(this), batchProcess);
        } else {
            // no batch/task support, this is a direct fn.
            this._.fn = fn.bind(this);
        }
        // set the command meta to be registered to @ocli/core
        this._.cmd = cmdMeta;
        // now we wrap the yargs command handler function to let ocli instance
        // know that the command/fn is being executed from command-line.
        const { handler } = this.cmd;
        if (handler) {
            this.cmd.handler = (argv = {}) => {
                this._.cmdCall = true; // » so ocli instance acts accordingly
                // set global cmd options
                this.log.enabled = typeof argv.quiet === 'boolean' ? !argv.quiet : true;
                this.log.verbose = typeof argv.verbose === 'boolean' ? argv.verbose : false;
                // execute the handler
                return handler(argv);
            };
        }
        return this;
    }

    /**
     *  When called, fails the command with the given error or message. Error
     *  thrown should not be caught in the command code.
     *  @param {String|Error} errOrMsg  Either a message or `Error`.
     *  @param {String} [type="error"]  Log type to be used when failing. Either
     *  `"error"` or `"warn"`.
     *  @returns {void}
     *  @throws {Error}
     */
    fail(errOrMsg = 'Failed', type = 'error') {
        const err = errOrMsg instanceof Error
            ? errOrMsg
            : new Error(errOrMsg);
        err.message = this.prefix(err.message);

        // in dev/test mode, we won't exit the process or the tests will halt.
        /* istanbul ignore next */
        if (OCLI.productionMode && this.cmdCall) {
            this.log[type](err.message);
            process.exit(1);
        } else {
            // only throw if programmatically called (or in dev mode)
            throw err;
        }
    }

}

module.exports = OCLI;
