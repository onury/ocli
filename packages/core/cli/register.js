/* eslint max-len:0, no-process-env:0, global-require:0, no-console:0, no-param-reassign:0, prefer-destructuring:0, newline-per-chained-call:0, max-statements:0 */

// core modules
const path = require('path');

// own modules
const OCLI = require('../lib/OCLI');
const Styles = require('../lib/Styles');
const utils = require('../lib/utils');

// this list should always be updated when new @ocli modules are created.
const modulesMeta = require('./meta.json');

const s = new Styles(true);

module.exports = (yargs, regOpts) => {

    // string to mark commands (in help output) if they support batch/task
    // operations.
    const { batchMark } = regOpts;

    // in development/test, @ocli peer dependencies are locally installed by
    // linking: `cd <monorepo-root> && lerna add @ocli/core
    // --scope=@ocli/<moduleName> --dev` but this creates a symlink and when
    // core (this) CLI is run from shell, and it checks for other installed
    // @ocli modules; it cannot find them via e.g.
    // require('@ocli/<moduleName>') bec. the symlinked + shell-run process
    // looks in its own dependency tree.

    // so we mark the process for ocli development/test by running CLI tests as:
    // NODE_ENV=test node cli/index.js
    // to indicate that it should register modules locally. See updateMeta() below.

    const testMode = process.env.NODE_ENV === 'test';

    function setEpilogue(ocli) {
        const epilogue = `${s.subtitle(ocli.pkgName)} ${s.hint('repo')} @ ${s.link(ocli.repoLink)}\n`
            + `${s.subtitle(ocli.pkgName)} ${s.hint(' docs')} @ ${s.link(ocli.docsLink)}`
            + s.newline;
        const builder = ocli.cmd.builder;
        ocli.cmd.builder = yrgs => {
            builder(yrgs);
            return yrgs.epilog(epilogue);
        };
    }

    function updateMeta(meta) {
        let m, pkg;
        if (testMode) {
            // in development/tests, the module path is under packages/ directory.
            // e.g. "@ocli/<moduleName>" should be required from "../../<moduleName>"
            const n = meta.name.split('/');
            const modulePath = path.join('..', '..', n[n.length - 1]);
            m = utils.requireSafe(modulePath);
            pkg = utils.requireSafe(path.join(modulePath, 'package.json'));
        } else {
            // in production we require the module as "@ocli/<moduleName>"
            m = utils.requireSafe(meta.name);
            // and package.json as "@ocli/<moduleName>/package.json"
            pkg = utils.getPackageInfo(meta.name);
        }

        if (m && pkg) {
            setEpilogue(m);
            meta.cmd = m.cmd;
            if (m.supportsBatchTask) meta.cmd.describe += batchMark;
            meta.installed = true;
            meta.pkg = pkg;
        } else {
            meta.installed = false;
        }
        return meta;
    }

    function registerCoreCommand(m) {
        if (m instanceof OCLI) {
            setEpilogue(m);
            if (m.supportsBatchTask) m.cmd.describe += batchMark;
            return yargs.command(m.cmd);
        }
        return yargs.command(m);
    }

    registerCoreCommand(require('./commands/mkdir'));
    yargs.command({
        command: ['remove [path]', 'rm'],
        describe: 'Remove path(s) recursively. (*)'
    });
    yargs.command({
        command: ['clean [path]', 'cl'],
        describe: 'Clean/empty directories. (*)'
    });
    yargs.command({
        command: ['move [src] [dest]', 'mv'],
        describe: 'Move files and directories. (*)'
    });
    yargs.command({
        command: ['concat [src] [dest]', 'cc'],
        describe: 'Concatenate/merge files into one. (*)'
    });

    // register installed @ocli module commands

    // if they're installed. also re-order by moving installed ones to top, so
    // it's organized when output to command-line.
    const reModulesMeta = [];
    for (let meta of modulesMeta) {
        meta = updateMeta(meta);
        if (meta.cmd) {
            yargs.command(meta.cmd);
            // installed, add to top
            reModulesMeta.unshift(meta);
        } else {
            // not installed, add to bottom
            reModulesMeta.push(meta);
        }
    }

    registerCoreCommand(require('./commands/info')(reModulesMeta));

};
