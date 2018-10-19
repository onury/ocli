/* eslint no-sync:0, no-console:0, no-param-reassign:0, max-statements:0, max-lines:0, consistent-return:0 */

// core modules
const path = require('path');
const { exec } = require('child_process');

// dep modules
const fs = require('fs-extra');
const jsonc = require('jsonc');
const globby = require('globby');
const gzipSize = require('gzip-size');

// vars
const oproto = Object.prototype;
const asc = (a, b) => String(a).localeCompare(b);
const desc = (a, b) => String(b).localeCompare(a);
const srcSep = /\s*,\s*/g;

const utils = {

    fs,

    jsonc,

    // --------------------------
    // COMMON UTILS
    // --------------------------

    type(obj) {
        return oproto.toString.call(obj).match(/\s(\w+)/i)[1].toLowerCase();
    },

    isset(value) {
        return value !== null && value !== undefined;
    },

    isNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },

    isInfiniteNumber(value) {
        return typeof value === 'number' && !isNaN(value) && !isFinite(value);
    },

    isSceintific(str) {
        return (/\d+\.?\d*e[+-]*\d+/i).test(str);
    },

    isNumeric(str) {
        return (/^-?\d+\.?\d*$/).test(str);
    },

    isJsNumeric(str) {
        return utils.isSceintific(str)
            || utils.isNumeric(str)
            || (/^-?Infinity$/).test(str);
    },

    isOctal(str, prefixOptional = true) {
        return prefixOptional
            ? (/^(0[oO]?)?[0-7]+$/).test(str)
            : (/^0[oO][0-7]+$/).test(str);
    },

    isHex(str, prefixOptional = true) {
        return prefixOptional
            ? (/^(0x)?[0-9A-F]+$/i).test(str)
            : (/^0x[0-9A-F]+$/i).test(str);
    },

    isBinary(str, prefixOptional = true) {
        // new in ECMAScript 2015
        // e.g. 0b01111111100000000000000000000000 = 2139095040
        return prefixOptional
            ? (/^(0b)?[01]+$/).test(str)
            : (/^0b[01]+$/).test(str);
    },

    repeat(string, count = 1) {
        if (count < 1) return '';
        let repeated = '';
        while (count > 0) {
            if (count & 1) repeated += string; // eslint-disable-line no-bitwise
            count >>= 1; // eslint-disable-line no-bitwise
            string += string;
        }
        return repeated;
    },

    camelCase(str) {
        return str.trim()
            .replace(/[-_ ](.)/g, (m, $1) => $1.toUpperCase())
            .replace(/(^.)/, $1 => $1.toLowerCase());
    },

    titleCase(str) {
        return str.trim()
            .replace(/(^.)|[-_ ](.)/g, (m, $1, $2) => ($1 || $2).toUpperCase())
            .replace(/([A-Z])/g, ' $1')
            .trim();
    },

    hasSurQuotes(str) {
        str = str.trim();
        return (str.slice(0, 1) === '"' && str.slice(-1) === '"')
            || (str.slice(0, 1) === '\'' && str.slice(-1) === '\'');
    },

    removeSurQuotes(str) {
        str = str.trim();
        if (utils.hasSurQuotes(str)) return str.slice(1, -1).trim();
        return str;
    },

    // --------------------------
    // PROMISE/FN UTILS
    // --------------------------

    isPromise(o) {
        return Boolean(o)
            && utils.type(o) === 'promise'
            && typeof o.then === 'function';
    },

    /**
     *  Safely resolves or rejects the given promise by returning an array with
     *  signature `[error, result]`. This makes error handling easier (without
     *  needing to use try/catch blocks). If an error has occured, first item will
     *  be that error. Otherwise, first item will be `null` and second item (result)
     *  will be set.
     *
     *  @param {Promise} promise  Promise to be wrapped.
     *  @returns {Array<err, result>}  Error and result in an array.
     *
     *  @example
     *  import { safe } from './utils';
     *  async function example() {
     *      const [err, result] = await safe(fs.readFile('file.txt'));
     *      if (err) console.log('could not read file');
     *      return result;
     *  }
     */
    safeAsync(promise) {
        return promise.then(data => [null, data]).catch(err => [err]);
    },

    /**
     *  Gets the safe version of the given sync function; that prevents the original
     *  function from throwing. Instead; the returned function returns an array with
     *  signature `[error, result]`. If an error has occured, first item will be
     *  that error. Otherwise, first item will be `null` and second item (result)
     *  will be set.
     *
     *  @param {Function<result>} fn  Original function.
     *  @returns {Function<[err, result]>}  Safe version of the function.
     *
     *  @example
     *  const jsonParseSafe = utils.safeSync(JSON.parse);
     *  const [err, result] = jsonParseSafe('<>');
     *  console.log(err); // syntax error...
     */
    safeSync(fn) {
        return (...args) => {
            try {
                return [null, fn(...args)];
            } catch (err) {
                return [err];
            }
        };
    },

    /**
     *  Shorthand for `utils.safeSync()` and `utils.safeAsync()`.
     *  @param {Promise|Function} o  Either a promise or a (sync) function.
     *  @returns {Promise<Array>|Array}  Promise of `[error, result]` if promise
     *  passed. A function that returns `[error, result]` if a (sync) function is
     *  passed.
     */
    safe(o) {
        return utils.isPromise(o)
            ? utils.safeAsync(o)
            : utils.safeSync(o);
    },

    async pmap(list, cb) {
        await Promise.all(list.map(cb));
        return list;
    },

    // --------------------------
    // PARSE UTILS
    // --------------------------

    jsonParseSafe(str) {
        // for json we don't need to use utils.safeSync(),
        // we'll simply return the input string.
        try {
            return JSON.parse(str);
        } catch (ignored) {
            return str;
        }
    },

    // parse() at the bottom

    // --------------------------
    // ARRAY UTILS
    // --------------------------

    ensureArray(value) {
        return !Array.isArray(value)
            ? utils.isset(value) ? [value] : []
            : value;
    },

    normalizeStringArray(list, sep) {
        list = utils.ensureArray(list);
        if (list.length === 0) return list;
        let re;
        if (sep) re = new RegExp('\\s*' + sep + '\\s*');
        return list.reduce((memo, item) => {
            item = utils.isset(item) ? String(item).trim() : null;
            if (item) {
                if (sep) {
                    item.split(re).forEach(ss => {
                        /* istanbul ignore else */
                        if (ss) memo.push(ss);
                    });
                } else {
                    memo.push(item);
                }
            }
            return memo;
        }, []);
    },

    // http://stackoverflow.com/a/6969486/112731
    // _escapeRegExp(str) {
    //     return str.replace(/[-[]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    // }

    splitFirst(str, delim) {
        // since we'll also use delim as regexp for .replace(), it shouldn't have a
        // g (global) flag.
        const re = utils.type(delim) === 'regexp'
            ? new RegExp(delim.source, delim.flags.replace('g', ''))
            : delim;
        const sp = str.split(re);
        const first = sp[0];
        if (sp.length === 1) return [first];
        const rest = str.slice(first.length).replace(re, '');
        return [first, rest];
    },

    // --------------------------
    // OBJECT UTILS
    // --------------------------

    hasOwn(obj, prop) {
        return oproto.hasOwnProperty.call(obj, prop);
    },

    /**
     *  Gets the value of the property, at the specified dot-notation.
     *  @param {Object} obj  Source object.
     *  @param {String} notation  Dot-notation for the property.
     *  @returns {*}  Value of the notated property. `undefined` if not found.
     */
    get(obj, notation) {
        if (utils.type(obj) !== 'object') return undefined;

        const props = !Array.isArray(notation)
            ? notation.split('.')
            : notation;

        const prop = props[0];
        if (!prop) return undefined;

        const o = obj[prop];
        if (props.length > 1) {
            props.shift();
            return utils.get(o, props);
        }
        return o;
    },
    // alias
    notate(obj, notation) {
        return utils.get(obj, notation);
    },

    /**
     *  Sets the give value for the property, at the specified dot-notation.
     *  @param {Object} obj  Source object.
     *  @param {String} notation  Dot-notation for the property.
     *  @param {*} value  Value to be set.
     *  @param {Boolean} [overwrite=true]  Whether to overwrite value if exists.
     *  @returns {Object}  Source object.
     */
    set(obj, notation, value, overwrite = true) {
        if (utils.type(obj) !== 'object') return obj;

        const props = !Array.isArray(notation)
            ? notation.split('.')
            : notation;

        let level = obj;
        props.forEach((note, index) => {
            const last = index === props.length - 1;
            // check if the property is at this level
            if (utils.hasOwn(level, note)) {
                // check if we're at the last level
                if (last) {
                    // if overwrite is set, assign the value.
                    if (overwrite) level[note] = value;
                } else {
                    // if not, just re-reference the current level.
                    level = level[note];
                }
            } else {
                // we don't have this property at this level
                // so; if this is the last level, we set the value
                // if not, we set an empty object for the next level
                level = level[note] = (last ? value : {}); // eslint-disable-line no-multi-assign
            }
        });

        return obj;
    },

    /**
     *  Sets the given notation/value pairs on the given object.
     *  Pairs can be defined using a colon (:) or equal sign (=).
     *  e.g. `"key:value"`, `"key=value"`, `"key.deep:value"`
     *  The value part will be auto-parsed. See `utils.parse()`.
     *  For pairs you can also pass an object, which will not be
     *  parsed since it's already an object.
     *  @param {Object} obj  Object to be processed.
     *  @param {String|Array|Object} pairs  Notation/value pairs as
     *  string or array; or an object.
     *  @param {Boolean} [overwrite=true]  Whether to overwrite the
     *  value when it already exists.
     *  @returns {Object} Modified object.
     */
    setProps(obj, pairs, overwrite = true) {
        if (typeof pairs === 'string' || Array.isArray(pairs)) {
            pairs = utils.normalizeStringArray(pairs, ',');
            pairs.forEach(item => {
                const sp = utils.splitFirst(item.trim(), /\s*[:=]\s*/);
                const notation = sp[0];
                const value = sp[1] || null;
                const [err, parsed] = utils.parseSafe(value);
                utils.set(obj, notation, err ? value : parsed, overwrite);
            });
        } else if (utils.type(pairs) === 'object') {
            Object.keys(pairs).forEach(notation => {
                const value = pairs[notation];
                utils.set(obj, notation, value, overwrite);
            });
        }
        return obj;
    },

    /**
     *  Removes the property with the specified notation, and returns the value of
     *  the removed property.
     *  @param {Object} obj  Source object.
     *  @param {String} notation  Dot-notation for the property to be removed.
     *  @returns {*}  Value of the removed property. `undefined` if not found.
     */
    remove(obj, notation) {
        if (utils.type(obj) !== 'object') return undefined;

        const props = !Array.isArray(notation)
            ? notation.split('.')
            : notation;
        if (props.length === 1) {
            const removed = obj[notation];
            delete obj[notation];
            return removed;
        }

        const last = props.pop();
        const parent = utils.get(obj, props);
        if (utils.type(parent) === 'object') {
            const removed = parent[last];
            delete parent[last];
            return removed;
        }

        return undefined;
    },

    /**
     *  Removes the list of properties with the specified notation list, and returns
     *  the value of the removed property.
     *  @param {Object} obj  Source object.
     *  @param {String|Array} notationList  Dot-notation list for the properties to
     *  be removed.
     *  @returns {Object}  Source object.
     */
    removeProps(obj, notationList) {
        if (utils.type(obj) !== 'object') return obj;
        notationList = utils.normalizeStringArray(notationList, ',');
        if (notationList.length === 0) return obj;
        notationList.forEach(notation => {
            utils.remove(obj, notation);
        });
        return obj;
    },

    /**
     *  Picks out the given list of properties from the source object, if found.
     *  @param {Object} obj  Source object.
     *  @param {Array} keys  Keys to be picked.
     *  @param {Boolean} [ignoreUndefined=false]  Ignore if property is not defined.
     *  @returns {Object}  An object with the found properties.
     */
    pick(obj, keys, ignoreUndefined = false) {
        const o = {};
        keys.forEach(key => {
            // only pick/set if key exists
            const pick = utils.hasOwn(obj, key)
                && (!ignoreUndefined || obj[key] !== undefined);
            if (pick) o[key] = obj[key];
        });
        return o;
    },

    /**
     *  We use yargs for CLI parsing and yargs includes both the option name and
     *  alias in the `argv`. This method will build an options object from `argv`,
     *  by picking properties matching the name or alias of the CLI option defined.
     *  For option `-o` for `--overwrite`, this will pick "overwrite" only.
     *  @param {Object} argv  Yargs argv object.
     *  @param {Object} cmdOptsMeta  Command options object.
     *  @param {Boolean} [ignoreUndefined=false]  Ignore if property is not defined.
     *  @returns {Object}  An object with the found properties.
     */
    pickOptsFromArgv(argv, cmdOptsMeta, ignoreUndefined = false) {
        const o = {};
        Object.keys(cmdOptsMeta).forEach(key => {
            const { alias } = cmdOptsMeta[key];
            let k = typeof alias === 'string'
                ? alias.length > key.length ? alias : key
                : key;
            k = utils.camelCase(k);
            // only pick/set if key exists
            const pick = utils.hasOwn(argv, k)
                && (!ignoreUndefined || argv[k] !== undefined);
            if (pick) o[k] = argv[k];
        });
        return o;
    },

    /**
     *  Sorts the keys of the given object.
     *  @param {Oject} obj  Object to be processed.
     *  @param {Object} [options]  Sort options.
     *      @param {String|Function} [options.comparer="asc"] Comparer to be
     *      used. Pass `"asc"` for ascending, `"desc"` for descending or a
     *      custom comparer function.
     *      @param {Boolean} [options.deep=true]  Whether to sort recursively.
     *      @param {Array} [options.top]  List of keys to be snapped to top.
     *      @param {Array} [options.bototm]  List of keys to be snapped to bottom.
     *  @returns {Object}  A copy of the object with sorted keys.
     */
    sortKeys(obj, options) {
        const opts = {
            comparer: 'asc',
            deep: true,
            top: [],
            bottom: [],
            ...(options || {})
        };
        const comp = opts.comparer === 'asc'
            ? asc
            : (opts.comparer === 'desc' ? desc : opts.comparer);
        const sorted = {};
        const top = Array.isArray(opts.top) ? opts.top : [];
        const bottom = Array.isArray(opts.bottom) ? opts.bottom : [];
        function add(key) {
            sorted[key] = opts.deep && utils.type(obj[key]) === 'object'
                ? utils.sortKeys(obj[key], options)
                : obj[key];
        }
        top.forEach(key => {
            if (utils.hasOwn(obj, key)) add(key);
        });
        Object.keys(obj).sort(comp).forEach(key => {
            if (!top.includes(key) && !bottom.includes(key)) add(key);
        });
        bottom.forEach(key => {
            if (utils.hasOwn(obj, key)) add(key);
        });
        return sorted;
    },

    // --------------------------
    // PROCESS/SHELL UTILS
    // --------------------------

    exec(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) return reject(error);
                return resolve({ stdout, stderr });
            });
        });
    },

    // --------------------------
    // SIZE UTILS
    // --------------------------

    sizeUnits: ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],

    // from https://stackoverflow.com/a/39906526/112731
    formatSize(size) {
        let l = 0;
        let n = parseInt(size, 10) || 0;
        while (n >= 1024 && ++l) n /= 1024;
        return (n.toFixed(n >= 10 || l < 1 ? 0 : 1) + ' ' + utils.sizeUnits[l]);
    },

    async getFileSize(filePath, format = false) {
        const { size } = await fs.stat(filePath);
        return format
            ? utils.formatSize(size)
            : size;
    },

    async getFileGzipSize(filePath, format = false) {
        const size = await gzipSize.file(filePath);
        return format
            ? utils.formatSize(size)
            : size;
    },

    // --------------------------
    // MODULE UTILS
    // --------------------------

    requireSafe(moduleName) {
        try {
            // eslint-disable-next-line global-require
            return require(moduleName);
        } catch (err) {
            return null;
        }
    },

    parentRequireSafe(moduleName) {
        let { parent } = module;
        for (; parent; { parent } = parent) {
            try {
                return parent.require(moduleName);
            } catch (ex) { } // eslint-disable-line no-empty
        }
        return null;
    },

    resolveModule(moduleName, dirPath) {
        try {
            // eslint-disable-next-line global-require
            const mpath = require.resolve(moduleName);
            return dirPath ? path.dirname(mpath) : mpath;
        } catch (err) {
            return null;
        }
    },

    getPackageInfo(moduleName) {
        const pkg = utils.requireSafe(path.join(moduleName, 'package.json'));
        if (pkg) return pkg;
        // maybe moduleName was a file name...
        const p = utils.resolveModule(moduleName);
        // ok. module does not exist!
        if (!p) return null;
        // check the base directory
        return utils.requireSafe(path.join(path.dirname(p), 'package.json'));
    },

    // --------------------------
    // SPECIAL/GLOB UTILS
    // --------------------------

    // helper
    _normalizeBatchItemPaths(item, key = 'src') {
        if (Array.isArray(item)) return { [key]: item };
        if (typeof item === 'string') return { [key]: item.split(srcSep) };
        if (!item[key]) item[key] = [];
        if (typeof item[key] === 'string') item[key] = item[key].split(srcSep);
        return item;
    },

    hasGlob(value) {
        return globby.hasMagic(value);
    },

    ensureSrcArray(src) {
        if (Array.isArray(src)) return src;
        if (typeof src === 'string') {
            return src.split(srcSep);
        }
        return [];
    },

    normalizeBatchItem(item, globalOptions, globalDest) {
        if (!item) throw new Error('Invalid batch item');
        item = utils._normalizeBatchItemPaths(item);
        // items can include options inline with src & dest
        // e.g. { src, dest, overwrite } instead of { src, dest, options: { overrite } }
        const { src, dest, ...itemOpts } = item;
        // separate dest and other global config options
        const { dest: globalOptsDest, ...globalOpts } = globalOptions || {};
        // item options overrides config (global) options
        const options = { ...globalOpts, ...itemOpts };
        // get current working directory if set
        // const cwd = itemOpts.cwd || globalOpts.cwd;
        const destination = dest || globalOptsDest || globalDest;
        return {
            src,
            // each item is passed to a `prepare()` function which already
            // path.resolve's the dest. so we don't do it twice.
            dest: destination, // cwd ? path.resolve(cwd, destination) : destination,
            options
        };
    }

};

// avoid cyclic dependency issue (bec. parser uses other utils methods)
require('./parser')(utils);

module.exports = utils;
