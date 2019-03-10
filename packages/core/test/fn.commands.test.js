/* eslint max-statements:0, max-lines-per-function:0, no-console:0 */

// core modules
// const path = require('path');
const fs = require('fs-extra');

// own modules
const { fn: mkdir } = require('../../core/cli/commands/mkdir');
const { fn: clean } = require('../../core/cli/commands/clean');
const { fn: remove } = require('../../core/cli/commands/remove');
// const { utils } = require('@ocli/core');
const tmp = require('../../../helpers/tmp')(__dirname, 'tmp');

describe('o core commands', () => {

    // const dest = './tmp';

    // TODO: write tests for task and batch operations

    beforeEach(() => {
        // Resets the module registry - the cache of all required modules. This
        // is useful to isolate modules where local state might conflict between
        // tests.
        jest.resetModules();
    });

    afterAll(async () => {
        await tmp.clean();
    });

    test('mkdir', async () => {
        expect.assertions(4);

        try {
            const target = 'packages/core/test/tmp/mydir';
            // never omit second argument or it will be treated as task config.
            const stats = await mkdir(target, {});
            expect(stats.completed).toEqual(1);
            expect(stats.percent).toEqual(1);
            expect(await tmp.exists('mydir')).toEqual(true);

            // re-running the same, should NOT throw when exists
            await expect(mkdir(target, {})).resolves.toBeTruthy();
        } catch (err) {
            console.log(err.stack || err);
        }
    });

    test('mkdir & clean', async () => {
        expect.assertions(10);

        try {
            const target = 'packages/core/test/tmp/mydir';

            // create 3 subdirectories under /mydir
            const promises = [];
            for (let i = 0; i < 3; i++) {
                const dname = 'dir-' + i;
                // never omit second argument or it will be treated as task config.
                promises.push(mkdir(target + '/' + dname, {}));
            }

            // check results (and if dirs are created)
            const results = await Promise.all(promises);
            const eProms = [];
            for (let i = 0; i < 3; i++) {
                expect(results[i].completed).toEqual(1);
                expect(results[i].percent).toEqual(1);
                eProms.push(tmp.exists('mydir/dir-' + i));
            }
            expect(await Promise.all(eProms)).toEqual([true, true, true]);

            // clean subdirs under /mydir
            const cleanResult = await clean(target, {});
            expect(cleanResult.completed).toEqual(1);
            expect(cleanResult.percent).toEqual(1);

            // check if cleaned
            const contents = await fs.readdir(target);
            expect(contents.length).toEqual(0);
        } catch (err) {
            console.log(err.stack || err);
        }
    });

    test('remove', async () => {
        expect.assertions(5);

        try {
            const target = 'packages/core/test/tmp/mydir';
            // never omit second argument or it will be treated as task config.
            const stats = await remove(target, {});
            expect(stats.completed).toEqual(1);
            expect(stats.percent).toEqual(1);
            expect(await tmp.exists('mydir')).toEqual(false);

            // re-running the same, should throw when does not exist
            await expect(remove(target, {})).rejects.toThrow();
            // re-running the same, should NOT throw when forced
            await expect(remove(target, { force: true })).resolves.toBeTruthy();
        } catch (err) {
            console.log(err.stack || err);
        }
    });

});

