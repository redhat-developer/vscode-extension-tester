import * as fs from 'fs-extra';
import got from 'got';
import { promisify } from 'util';
import stream = require('stream');
import  'global-agent/bootstrap';

export class Download {
    static async getText(uri: string): Promise<string> {
        const body = await got(uri, { headers: { 'user-agent': 'nodejs' } }).text();
        return JSON.parse(body as string)
    }

    static getFile(uri: string, destination: string, progress = false): Promise<void> {
        let lastTick = 0;
        const dlStream = got.stream(uri);
        if (progress) {
            dlStream.on('downloadProgress', ({ transferred, total, percent }) => {
                const currentTime = Date.now();
                if (total > 0 && (lastTick === 0 || transferred === total || currentTime - lastTick >= 2000)) {
                    console.log(`progress: ${transferred}/${total} (${Math.floor(100 * percent)}%)`);
                    lastTick = currentTime;
                }
            });
        }
        const writeStream = fs.createWriteStream(destination);

        return promisify(stream.pipeline)(dlStream, writeStream);
    }
}