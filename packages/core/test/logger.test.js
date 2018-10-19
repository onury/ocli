/* eslint max-statements:0 */

// own modules
const Logger = require('../lib/Logger');
const streamLog = require('./helpers/streamLog');

describe('@ocli/core/lib/Logger', () => {

    test('base', () => {
        const log = new Logger();
        expect(log.options.enabled).toEqual(true);
        log.options = null;
        expect(log.options.enabled).toEqual(true);
        log.enabled = false;
        expect(log.enabled).toEqual(false);

        expect(log.verbose).toEqual(false);
        log.verbose = true;
        expect(log.verbose).toEqual(true);
        log.options.verbose = false;
        expect(log.verbose).toEqual(false);
    });

    const str = 'test-stream:';

    test('# methods', async () => {
        expect.assertions(8);
        expect(await streamLog('error', str + 'error')).toMatch(str);
        expect(await streamLog('warn', str + 'warn')).toMatch(str);
        expect(await streamLog('info', str + 'info')).toMatch(str);
        expect(await streamLog('ok', str + 'ok')).toMatch(str);
        expect(await streamLog('title', str + 'title')).toMatch(str);
        expect(await streamLog('title', '')).toMatch('\n');
        expect(await streamLog('data', str + 'data')).toMatch(str);
        expect(await streamLog('empty', str + 'empty')).toMatch('\n');
    });

    test('# methods (enabled = false)', async () => {
        expect.assertions(7);
        const opts = { enabled: false };
        expect(await streamLog('error', str, opts)).toEqual(undefined);
        expect(await streamLog('warn', str, opts)).toEqual(undefined);
        expect(await streamLog('info', str, opts)).toEqual(undefined);
        expect(await streamLog('ok', str, opts)).toEqual(undefined);
        expect(await streamLog('title', str, opts)).toEqual(undefined);
        expect(await streamLog('data', str, opts)).toEqual(undefined);
        expect(await streamLog('empty', str, opts)).toEqual(undefined);
    });

});

