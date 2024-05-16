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

import { Workbench } from 'vscode-extension-tester';

describe('Sample Command palette tests', () => {
	it('using executeCommand', async () => {
		// the simplest way to execute a command
		// this opens the command palette, puts in the command, and confirms
		await new Workbench().executeCommand('hello world');
	});

	it('using the command prompt', async () => {
		// or you can open the command prompt/palette and work with it as with an input box
		const prompt = await new Workbench().openCommandPrompt();

		// make sure that when executing a command this way you prepend it with a '>' symbol
		// otherwise it is going to try and find a file with the given name
		await prompt.setText('>hello world');
		await prompt.confirm();
	});
});
