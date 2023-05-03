import * as fs from 'fs-extra';
import { exec } from 'child_process';
const targz = require('targz');
const AdmZip = require("adm-zip");

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
                    const zip = new AdmZip(input.toString());
                    zip.extractAllTo(target.toString(), true);
                }
            }
            else {
                reject(`Unsupported extension for '${input}'`);
            }
        });
    }
}