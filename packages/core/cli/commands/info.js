/* eslint no-console:0 */

// core modules
const path = require('path');

// dep modules
const { table, getBorderCharacters } = require('table');

// own modules
const Styles = require('../../lib/Styles');
const pkg = require('../../package.json');
const utils = require('../../lib/utils');

// vars
const styles = new Styles(true);
const colWidth = [17, 14, 40];
const borderChar = '-';

function moduleName(name, installed) {
    const s = name.split('/');
    const pre = '• ';
    const col = installed ? 'green' : 'blue';
    return s.length === 2
        ? pre + styles.white(s[0] + '/') + styles.bold[col](s[1])
        : pre + styles.bold[col](s);
}

function moduleRow(name, desc, mPkg) {
    return [
        moduleName(name, Boolean(mPkg)),
        mPkg
            ? styles.success.bold('✓') + ' ' + styles.success(mPkg.version)
            : styles.faded('not installed'),
        styles.white(desc) // mPkg.description or meta.cmd.describe if installed
    ];
}

function getList(modulesMeta) {
    const data = modulesMeta.map(meta => {
        return moduleRow(meta.name, meta.desc, meta.pkg);
    });
    // add core module to top
    data.unshift(moduleRow(pkg.name, pkg.description, pkg));
    // add custom header horizontal borders
    data.unshift([
        utils.repeat(borderChar, colWidth[0]),
        utils.repeat(borderChar, colWidth[1]),
        utils.repeat(borderChar, colWidth[2])
    ]);
    // add columns
    data.unshift([
        styles.header('module'),
        styles.header('version'),
        styles.header('description')
    ]);
    return table(data, {
        columns: {
            0: { width: colWidth[0] },
            1: { width: colWidth[1] },
            2: {
                width: colWidth[2],
                truncate: 50
                // wrapWord: false
            }
        },
        columnDefault: {
            paddingLeft: 0,
            paddingRight: 1
        },
        // we use a single border right under column headers, with our own
        // chars.
        border: getBorderCharacters(`void`),
        drawHorizontalLine() { // (index, size)
            // return index === 1;
            return false;
        }
    });
}

module.exports = modulesMeta => {
    const dl = styles.subtitle.underline('o');

    return {
        command: ['info'],
        describe: 'Output info about installed "o" modules.',
        handler() { // (argv)
            const list = getList(modulesMeta);

            console.log('');
            console.log(dl, styles.flash('command modules:'));
            console.log('');
            console.log(list);

            const p = path.join(__dirname, '../../index.js');
            console.log(dl, styles.flash('core path:'), ' ', utils.resolveModule(p, true));
            // console.log('         ', white('version:'), ' ', pkg.version);
            console.log('');
        }
    };
};
