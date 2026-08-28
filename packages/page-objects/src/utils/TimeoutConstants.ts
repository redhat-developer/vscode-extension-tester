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
 * Centralized timeout constants for page-object operations.
 * Components should reference these instead of hardcoding values.
 * Consumers can override by assigning to the mutable fields.
 */
export const TimeoutConstants = {
	/** Default wait for an element to become visible (ms) */
	ELEMENT_VISIBLE: 5_000,
	/** Default wait for an element to become stable (ms) */
	ELEMENT_STABLE: 2_000,
	/** Wait for a menu to appear after context-click (ms) */
	MENU_APPEAR: 2_000,
	/** Wait for a menu item count to stabilize (ms) */
	MENU_STABLE: 1_000,
	/** Wait for an input box to appear (ms) */
	INPUT_APPEAR: 5_000,
	/** Wait for quick open / command palette (ms) */
	QUICK_OPEN: 10_000,
	/** Wait for editor to load (ms) */
	EDITOR_LOAD: 5_000,
	/** Wait for content assist to populate (ms) */
	CONTENT_ASSIST: 10_000,
	/** Wait for a tree section row container (ms) */
	TREE_SECTION: 5_000,
	/** Wait for extension install from marketplace (ms) */
	EXTENSION_INSTALL: 300_000,
	/** Wait for notifications to appear/dismiss (ms) */
	NOTIFICATION: 2_000,
	/** Close all editors timeout (ms) */
	CLOSE_ALL_EDITORS: 60_000,
	/** Wait for dialog / workbench elements (ms) */
	DIALOG: 5_000,
	/** Debug toolbar / breakpoint wait (ms) */
	DEBUG: 10_000,
	/** Webview frame switching (ms) */
	WEBVIEW: 5_000,
	/** Wait for clipboard operations (ms) */
	CLIPBOARD: 2_000,
	/** Default poll interval for condition waits (ms) */
	POLL_INTERVAL: 100,
	/** Default number of stability checks */
	STABILITY_CHECKS: 3,
};
