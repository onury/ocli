/* eslint no-empty:0, no-param-reassign:0 */

// core modules
const path = require('path');
// dep modules
const fs = require('fs-extra');
// own modules
const Logger = require('../../lib/Logger');

module.exports = (method, msg, opts) => {

    const fpath = path.join(__dirname, '../tmp/log-test.txt');
    let writableStream = fs.createWriteStream(fpath);

    const options = {
        colors: false, // always disable colors for tests
        verbose: true,
        ...(opts || {})
    };
    if (['error', 'warn'].includes(method)) {
        options.streamErr = writableStream;
    } else {
        options.stream = writableStream;
    }
    const logger = new Logger(options);

    return new Promise((resolve, reject) => {
        // eslint-disable-next-line prefer-const
        let readableStream, data;

        function destroy() {
            try {
                if (readableStream) {
                    readableStream.removeAllListeners();
                    readableStream.close();
                    readableStream = null;
                }
                if (writableStream) {
                    writableStream.removeAllListeners();
                    writableStream.close();
                    writableStream = null;
                }
            } catch (err) { }
        }

        /* istanbul ignore next */
        function onError(err) {
            destroy();
            reject(err);
        }

        function onReadbleEnd() {
            destroy();
            setTimeout(() => resolve(data), 300);
        }

        function onWritableReady() {
            logger[method](msg);
            readableStream = fs.createReadStream(fpath)
                .on('error', onError)
                .on('readable', () => {
                    let buffer;
                    // tslint:disable-next-line:no-conditional-assignment
                    while (buffer = readableStream.read()) {
                        data = buffer.toString();
                    }
                    readableStream.on('end', onReadbleEnd);
                });
        }

        // 'ready' event is introduced in Node.js v9.11.0 so we use 'open' event.
        writableStream
            .on('error', onError)
            .on('open', onWritableReady);
    });
};
