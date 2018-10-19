const path = require('path');
const fs = require('fs-extra');

const tmp = (dir, tmpDirName = 'tmp') => {
    const h = {
        tmpDir: path.join(dir, tmpDirName),

        pathTo(file) {
            return path.join(h.tmpDir, file);
        },

        exists(p) {
            return fs.pathExists(h.pathTo(p));
        },

        clean(target = '') {
            const p = target ? path.join(h.tmpDir, target) : h.tmpDir;
            return fs.emptyDir(p);
        },

        remove(target = '') {
            const p = target ? path.join(h.tmpDir, target) : h.tmpDir;
            return fs.remove(p);
        }
    };

    return h;
};

module.exports = tmp;
