class Stats {

    constructor(total = 0) {
        this._ = {
            total: total || 0,
            completed: 0,
            startTime: Date.now(),
            endTime: null
        };
    }

    get total() {
        return this._.total || 0;
    }

    set total(value) {
        if (this.endTime) {
            throw new Error('Cannot set total after Stats#end() is called.');
        }
        this._.total = value < 0 ? 0 : value;
    }

    get completed() {
        return this._.completed;
    }

    get percent() {
        return this.total > 0
            ? this._.completed / this.total
            : 0;
    }

    get startTime() {
        return this._.startTime;
    }

    get endTime() {
        return this._.endTime;
    }

    get elapsedTime() {
        const ms = this.endTime
            ? this.endTime - this.startTime
            : Date.now() - this.startTime;
        return Number((ms / 1000).toFixed(3));
    }

    update(completed = 1) {
        if (this.endTime) {
            throw new Error('Cannot update stats after Stats#end() is called.');
        }
        if (!this.total) {
            throw new Error('Cannot update stats before total is set.');
        }
        if (typeof completed !== 'number' || completed < 1) {
            throw new Error(`Cannot update stats with ${completed}`);
        }
        if (this.completed + completed > this.total) {
            throw new Error('Completed count cannot be greated than total.');
        }
        this._.completed += completed;
        return this;
    }

    end() {
        if (this.endTime) {
            throw new Error('Stats#end() is already called.');
        }
        this._.endTime = Date.now();
        return this;
    }

    toObject() {
        return {
            total: this.total,
            completed: this.completed,
            percent: this.percent,
            startTime: this.startTime,
            endTime: this.endTime,
            elapsedTime: this.elapsedTime
        };
    }

    // never return string from .toJSON() method.
    toJSON() {
        return this.toObject();
    }

    mergeWith(stats) {
        this._ = {
            total: (this.total || 0) + (stats.total || 0),
            completed: (this.completed || 0) + (stats.completed || 0),
            startTime: Math.min(this.startTime, stats.startTime),
            endTime: null
        };
        return this;
    }

    /**
     *  Gets a new instance of `Stats` by merging the paramters of the given
     *  instances. `startTime` will be set to the oldest stats instance's
     *  `startTime`, totals and completeds will be aggregated. Note that you
     *  need to call `#end()` to end the stats; even if both stats are already
     *  ended.
     *  @param {Stats|Object} statsA  First stats instance to merge.
     *  @param {Stats|Object} statsB  Second stats instance to merge.
     *  @returns {Stats} An unended `Stats` instance.
     */
    static merge(statsA, statsB) {
        const a = statsA instanceof Stats
            ? statsA
            : new Stats().mergeWith(statsA);
        return a.mergeWith(statsB);
    }

}

module.exports = Stats;
