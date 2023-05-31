import * as fs from 'fs-extra';
import { exec } from 'child_process';
const targz = require('targz');
import * as unzipper from 'unzipper';

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
                if (process.platform === 'darwin') {
                    fs.mkdirpSync(target.toString());
                    exec(`cd ${target} && unzip -qo ${input.toString()}`, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    fs.createReadStream(input)
                        .pipe(unzipper.Extract({ path: target.toString() }))
                        .on('error', reject)
                        .on('close', resolve);
                }
            }
            else {
                reject(`Unsupported extension for '${input}'`);
            }
        });
    }
}