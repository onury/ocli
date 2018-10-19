/* eslint max-statements:0, consistent-return:0, no-param-reassign:0 */

module.exports = utils => {

    function _parseJsonType(str, type) {
        const err = new TypeError(`Cannot parse "${str}" to "${type}"`);
        let result;
        try {
            switch (type) {
                case 'obj':
                case 'object':
                    result = JSON.parse(str);
                    if (utils.type(result) !== 'object') result = undefined;
                    break;
                case 'arr':
                case 'array':
                    result = JSON.parse(str);
                    if (utils.type(result) !== 'array') result = undefined;
                    break;
                case 'json':
                    result = JSON.parse(str);
                    break;
                /* istanbul ignore next */
                default:
                    // nothing
            }
        } catch (ignored) {
            throw err; // our own error
        }

        if (result === undefined) throw err;
        return result;
    }

    function _parseNumeric(str, type) {
        const err = new TypeError(`Cannot parse "${str}" to "${type}"`);
        if (str === 'NaN') throw err;

        let result;
        switch (type) {
            case 'num':
            case 'number':
                if (!utils.isJsNumeric(str)) throw err;
                result = Number(str);
                break;
            case 'float':
                if (!utils.isJsNumeric(str)) throw err;
                result = parseFloat(str);
                break;
            case 'int':
            case 'integer':
                if (!utils.isJsNumeric(str)) throw err;
                result = parseInt(str, 10);
                break;
            case 'octal': {
                if (!utils.isOctal(str, true)) throw err;
                result = parseInt(str.replace(/^0o/i, ''), 8);
                break;
            }
            case 'hex':
            case 'hexadecimal':
                if (!utils.isHex(str, true)) throw err;
                // no need to remove 0x prefix
                result = parseInt(str, 16);
                break;
            case 'bin':
            case 'binary': {
                if (!utils.isBinary(str, true)) throw err;
                result = parseInt(str.replace(/^0b/, ''), 2);
                break;
            }
            /* istanbul ignore next */
            default:
                // nothing
        }

        if (!utils.isInfiniteNumber(result) && !utils.isNumber(result)) {
            throw err;
        }
        return result;
    }

    function _parseBool(str) {
        return (/0|no|false|null|undefined/).test(str)
            ? false
            : Boolean(str);
    }

    function _forceParse(str, type) {
        let result;

        switch (type) {
            case 'str':
            case 'string': // for convenience
                result = str;
                break;
            case 'num':
            case 'number':
            case 'float':
            case 'int':
            case 'integer':
            case 'octal':
            case 'hex':
            case 'hexadecimal':
            case 'bin':
            case 'binary':
                result = _parseNumeric(str, type);
                break;
            case 'bool':
            case 'boolean':
                result = _parseBool(str);
                break;
            case 'obj':
            case 'object':
            case 'arr':
            case 'array':
            case 'json':
                result = _parseJsonType(str, type);
                break;
            default:
                result = undefined;
        }

        if (result === undefined) {
            throw new TypeError(`Cannot parse "${str}" to "${type}"`);
        }
        return result;
    }

    utils.parse = (str, type) => {
        if (typeof str !== 'string') return str;
        str = str.trim();

        if (type && type !== 'any') return _forceParse(str, type);

        // if has surrounding quotes, return as string
        if (utils.hasSurQuotes(str)) return str.slice(1, -1);
        // early return by parsing JSON if starts with `[` or `{ "`
        if ((/^\s*(\[|{\s*"})/).test(str)) return JSON.parse(str);
        // no `type` parameter. auto-parsing...
        if (str === 'null') return null;
        if (str === 'undefined') return undefined;
        if (str === 'true') return true;
        if (str === 'false') return false; // Boolean('false') will return true !!!
        if ((/-?Infinity/).test(str)) return Number(str);
        if (str === 'NaN') return NaN;

        try {
            // try octal
            // 0888 » 888 parsed as decimal
            // 0o888 » "0o888" parsed as string
            // 0777 » parsed as octal, 511 in decimal
            // 0o777 » parsed as octal, 511 in decimal
            if (utils.isOctal(str, false)) return _parseNumeric(str, 'octal');
            // try hexadecimal
            // http://stackoverflow.com/a/13676265
            if (utils.isHex(str, false)) return _parseNumeric(str, 'hexadecimal');
            // try binary
            if (utils.isBinary(str, false)) return _parseNumeric(str, 'binary');
            // try number, float, integer
            if (utils.isJsNumeric(str)) return _parseNumeric(str, 'float');
        } catch (ignored) { } // eslint-disable-line no-empty

        // don't try parsing date and regexp (not needed/implemented)

        // finally try json parse. throws if cannot.
        return JSON.parse(str);
    };

    utils.parseSafe = (str, type) => {
        try {
            return [null, utils.parse(str, type)];
        } catch (err) {
            return [err];
        }
    };

};
