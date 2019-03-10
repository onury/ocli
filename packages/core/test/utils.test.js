/* eslint max-statements:0, max-lines-per-function:0, max-statements-per-line:0, no-labels:0 */

const utils = require('../lib/utils');

describe('@ocli/core/lib/utils', () => {

    test('common utils', () => {
        expect(utils.type('')).toEqual('string');
        expect(utils.type({})).toEqual('object');
        expect(utils.type(1)).toEqual('number');
        expect(utils.type([])).toEqual('array');
        expect(utils.type(null)).toEqual('null');

        expect(utils.isset(null)).toEqual(false);
        expect(utils.isset(undefined)).toEqual(false);
        expect(utils.isset('')).toEqual(true);
        expect(utils.isset(false)).toEqual(true);
        expect(utils.isset({})).toEqual(true);
        expect(utils.isset([])).toEqual(true);

        expect(utils.isNumeric('abc')).toEqual(false);
        expect(utils.isNumeric('0123')).toEqual(true);
        expect(utils.isNumeric('1.5')).toEqual(true);
        expect(utils.isNumeric('-99')).toEqual(true);
        expect(utils.isNumeric('f01')).toEqual(false);

        expect(utils.isJsNumeric('Infinity')).toEqual(true);
        expect(utils.isJsNumeric('-Infinity')).toEqual(true);
        expect(utils.isJsNumeric('3.125e7')).toEqual(true);
        expect(utils.isJsNumeric('NaN')).toEqual(false);

        expect(utils.isSceintific('3.125e7')).toEqual(true);
        expect(utils.isSceintific('1.23e+5')).toEqual(true);
        expect(utils.isSceintific('1.23b+5')).toEqual(false);
        expect(utils.isSceintific('1.235')).toEqual(false);

        expect(utils.isOctal('0777')).toEqual(true);
        expect(utils.isOctal('0778')).toEqual(false);
        expect(utils.isOctal('0o123')).toEqual(true);
        expect(utils.isOctal('0o2775')).toEqual(true);
        expect(utils.isOctal('0888')).toEqual(false);

        expect(utils.isHex('0x000')).toEqual(true);
        expect(utils.isHex('9FA')).toEqual(true);
        expect(utils.isHex('9FAZ')).toEqual(false);
        expect(utils.isHex('ff0022')).toEqual(true);

        expect(utils.isBinary('0b01111111100000000000000000000000')).toEqual(true);
        expect(utils.isBinary('0b01')).toEqual(true);
        expect(utils.isBinary('1010100')).toEqual(true);
        expect(utils.isBinary('0b2')).toEqual(false);
        expect(utils.isBinary('-1')).toEqual(false);
        expect(utils.isBinary('0b0')).toEqual(true);
        expect(utils.isBinary('0')).toEqual(true);
        expect(utils.isBinary('0', false)).toEqual(false);

        expect(utils.repeat('-', 0)).toEqual('');
        expect(utils.repeat('-')).toEqual('-');
        expect(utils.repeat('-', 4)).toEqual('----');

        expect(utils.camelCase('a')).toEqual('a');
        expect(utils.camelCase('aB')).toEqual('aB');
        expect(utils.camelCase('ab')).toEqual('ab');
        expect(utils.camelCase('a_b')).toEqual('aB');
        expect(utils.camelCase('camelCase')).toEqual('camelCase');
        expect(utils.camelCase('snake_case')).toEqual('snakeCase');
        expect(utils.camelCase('snake_snake_case')).toEqual('snakeSnakeCase');
        expect(utils.camelCase('PascalCase')).toEqual('pascalCase');
        expect(utils.camelCase('PascalPascalCase')).toEqual('pascalPascalCase');
        expect(utils.camelCase('dash-case')).toEqual('dashCase');
        expect(utils.camelCase('dash-dash-case')).toEqual('dashDashCase');
        expect(utils.camelCase('space case')).toEqual('spaceCase');
        expect(utils.camelCase('space space case')).toEqual('spaceSpaceCase');

        expect(utils.titleCase('a')).toEqual('A');
        expect(utils.titleCase('aB')).toEqual('A B');
        expect(utils.titleCase('ab')).toEqual('Ab');
        expect(utils.titleCase('a_b')).toEqual('A B');
        expect(utils.titleCase('PascalCase')).toEqual('Pascal Case');
        expect(utils.titleCase('snake_snake_case')).toEqual('Snake Snake Case');
        expect(utils.titleCase('dash-dash-case')).toEqual('Dash Dash Case');
        expect(utils.titleCase('space space case')).toEqual('Space Space Case');

        expect(utils.hasSurQuotes('"text" ')).toEqual(true);
        expect(utils.hasSurQuotes(' " text " ')).toEqual(true);
        expect(utils.hasSurQuotes('"text')).toEqual(false);
        expect(utils.hasSurQuotes('text"')).toEqual(false);
        expect(utils.hasSurQuotes('text')).toEqual(false);
        expect(utils.hasSurQuotes('""')).toEqual(true);
        expect(utils.hasSurQuotes('\'x\'')).toEqual(true);
        expect(utils.hasSurQuotes('')).toEqual(false);

        expect(utils.removeSurQuotes('text')).toEqual('text');
        expect(utils.removeSurQuotes('"text"')).toEqual('text');
        expect(utils.removeSurQuotes(' " text"')).toEqual('text');
        expect(utils.removeSurQuotes(' " text " ')).toEqual('text');
        expect(utils.removeSurQuotes(' " " ')).toEqual('');
        expect(utils.removeSurQuotes('')).toEqual('');
    });

    test('promise/fn utils', async () => {
        expect.assertions(14);

        expect(utils.isPromise(Promise.resolve())).toEqual(true);
        expect(utils.isPromise(null)).toEqual(false);
        expect(utils.isPromise(() => true)).toEqual(false);
        expect(utils.isPromise(() => { then: () => true })).toEqual(false); // eslint-disable-line
        expect(utils.isPromise({ then() { return true; } })).toEqual(false); // eslint-disable-line

        let [err, result] = await utils.safe(Promise.resolve(true));
        expect(err).toEqual(null);
        expect(result).toEqual(true);

        [err, result] = await utils.safe(Promise.reject(new Error('rejected')));
        expect(err.message).toEqual('rejected');
        expect(result).toBeUndefined();

        const safeJsonParse = utils.safe(JSON.parse);

        [err, result] = safeJsonParse('{}');
        expect(err).toEqual(null);
        expect(result).toEqual({});

        [err, result] = safeJsonParse('<>');
        expect(err).toEqual(expect.any(Error));
        expect(result).toBeUndefined();

        const delay = v => new Promise(resolve => setTimeout(resolve(v), 10));
        const list = [1, 2, 3];
        expect(await utils.pmap(list, item => delay(item))).toEqual(list);
    });

    test('parse utils', () => {
        expect(utils.jsonParseSafe('{}')).toEqual({});
        expect(utils.jsonParseSafe('{ a: 1 }')).toEqual('{ a: 1 }');
        expect(utils.jsonParseSafe('{ "a": 1 }')).toEqual({ a: 1 });

        expect(utils.parse('true')).toEqual(true);
        expect(utils.parse('false')).toEqual(false);
        expect(utils.parse('null')).toEqual(null);
        expect(utils.parse('undefined')).toEqual(undefined);
        expect(() => utils.parse('Undefined')).toThrow();
        expect(utils.parseSafe('Undefined')[0]).toEqual(expect.any(Error));
        expect(utils.parse('NaN')).toEqual(NaN);
        expect(() => utils.parse('nan')).toThrow();
        expect(utils.parse('Infinity')).toEqual(Infinity);
        expect(() => utils.parse('infinity')).toThrow();
        expect(utils.parse('"text "')).toEqual('text ');
        expect(() => utils.parse('  text  ')).toThrow();
        expect(() => utils.parse('"text')).toThrow();
        expect(utils.parseSafe('"text')[0]).toEqual(expect.any(Error));
        expect(() => utils.parse('\'text')).toThrow();
        expect(utils.parse('{}')).toEqual({});
        expect(() => utils.parse('{}}')).toThrow();
        expect(utils.parse('[]')).toEqual([]);
        expect(() => utils.parse('[]]')).toThrow();
        expect(utils.parse('0o555')).toEqual(365); // octal
        expect(utils.parse('0xfff')).toEqual(4095); // hexadecimal
        expect(utils.parse('0b0101')).toEqual(5); // binary
        expect(utils.parse('1.2')).toEqual(1.2); // float
        expect(utils.parse('0400')).toEqual(400); // int

        expect(utils.parse('text', 'str')).toEqual('text');
        expect(utils.parse('text', 'string')).toEqual('text');
        expect(() => utils.parse('NaN', 'num')).toThrow();
        expect(() => utils.parse('text', 'number')).toThrow();
        expect(() => utils.parse('NaN', 'float')).toThrow();
        expect(() => utils.parse('text', 'float')).toThrow();
        expect(utils.parse('0.1', 'int')).toEqual(0);
        expect(utils.parse('0.2', 'integer')).toEqual(0);
        expect(utils.parse('0.2', 'float')).toEqual(0.2);
        expect(utils.parse('0.2', 'number')).toEqual(0.2);
        expect(utils.parse('1000', 'num')).toEqual(1000);
        expect(utils.parse('Infinity', 'num')).toEqual(Infinity);
        expect(() => utils.parse('Infinity', 'int')).toThrow();
        expect(() => utils.parse('-Infinity', 'integer')).toThrow();
        expect(() => utils.parse('infinity', 'int')).toThrow();
        expect(utils.parse('0', 'bool')).toEqual(false);
        expect(utils.parse('0', 'boolean')).toEqual(false);
        expect(utils.parse('false', 'bool')).toEqual(false);
        expect(utils.parse('false', 'boolean')).toEqual(false);
        expect(utils.parse('null', 'boolean')).toEqual(false);
        expect(utils.parse('undefined', 'bool')).toEqual(false);
        expect(utils.parse('no', 'bool')).toEqual(false);
        expect(utils.parse('1', 'bool')).toEqual(true);
        expect(utils.parse('true', 'boolean')).toEqual(true);
        expect(utils.parse('yes', 'boolean')).toEqual(true);
        expect(utils.parse('123', 'boolean')).toEqual(true);
        expect(utils.parse('011111', 'binary')).toEqual(31);
        expect(utils.parse('0b011111', 'binary')).toEqual(31);
        expect(utils.parse('0b011111', 'bin')).toEqual(31);
        expect(() => utils.parse('0xfff', 'binary')).toThrow();
        expect(() => utils.parse('0b011111', 'octal')).toThrow();
        expect(() => utils.parse('0b011111', 'hex')).not.toThrow(); // valid hex
        expect(() => utils.parse('0o555', 'hex')).toThrow(); // valid hex
        expect(utils.parse('0xfff', 'hex')).toEqual(4095);
        expect(utils.parse('{"a":1}', 'obj')).toEqual({ a: 1 });
        expect(utils.parse('[1,2,3]', 'arr')).toEqual([1, 2, 3]);
        expect(utils.parse('[1,2,3]', 'array')).toEqual([1, 2, 3]);
        expect(() => utils.parse('{}', 'array')).toThrow();
        expect(() => utils.parse('[1,2,3]', 'object')).toThrow();
        expect(utils.parseSafe('[1,2,3]', 'object')[0]).toEqual(expect.any(Error));
        expect(utils.parse('[1,2,3]', 'json')).toEqual([1, 2, 3]);
        expect(() => utils.parse('<>', 'json')).toThrow();
        expect(() => utils.parse('10', 'oops')).toThrow();
        expect(utils.parse('10', 'any')).toEqual(10);
    });

    test('array utils', () => {
        expect(utils.ensureArray([])).toEqual([]);
        expect(utils.ensureArray(1)).toEqual([1]);
        expect(utils.ensureArray(null)).toEqual([]);
        expect(utils.ensureArray(undefined)).toEqual([]);
        expect(utils.ensureArray([1])).toEqual([1]);

        expect(utils.normalizeStringArray([])).toEqual([]);
        expect(utils.normalizeStringArray('str')).toEqual(['str']);
        expect(utils.normalizeStringArray(['str'])).toEqual(['str']);
        expect(utils.normalizeStringArray(['str', null, undefined, 'x', '', '0', 5])).toEqual(['str', 'x', '0', '5']);
        expect(utils.normalizeStringArray(['str,x, y , z'], ',')).toEqual(['str', 'x', 'y', 'z']);

        expect(utils.splitFirst('a:b:c', /:/g)).toEqual(['a', 'b:c']);
        expect(utils.splitFirst('a:b:c', ':')).toEqual(['a', 'b:c']);
        expect(utils.splitFirst('a=b:c', /\s*[:=]\s*/)).toEqual(['a', 'b:c']);
        expect(utils.splitFirst('a = b:c', /\s*[:=]\s*/)).toEqual(['a', 'b:c']);
        expect(utils.splitFirst('a: b=c', /\s*[:=]\s*/)).toEqual(['a', 'b=c']);
        expect(utils.splitFirst('a', ':')).toEqual(['a']);
    });

    test('object utils', () => {
        expect(utils.hasOwn({ a: () => 1 }, 'a')).toEqual(true);
        expect(utils.hasOwn(Number, 'toString')).toEqual(false);

        let o = { a: 1, b: 2, c: undefined, d: { e: 3 } };

        expect(utils.pick(o, ['a', 'c', 'x'])).toEqual({ a: 1, c: undefined });
        expect(utils.pick(o, ['a', 'c'], true)).toEqual({ a: 1 });
        expect(utils.pick(Number, ['toString'])).toEqual({});

        expect(utils.get(o, 'a')).toEqual(1);
        expect(utils.get(o, 'd.e')).toEqual(3);
        expect(utils.notate(o, 'd.e')).toEqual(3); // alias
        expect(utils.get(null, 'x')).toEqual(undefined);
        expect(utils.get(undefined, 'x')).toEqual(undefined);
        expect(utils.get(o, '')).toEqual(undefined);

        o = {};
        expect(utils.set(o, 'y', true).y).toEqual(true);
        expect(utils.set(o, 'a.b', 5).a.b).toEqual(5);
        expect(utils.set(o, 'a.b', null, false).a.b).toEqual(5);
        expect(utils.set(o, 'a.b', null, true).a.b).toEqual(null);
        expect(utils.set(o, ['d', 'e'], 3).d.e).toEqual(3);
        expect(utils.set(null, 'z', 5)).toEqual(null);
        expect(utils.set([], 'z', 5)).toEqual([]);

        expect(utils.setProps({}, 'b:1').b).toEqual(1);
        expect(utils.setProps({}, 'c.d:true').c.d).toEqual(true);
        expect(utils.setProps({}, ['b=1', 'c.d:true'])).toEqual({ b: 1, c: { d: true } });
        expect(utils.setProps({}, ['b =1', 'c.d: true'])).toEqual({ b: 1, c: { d: true } });
        expect(utils.setProps({}, ['b= 1', 'c.d : true'])).toEqual({ b: 1, c: { d: true } });
        expect(utils.setProps({}, 'a:1:2')).toEqual({ a: '1:2' });
        expect(utils.setProps({}, 'a')).toEqual({ a: null });
        expect(utils.setProps({}, 'a:"true"')).toEqual({ a: 'true' });
        expect(utils.setProps({ x: 5 }, { a: 1, b: { c: 2 } })).toEqual({ x: 5, a: 1, b: { c: 2 } });
        expect(utils.setProps(5, 'a:1')).toEqual(5);
        expect(utils.setProps('', 'a:1')).toEqual('');
        expect(utils.setProps({}, 5)).toEqual({});
        expect(utils.setProps({}, null)).toEqual({});

        o = { x: 1, y: { z: 5 }, a: { b: { c: { d: true } } } };
        expect(utils.remove(null, 'x')).toEqual(undefined);
        expect(utils.remove(o, 'y.z')).toEqual(5);
        expect(o.y.z).toBeUndefined();
        expect(utils.remove(o, 'a.b.c')).toEqual({ d: true });
        expect(o.a.b).toEqual({});
        expect(utils.remove(o, ['a', 'b'])).toEqual({});
        expect(o).toEqual({ x: 1, y: {}, a: {} });
        expect(utils.remove({ a: 1 }, 'a.toString')).toEqual(undefined);
        expect(utils.remove(5, 'toString')).toEqual(undefined);
        expect(utils.remove(5, 'toString.name')).toEqual(undefined);

        o = { x: 1, y: { z: 5 }, a: { b: { c: { d: true } } } };
        expect(utils.removeProps(o, ['y', 'a.b'])).toEqual({ x: 1, a: {} });
        expect(utils.removeProps(o, 'x')).toEqual({ a: {} });
        expect(utils.removeProps(o, ['a'])).toEqual({ });
        expect(utils.removeProps(5, 'toString')).toEqual(5);
        expect(utils.removeProps({}, '')).toEqual({});

        const cmdOptsMeta = {
            a: { alias: 'auto' },
            b: {},
            bravo: {},
            foo: { alias: 'f' },
            bar: { alias: 'bar-bar' },
            d: { alias: 'dash-dash' },
            u: { alias: 'undef' }
        };
        const argv = {
            a: true,
            auto: true,
            bravo: 'test',
            foo: false,
            f: false,
            bar: true,
            barBar: true
        };
        let picked = utils.pickOptsFromArgv(argv, cmdOptsMeta);
        expect(picked.a).toBeUndefined();
        expect(picked.auto).toEqual(true);
        expect(picked.bravo).toEqual('test');
        expect(picked.f).toBeUndefined();
        expect(picked.foo).toEqual(false);
        expect(picked.bar).toBeUndefined();
        expect(picked.barBar).toEqual(true);
        expect(picked.d).toBeUndefined();
        expect(picked.dashDash).toBeUndefined();
        expect('dash-dash' in picked).toEqual(false);
        argv.d = true;
        argv.dashDash = true;
        argv.u = undefined;
        argv.undef = undefined;
        picked = utils.pickOptsFromArgv(argv, cmdOptsMeta, false);
        expect(picked.d).toBeUndefined();
        expect(picked.dashDash).toEqual(true);
        expect('u' in picked).toEqual(false);
        expect('undef' in picked).toEqual(true);
        picked = utils.pickOptsFromArgv(argv, cmdOptsMeta, true);
        expect('u' in picked).toEqual(false);
        expect('undef' in picked).toEqual(false);

        // eslint-disable-next-line camelcase
        o = { x: 1, b: 2, f: 3, abc: 4, e_d: 5 };
        expect(Object.keys(o)).toEqual(['x', 'b', 'f', 'abc', 'e_d']);
        // let clone = { ...o };
        expect(Object.keys(utils.sortKeys(o))).toEqual(['abc', 'b', 'e_d', 'f', 'x']);
        expect(Object.keys(utils.sortKeys(o, { comparer: 'desc', top: null, bottom: null }))).toEqual(['x', 'f', 'e_d', 'b', 'abc']);
        const comparer = (a, b) => a === 'x' ? -1 : a.localeCompare(b);
        expect(Object.keys(utils.sortKeys(o, { comparer }))).toEqual(['x', 'abc', 'b', 'e_d', 'f']);
        expect(Object.keys(utils.sortKeys(o, { top: ['x', 'y'], bottom: ['b', 'z'] }))).toEqual(['x', 'abc', 'e_d', 'f', 'b']);
        o.o = { u: 6, r: 7 };
        expect(Object.keys(utils.sortKeys(o, { deep: false }).o)).toEqual(['u', 'r']);
        expect(Object.keys(utils.sortKeys(o, { deep: true }).o)).toEqual(['r', 'u']);
        expect(Object.keys(utils.sortKeys(o).o)).toEqual(['r', 'u']);
    });

    test('process/shell utils', async () => {
        expect.assertions(3);
        expect((await utils.exec('node --version')).stdout).toMatch(/\d+\.\d+\.\d+/);
        await expect(utils.exec('node --oops')).rejects.toThrow();
        await expect(utils.exec('no-command-like-this')).rejects.toThrow();
    });

    test('size utils', async () => {
        expect.assertions(13);
        const filePath = 'packages/test_/package.json';
        expect(utils.formatSize(0)).toEqual('0 bytes');
        expect(utils.formatSize(NaN)).toEqual('0 bytes');
        expect(utils.formatSize(null)).toEqual('0 bytes');
        expect(utils.formatSize(1024)).toEqual('1.0 KB');
        expect(utils.formatSize(Math.pow(1024, 2))).toEqual('1.0 MB');
        expect(utils.formatSize(Math.pow(1024, 3))).toEqual('1.0 GB');
        expect(utils.formatSize(Math.pow(1024, 4))).toEqual('1.0 TB');
        expect(utils.formatSize(Math.pow(1024, 5))).toEqual('1.0 PB');
        const size = await utils.getFileSize(filePath);
        const gzipSize = await utils.getFileGzipSize(filePath);
        expect(size).toBeGreaterThan(500);
        expect(gzipSize).toBeLessThan(500);
        expect(size).toBeGreaterThan(gzipSize);
        const pattern = /^\d+ bytes$/;
        expect(await utils.getFileSize(filePath, true)).toMatch(pattern);
        expect(await utils.getFileGzipSize(filePath, true)).toMatch(pattern);
    });

    test('module utils', () => {
        expect(utils.requireSafe).not.toThrow();
        expect(() => utils.requireSafe('unknown package')).not.toThrow();
        expect(utils.requireSafe('../package.json')).toEqual(expect.any(Object));

        expect(utils.parentRequireSafe).not.toThrow();
        expect(() => utils.parentRequireSafe('unknown package')).not.toThrow();
        expect(utils.parentRequireSafe('../package.json')).toEqual(expect.any(Object));

        expect(utils.resolveModule).not.toThrow();
        expect(() => utils.resolveModule('unknown package')).not.toThrow();
        expect(utils.resolveModule('../package.json')).toEqual(expect.any(String));
        expect(utils.resolveModule('../package.json', true)).not.toContain('package.json');

        expect(utils.getPackageInfo('../package.json')).toEqual(expect.any(Object));
        expect(utils.getPackageInfo('unknown package')).toEqual(null);
        expect(utils.getPackageInfo('jsonc')).toEqual(expect.any(Object));
        expect(utils.getPackageInfo('../node_modules/jsonc/index.js')).toEqual(expect.any(Object));
    });

    test('special/glob utils', () => {
        // below is disabled due to removal of globby in favour of fast-glob
        // expect(utils.hasGlob('')).toEqual(false);
        // expect(utils.hasGlob('path/to/a')).toEqual(false);
        // expect(utils.hasGlob('*')).toEqual(true);
        // expect(utils.hasGlob(['*', '!a'])).toEqual(true);

        expect(utils.ensureSrcArray(['*'])).toEqual(['*']);
        expect(utils.ensureSrcArray('*')).toEqual(['*']);
        expect(utils.ensureSrcArray('test')).toEqual(['test']);
        expect(utils.ensureSrcArray('test,1')).toEqual(['test', '1']);
        expect(utils.ensureSrcArray(null)).toEqual([]);
        expect(utils.ensureSrcArray(1)).toEqual([]);

        const globalOpts = { x: 1, y: true };
        const globalDest = 'path/to/dest';

        let normalize = function (item, opts = globalOpts) {
            return utils.normalizeBatchItem(item, opts, globalDest);
        };

        let item = { src: 'path/to/file' };
        expect(normalize(item).src).toEqual(item.src);
        item = ['path/to/file'];
        expect(normalize(item).src).toEqual(item);
        item = 'path/to/file';
        expect(normalize(item).src).toEqual([item]);
        item = { src: null };
        expect(normalize(item).src).toEqual([]);
        item = null;
        expect(() => normalize(item).src).toThrow();
        expect(normalize('test', null).options).toEqual({});

        // below tests are not taken into account in coverage. even without
        // these, it's 100% ???
        normalize = utils.normalizeBatchItem;
        expect(normalize('test', globalOpts, globalDest).dest).toEqual(globalDest);
        globalOpts.dest = 'dir/';
        expect(normalize('test', globalOpts).dest).toEqual('dir/');
        expect(normalize('test', globalOpts, globalDest).dest).toEqual('dir/');
        expect(normalize({ src: 'test', dest: 'other' }, globalOpts, globalDest).dest).toEqual('other');

        expect(normalize({ src: 'test', dest: 'other' }, globalOpts).options.x).toEqual(1);
        expect(normalize({ src: 'test', dest: 'other', x: 5 }, globalOpts).options.x).toEqual(5);
    });

});
