import * as fs from 'fs-extra';
import { exec } from 'child_process';
import targz from 'targz';

export class Unpack {
    static unpack(input: fs.PathLike, target: fs.PathLike): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.toString().endsWith('.tar.gz')) {
                targz.decompress({
                    src: input.toString(),
                    dest: target.toString()
                }, (err: string | Error | null) => {
                    if(err) {
                        const errWho = err instanceof Error ? err : new Error(err);
                        reject(errWho);
                    } else {
                        resolve()
                    }
                });
            }
            else if (input.toString().endsWith('.zip')) {
                fs.mkdirpSync(target.toString());
                if(process.platform === 'darwin' || process.platform === 'linux') {
                    exec(`cd ${target} && unzip -qo ${input.toString()}`, (err) => {
                        if (err) {
                            reject(new Error(err.message));
                        } else {
                            resolve();
                        }
                    });
                }
                else {
                    exec(`cd ${target} && tar -xvf ${input.toString()}`, (err) => {
                        if (err) {
                            reject(new Error(err.message));
                        } else {
                            resolve();
                        }
                    });
                }
            }
            else {
                reject(`Unsupported extension for '${input}'`);
            }
        });
    }
}