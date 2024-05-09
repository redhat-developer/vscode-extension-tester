/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
                        resolve();
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