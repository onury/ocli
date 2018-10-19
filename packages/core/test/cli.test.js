/* eslint max-statements:0, max-statements-per-line:0, no-empty-function:0 */

// core modules
const path = require('path');

// own modules
const pkg = require('../package.json');
const { exec } = require('../lib/utils');

describe('@ocli/core/cli', () => {

    const cliPath = path.join(__dirname, '../cli/o');

    // important: in dev tests, NODE_ENV=test should be set like below.
    // see cli/register.js code & docs for reasoning.
    function cli(command) {
        const cmd = 'NODE_ENV=test node "' + cliPath + '" ' + command;
        return exec(cmd);
    }

    test('core commands', async () => {
        expect.assertions(9);

        expect((await cli('-h')).stdout).toMatch('https://github.com/onury');
        expect((await cli('--help')).stdout).toMatch('https://github.com/onury');
        expect((await cli('-v')).stdout).toMatch(pkg.version);
        expect((await cli('--version')).stdout).toMatch(pkg.version);
        const info = (await cli('info')).stdout;
        expect(info).toMatch('@ocli/core');
        expect(info).toMatch('@ocli/copy');
        expect(info).toMatch('@ocli/json');
        expect(info).toMatch('@ocli/html');
        expect(info).toMatch('@ocli/repack');
    });

});

