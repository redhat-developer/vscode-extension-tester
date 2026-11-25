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

/**
 * The `NODE_OPTIONS` option that preloads the result hook into the test process.
 *
 * Node.js reads a backslash in a quoted `NODE_OPTIONS` value as an escape character, so a Windows
 * path such as `C:\Users\...` would lose its separators. Node.js accepts forward slashes on Windows too.
 *
 * @param {string} hookPath - Absolute path of the bundled result hook.
 * @returns {string} The `--require` option.
 */
export function hookRequireOption(hookPath: string): string {
	return `--require "${hookPath.replaceAll('\\', '/')}"`;
}

/**
 * The `NODE_OPTIONS` value of the test process: the options the user configured, or else the ones the
 * extension host has, followed by the option that loads the result hook.
 *
 * @param {string} hookOption - The option from {@link hookRequireOption}.
 * @param {string | undefined} configured - `NODE_OPTIONS` from the `extesterRunner.env` setting, if it sets one.
 * @param {string | undefined} inherited - `NODE_OPTIONS` of the extension host.
 * @returns {string} The `NODE_OPTIONS` value.
 */
export function nodeOptionsWithHook(hookOption: string, configured: string | undefined, inherited: string | undefined): string {
	return [configured ?? inherited, hookOption].filter(Boolean).join(' ');
}
