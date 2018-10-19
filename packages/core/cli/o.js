#!/usr/bin/env node

/* eslint no-shadow:0, no-console:0, no-param-reassign:0, prefer-destructuring:0, newline-per-chained-call:0, no-unused-expressions:0, max-len:0 */

// dep modules
const yargs = require('yargs');

// own modules
const pkg = require('../package.json');
const registerCommands = require('./register');
const Styles = require('../lib/Styles');
const s = new Styles(true);
const strings = require('./strings')(s);

const repoLink = 'https://github.com/onury/o';
const docsLink = 'https://onury.io/o';
const batchMark = ' (*)';

registerCommands(yargs, { batchMark });

const usage = `\n${s.accent('o')} ${s.white.bold('[command]')} ${s.opt('[options]')}\n\n`
    + `CLI tools for most used operations and development workflows.\n`
    + `Commands that support batch/task operations (with globs), are marked with${batchMark}.\n`
    + `See command help for detailed usage.`;

const info = `${s.subtitle('o')} ${s.hint('repo')} @ ${s.link(repoLink)}\n`
    + `${s.subtitle('o')} ${s.hint('docs')} @ ${s.link(docsLink)}`
    + s.newline;

yargs
    .strict(true)
    .locale('en') // should come before calling updateStrings() if so..
    .updateStrings(strings)
    .usage(usage) // 'Usage: $0 <cmd> [options]'
    .help('h', 'Show this help').alias('h', 'help')
    .version('v', 'Output o/core version', pkg.version).alias('v', 'version')
    .option('V', {
        alias: 'verbose',
        type: 'boolean',
        description: 'Output verbose logs to console',
        global: true
    })
    .option('q', {
        alias: 'quiet',
        type: 'boolean',
        description: 'Disable all operational logs',
        global: true
    })
    .recommendCommands()
    .wrap(80)
    .example(
        `${s.hilight('o <commmand>')} ${s.opt('-h')}`,
        s.faded('Show help for a specific command')
    )
    // .example(`${s.hilight('do [commmand]')} ${s.white('path/to/dir')} ${s.opt('-m')}`)
    .epilog(info)
    .showHelpOnFail(false, s.warn('Run with --help for available options.'))
    .argv;

// console.log(yargs.argv);

// if (yargs.argv.force) {
//     yargs.exitProcess(false);
// }
