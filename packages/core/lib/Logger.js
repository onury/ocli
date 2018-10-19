/* eslint no-console:0 */

const Styles = require('./Styles');
const mark = '»';

class Logger {

    constructor(options = {}) {
        this._ = {};
        this._.styles = new Styles();
        this.options = options;
    }

    get options() {
        return this._.options;
    }

    set options(value) {
        this._.options = {
            enabled: true,
            colors: true,
            verbose: false,
            stream: process.stdout,
            streamErr: process.stderr,
            ...(value || {})
        };
        this.styles.enabled = this.options.colors;
    }

    get enabled() {
        return this.options.enabled;
    }

    set enabled(value) {
        this.options.enabled = Boolean(value);
    }

    get verbose() {
        return this.options.verbose;
    }

    set verbose(value) {
        this.options.verbose = Boolean(value);
    }

    /* istanbul ignore next */
    get styles() {
        return this._.styles;
    }

    get stream() {
        return this.options.stream;
    }

    get streamErr() {
        return this.options.streamErr
            /* istanbul ignore next */
            || this.options.stream;
    }

    write(...args) {
        this.stream.write(args.join(' ') + '\n');
    }

    writeErr(...args) {
        this.streamErr.write(args.join(' ') + '\n');
    }

    error(...args) {
        if (!this.enabled) return;
        this.writeErr(this.styles.danger(...args));
    }

    warn(...args) {
        if (!this.enabled) return;
        this.writeErr(this.styles.warn(...args));
    }

    ok(...args) {
        if (!this.enabled) return;
        this.write(this.styles.success(mark, ...args));
    }

    info(...args) {
        if (!this.enabled || !this.options.verbose) return;
        this.write(this.styles.info(mark, ...args));
    }

    title(string) {
        if (!this.enabled || !this.options.verbose) return;
        this.write(this.styles.title(string + '\n'));
    }

    data(...args) {
        if (!this.enabled || !this.options.verbose) return;
        this.write(this.styles.data('  • ', ...args));
    }

    empty() {
        if (!this.enabled || !this.options.verbose) return;
        this.write('');
    }

}

module.exports = Logger;
