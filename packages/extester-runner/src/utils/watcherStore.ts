/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';

const stores = new WeakMap<vscode.ExtensionContext, Map<string, vscode.Disposable[]>>();

/** Replace a watcher group without accumulating disposed watchers in the extension context. */
export function replaceWatchers(context: vscode.ExtensionContext, key: string, create: () => vscode.Disposable[]): void {
	let store = stores.get(context);
	if (!store) {
		store = new Map();
		stores.set(context, store);
		const owned = store;
		context.subscriptions.push(
			new vscode.Disposable(() => {
				for (const group of owned.values()) {
					group.forEach((item) => item.dispose());
				}
				owned.clear();
				stores.delete(context);
			}),
		);
	}
	store.get(key)?.forEach((item) => item.dispose());
	store.delete(key);
	store.set(key, create());
}
