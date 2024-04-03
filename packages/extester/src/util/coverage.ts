/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/*---------------------------------------------------------
 * Modified for vscode-extension-tester
 *--------------------------------------------------------*/

import { Report } from 'c8';
import { randomUUID } from 'crypto';
import { promises as fs, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as findUp from 'find-up';

/**
 * Manages collecting coverage data from test runs. All runs, regardless of
 * platform, expect coverage data given in the V8 coverage format. We then
 * use c8 to convert it to the common Istanbul format and represent it with
 * a variety of reporters.
 */
export class Coverage {
  public readonly targetDir = join(tmpdir(), `vsc-coverage-${randomUUID()}`);
  private userOptions: any;

  constructor() {
    mkdirSync(this.targetDir, { recursive: true });

    // Read nyc/c8 JSON configuration file for reading user-defined coverage report options.
    const config = findUp.sync(['.c8rc', '.c8rc.json', '.nycrc', '.nycrc.json'])
    if (config) {
      try {
        const json = readFileSync(config).toString();
        this.userOptions = JSON.parse(json);
      } catch (err) {
        console.error(`An error was found in reading coverage configuration from ${config}`);
        throw err;
      }
    }
  }

  public async write() {
    const reportOptions: any = {
      "reporter": ["text", "html"],
      "all": false,
      "excludeNodeModules": true,
      "include": [],
      "exclude": [
          "coverage/**",
          "packages/*/test{,s}/**",
          "**/*.d.ts",
          "test{,s}/**",
          "test{,-*}.{js,cjs,mjs,ts,tsx,jsx}",
          "**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}",
          "**/__tests__/**",
          "**/{ava,babel,nyc}.config.{js,cjs,mjs}",
          "**/jest.config.{js,cjs,mjs,ts}",
          "**/{karma,rollup,webpack}.config.js",
          "**/.{eslint,mocha}rc.{js,cjs}"
      ],
      "extension": [
          ".js",
          ".cjs",
          ".mjs",
          ".ts",
          ".tsx",
          ".jsx"
      ],
      "excludeAfterRemap": false,
      "skipFull": false,
      "tempDirectory": this.targetDir,
      "resolve": "",
      "omitRelative": true,
      "allowExternal": false,    
    };

    if (this.userOptions) {
      Object.assign(reportOptions, this.userOptions);
      // These two options require special treatments.
      ["report-dir", "reports-dir"].forEach(key => {
        if (this.userOptions[key]) {
          reportOptions["reportsDirectory"] = this.userOptions[key];
        }
      })
    }

    try {
      const report = new Report(reportOptions);

      // A hacky fix due to an outstanding bug in Istanbul's exclusion testing
      // code: its subdirectory checks are case-sensitive on Windows, but file
      // URIs might have mixed casing.
      //
      // Setting `relativePath: false` on the exclude bypasses this code path.
      //
      // https://github.com/istanbuljs/test-exclude/issues/43
      // https://github.com/istanbuljs/test-exclude/blob/a5b1d07584109f5f553ccef97de64c6cbfca4764/index.js#L91
      (report as any).exclude.relativePath = false;

      await report.run();
    } catch (e) {
      // throw new CliExpectedError(
      throw new Error(
        `Coverage report generated failed, please file an issue with original reports located in ${this.targetDir}:\n\n${e}`,
      );
    }

    await fs.rm(this.targetDir, { recursive: true, force: true });
  }
}
