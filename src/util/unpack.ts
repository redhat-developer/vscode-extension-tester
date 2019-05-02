import * as fs from 'fs-extra';
const targz = require('targz');
const unzip = require('unzip-stream');

export class Unpack {
    static unpack(input: fs.PathLike, target: fs.PathLike): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.toString().endsWith('.tar.gz')) {
                targz.decompress({
                    src: input,
                    dest: target
                }, (err: Error) => {
                    err ? reject(err) : resolve();
                });
            }
            else if (input.toString().endsWith('.zip')) {
                fs.createReadStream(input)
                    .pipe(unzip.Extract({ path: target }))
                    .on('error', reject)
                    .on('close', resolve);
            }
            else {
                reject(`Unsupported extension for '${input}'`);
            }
        });
    }
}