/* eslint max-statements:0, max-statements-per-line:0, no-empty-function:0 */

// core modules

// own modules
const Stats = require('../lib/Stats');

describe('@ocli/core/lib/Stats', () => {

    let stats = new Stats();
    const createTime = Date.now();

    test('base', () => {
        expect(stats.total).toEqual(0);
        expect(stats.completed).toEqual(0);
        expect(typeof stats.startTime).toEqual('number');
        expect(stats.endTime).toEqual(null);
    });

    test('#update()', () => {
        // shoud throw if total is 0 / not set.
        expect(() => stats.update()).toThrow();

        stats.total = -1;
        expect(stats.total).toEqual(0);
        expect(stats.percent).toEqual(0);
        stats.total = 3;
        expect(stats.total).toEqual(3);
        // should not throw after total is set
        expect(() => stats.update()).not.toThrow();
        expect(stats.completed).toEqual(1);
        stats.update(1);
        expect(stats.completed).toEqual(2);
        expect(() => stats.update('')).toThrow();
        expect(() => stats.update(-2)).toThrow();

        // cannot be greater than total
        expect(() => stats.update(5)).toThrow();

        stats.update(1);
        expect(stats.percent).toEqual(1);
    });

    test('#end()', () => {
        expect(Date.now() - createTime).toBeGreaterThan(stats.elapsedTime);

        stats.end();
        expect(stats.endTime).not.toEqual(null);
        // should throw after #end() called
        expect(() => stats.update()).toThrow();

        expect(stats.elapsedTime).toBeGreaterThan(0);

        // should throw when #end() is already called
        expect(() => stats.end()).toThrow();
        // cannot reset total after #end() called
        expect(() => { stats.total = 5; }).toThrow();
    });

    test('#toObject()', () => {
        expect(stats.toObject().percent).toEqual(1);
    });

    test('#toJSON()', () => {
        expect(stats.toJSON()).toEqual(stats.toObject());
    });

    test('#mergeWith()', () => {
        const prevTotal = stats.total;
        stats = stats.mergeWith(new Stats(10));
        expect(stats.total).toEqual(prevTotal + 10);

        stats = new Stats();
        stats = stats.mergeWith(new Stats());
        expect(stats.total).toEqual(0);
    });

    test('.merge()', () => {
        stats = Stats.merge(stats, new Stats(3));
        expect(stats.total).toEqual(3);

        const s = {
            total: 4,
            completed: 2,
            startTime: Date.now(),
            endTime: null,
            elapsedTime: 3.2
        };
        stats = Stats.merge(s, new Stats(1));
        expect(stats.total).toEqual(5);
        stats.update();
        expect(stats.completed).toEqual(3);
    });

});

