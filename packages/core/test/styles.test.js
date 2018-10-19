/* eslint max-statements:0 */

const Styles = require('../lib/Styles');

describe('@ocli/core/lib/Styles', () => {

    function expectColor(method) {
        const str = 'test';
        expect(method(str)).toMatch(str);
        expect(method(str)).not.toEqual(str);
    }

    function expectNoColor(method) {
        const str = 'test';
        expect(method(str)).toMatch(str);
        expect(method(str)).toEqual(str);
    }

    test('enabled = true', () => {
        const styles = new Styles(false);
        expect(styles.enabled).toEqual(false);
        styles.enabled = true;
        expect(styles.enabled).toEqual(true);
        expectColor(styles.accent);
        expectColor(styles.hilight);
        expectColor(styles.flash);
        expectColor(styles.opt);
        expectColor(styles.subtitle);
        expectColor(styles.text);
        expectColor(styles.hint);
        expectColor(styles.link);
        expectColor(styles.header);
        expectColor(styles.white);
        expectColor(styles.faded);
        expectColor(styles.bold);
        expectColor(styles.underline);
        expectColor(styles.blue);
        expect(styles.newline).toMatch('_');
    });

    test('enabled = false', () => {
        const styles = new Styles(false);
        expectNoColor(styles.accent);
        expectNoColor(styles.hilight);
        expectNoColor(styles.flash);
        expectNoColor(styles.opt);
        expectNoColor(styles.subtitle);
        expectNoColor(styles.text);
        expectNoColor(styles.hint);
        expectNoColor(styles.link);
        expectNoColor(styles.header);
        expectNoColor(styles.white);
        expectNoColor(styles.faded);
        expectNoColor(styles.bold);
        expectNoColor(styles.underline);
        expectNoColor(styles.blue);
        expect(styles.newline).toEqual('\n_');
    });

});
