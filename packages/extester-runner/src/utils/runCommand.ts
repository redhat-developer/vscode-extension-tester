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

/** Placeholder in the `runCommand` setting for the tests to run. */
export const TARGET_PLACEHOLDER = '${target}';

/**
 * Builds the command line of a custom run command.
 *
 * Each `${target}` in the command is replaced by the quoted path or glob of the tests to run: a test
 * file, a glob of the files in a folder, or a glob of all test files. A command without `${target}`
 * gets the target appended, so `npm run ui-test --` runs the selected tests too.
 *
 * @param {string} command - The configured command, such as `npm run ui-test -- ${target}`.
 * @param {string} target - The path or glob of the tests to run.
 * @returns {string} The command line to run in the shell.
 */
export function buildRunCommand(command: string, target: string): string {
	const quoted = `'${target}'`;
	const trimmed = command.trim();
	return trimmed.includes(TARGET_PLACEHOLDER) ? trimmed.replaceAll(TARGET_PLACEHOLDER, quoted) : `${trimmed} ${quoted}`;
}
