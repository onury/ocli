const chalk = require('chalk');
const chalkDisabled = new chalk.constructor({ enabled: false });

class Styles {

    constructor(enabled = true) {
        this._ = {};
        this.enabled = enabled;
    }

    get enabled() {
        return this._.enabled;
    }

    set enabled(value) {
        this._.enabled = Boolean(value);
        this._.chalk = value ? chalk : chalkDisabled;
    }

    get accent() {
        return this._.chalk.cyan.underline.bold;
    }

    get hilight() {
        return this._.chalk.cyan.bold;
    }

    get flash() {
        return this._.chalk.white.bold;
    }

    get opt() {
        return this._.chalk.magenta.bold;
    }

    get title() {
        return this._.chalk.white.underline.bold;
    }

    get subtitle() {
        return this._.chalk.blue.bold;
    }

    get text() {
        return this._.chalk.gray;
    }

    get data() {
        return this._.chalk.gray;
    }

    get warn() {
        return this._.chalk.yellow;
    }

    get danger() {
        return this._.chalk.red;
    }

    get info() {
        return this._.chalk.cyan;
    }

    get success() {
        return this._.chalk.green;
    }

    get hint() {
        return this._.chalk.yellow;
    }

    get link() {
        return this._.chalk.underline.blue;
    }

    get header() {
        return this._.chalk.white;
    }

    get white() {
        return this._.chalk.white;
    }

    get blue() {
        return this._.chalk.blue;
    }

    get faded() {
        return this._.chalk.gray;
    }

    get bold() {
        return this._.chalk.bold;
    }

    get underline() {
        return this._.chalk.underline;
    }

    get newline() {
        // yargs trims out the \n at the end
        return this._.chalk.black('\n_');
    }

}

module.exports = Styles;
