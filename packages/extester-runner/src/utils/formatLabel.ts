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
 * Compact ISO timestamp used by ExTester: `YYYYMMDDTHHmmss` (e.g. `20260803T154330`).
 */
const TIMESTAMP_COMPACT_RE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/;

/**
 * Dash-underscore timestamp format: `YYYY-MM-DD_HH-mm-ss` (e.g. `2026-08-03_15-43-30`).
 */
const TIMESTAMP_DASHED_RE = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})$/;

/**
 * Attempts to parse an ExTester timestamp folder name and returns a human-readable label.
 *
 * Recognises two formats:
 * - Compact ISO:      `YYYYMMDDTHHmmss`     (e.g. `20260803T154330`)
 * - Dash-underscore:  `YYYY-MM-DD_HH-mm-ss` (e.g. `2026-08-03_15-43-30`)
 *
 * The label is formatted using `Date.toLocaleString(undefined, ...)` so the output respects
 * the user's OS locale automatically — no hardcoded language or separators.
 *
 * Returns an object with:
 * - `label`       — locale-formatted date/time string (e.g. `"Aug 3, 2026, 15:43:30"` on en-US)
 * - `description` — the original raw folder name, shown as secondary/dimmed text in the tree row
 *
 * Returns `null` for names that match neither pattern (displayed unchanged).
 *
 * @param name - The folder or file name to format.
 * @returns A `{ label, description }` pair, or `null` if the name is not a recognised timestamp.
 */
export function formatTimestampLabel(name: string): { label: string; description: string } | null {
	const m = TIMESTAMP_COMPACT_RE.exec(name) ?? TIMESTAMP_DASHED_RE.exec(name);
	if (!m) {
		return null;
	}
	const [, year, month, day, hour, min, sec] = m;
	const date = new Date(+year, +month - 1, +day, +hour, +min, +sec);
	// `undefined` locale → JS runtime uses the OS/system locale automatically.
	const label = date.toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});
	return { label, description: name };
}
