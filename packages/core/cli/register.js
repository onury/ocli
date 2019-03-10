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

    // in development/test, @ocli peer dependencies are locally installed by
    // linking: `cd <monorepo-root> && lerna add @ocli/core
    // --scope=@ocli/<moduleName> --dev` but this creates a symlink and when
    // core (this) CLI is run from shell, and it checks for other installed
    // @ocli modules; it cannot find them via e.g.
    // require('@ocli/<moduleName>') bec. the symlinked + shell-run process
    // looks in its own dependency tree. See updateMeta() below.

    function updateMeta(meta) {
        let m;
        let modulePath = meta.name;

        // in production we require the module as "@ocli/<moduleName>"
        m = utils.requireSafe(modulePath);

        // in development/tests, the module path is under packages/ directory.
        // e.g. "@ocli/<moduleName>" should be required from "../../<moduleName>"

        // also; if for example core module (and others) are symlinked
        // sub-modules are not detected/registered. in this case, we'll go up
        // the directory to find sub-modules installed.
        if (!m) {
            // e.g. .../core/cli (__dirname) to ../copy
            const n = meta.name.split('/');
            modulePath = path.join('..', '..', n[n.length - 1]);
            m = utils.requireSafe(modulePath);
        }

        // and package.json as "@ocli/<moduleName>/package.json"
        const pkg = utils.getPackageInfo(modulePath);
        if (pkg && pkg.name !== meta.name) m = null;

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

    registerCoreCommand(require('./commands/copy'));
    registerCoreCommand(require('./commands/mkdir'));
    registerCoreCommand(require('./commands/clean'));
    registerCoreCommand(require('./commands/remove'));
    registerCoreCommand(require('./commands/json'));

    // TODO:
    // yargs.command({
    //     command: ['move [src] [dest]', 'mv'],
    //     describe: 'Move files and directories. (*)'
    // });
    // yargs.command({
    //     command: ['concat [src] [dest]', 'cc'],
    //     describe: 'Concatenate/merge files into one. (*)'
    // });

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
