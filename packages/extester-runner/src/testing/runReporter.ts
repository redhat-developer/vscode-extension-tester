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

import * as vscode from 'vscode';
import * as path from 'node:path';
import { closeSync, openSync, readdirSync, readSync, statSync } from 'node:fs';
import { Logger } from '../logger/logger';
import { matchesTitles } from '../utils/testGrep';
import type { ResultEvent } from './resultHook';

/** A leaf test of a job, and whether it already has a result. */
export interface Leaf {
	item: vscode.TestItem;
	titles: string[];
	done: boolean;
}

/** Context value of the screenshot message, used by the "Open Screenshot" action of the failure peek. */
export const SCREENSHOT_MESSAGE_CONTEXT = 'extesterRunner.screenshot';

/** Width of the screenshot thumbnail in the failure message, in pixels. */
const THUMBNAIL_WIDTH = 360;

/**
 * Reads the size of a PNG image from its header.
 *
 * @param {string} file - Path of the PNG file.
 * @returns {{ width: number; height: number } | undefined} The size, or `undefined` if the file is not a readable PNG.
 */
export function pngSize(file: string): { width: number; height: number } | undefined {
	let fd: number | undefined;
	try {
		fd = openSync(file, 'r');
		const header = Buffer.alloc(24);
		// The IHDR chunk follows the 8-byte signature: length, type, then width and height.
		if (readSync(fd, header, 0, 24, 0) < 24 || header.toString('ascii', 12, 16) !== 'IHDR') {
			return undefined;
		}
		const width = header.readUInt32BE(16);
		const height = header.readUInt32BE(20);
		return width > 0 && height > 0 ? { width, height } : undefined;
	} catch {
		return undefined;
	} finally {
		if (fd !== undefined) {
			closeSync(fd);
		}
	}
}

/** The "open" link of a screenshot message, with the screenshot URI as its JSON argument. */
const OPEN_LINK = /command:vscode\.open\?([^)"\s]+)/;

/**
 * Finds the screenshot of a message of the failure peek. VS Code passes a copy of the message to
 * the commands of the peek, so the screenshot is read from the message's "open" link.
 *
 * @param {vscode.TestMessage | undefined} message - The test message.
 * @returns {vscode.Uri | undefined} The screenshot file, if the message shows one.
 */
export function screenshotOfMessage(message: vscode.TestMessage | undefined): vscode.Uri | undefined {
	const text = typeof message?.message === 'string' ? message.message : message?.message?.value;
	const link = text ? OPEN_LINK.exec(text) : null;
	if (!link) {
		return undefined;
	}
	try {
		const [uri] = JSON.parse(decodeURIComponent(link[1])) as [vscode.Uri | undefined];
		return uri?.scheme ? vscode.Uri.from(uri) : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Removes the characters that ExTester's `sanitize-filename` removes from screenshot names.
 *
 * @param {string} name - The test title.
 * @returns {string} The file name ExTester uses, without `.png`.
 */
export function screenshotName(name: string): string {
	return trimTrailingDotsAndSpaces(
		name
			.replaceAll(/[/?<>\\:*|"]/g, '')
			.replaceAll(/[\u0000-\u001f\u0080-\u009f]/g, '')
			.replace(/^\.+$/, ''),
	).slice(0, 255);
}

/**
 * Removes trailing dots and spaces, which Windows does not allow at the end of a file name.
 * A loop instead of a regular expression, so a long run of dots and spaces cannot backtrack.
 */
function trimTrailingDotsAndSpaces(name: string): string {
	let end = name.length;
	while (end > 0 && (name[end - 1] === '.' || name[end - 1] === ' ')) {
		end--;
	}
	return name.slice(0, end);
}

/** A stack frame line: `at name (file:line:column)` or `at file:line:column`. */
const STACK_FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/;

/**
 * Converts a JavaScript stack trace to clickable frames, leaving out Node.js internals and dependencies.
 *
 * @param {string} stack - The stack trace.
 * @returns {vscode.TestMessageStackFrame[]} The frames of the user's code.
 */
export function toStackFrames(stack: string): vscode.TestMessageStackFrame[] {
	return stack
		.split('\n')
		.map((line) => STACK_FRAME.exec(line))
		.filter((match): match is RegExpExecArray => match !== null)
		.filter(([, , file]) => path.isAbsolute(file) && !file.includes(`${path.sep}node_modules${path.sep}`))
		.map(
			([, name, file, line, column]) =>
				new vscode.TestMessageStackFrame(name ?? '<anonymous>', vscode.Uri.file(file), new vscode.Position(Number(line) - 1, Number(column) - 1)),
		);
}

/**
 * Turns the events of the result hook into test states, messages and output of one test run.
 *
 * A failure is reported when the next test starts or the run ends, because ExTester takes the
 * screenshot of a failed test in an `afterEach` hook, after Mocha reported the failure.
 */
export class RunReporter {
	private pendingFailures: { leaves: Leaf[]; event: ResultEvent }[] = [];
	private reportedAny = false;

	/**
	 * @param {vscode.TestRun} run - The test run.
	 * @param {Leaf[]} leaves - The leaf tests of the job.
	 * @param {string | undefined} screenshotsRoot - The folder with one screenshot folder per run.
	 * @param {number} startTime - When the job started, to find the screenshot folder of this run.
	 * @param {Logger} logger - The logger instance for logging messages.
	 */
	constructor(
		private readonly run: vscode.TestRun,
		private readonly leaves: Leaf[],
		private readonly screenshotsRoot: string | undefined,
		private readonly startTime: number,
		private readonly logger: Logger,
	) {}

	/** Whether any test reported a state. */
	get hasResults(): boolean {
		return this.reportedAny;
	}

	/**
	 * Shows one event of the results file in the test run.
	 */
	report(event: ResultEvent): void {
		if (event.event === 'output') {
			this.reportOutput(event);
			return;
		}
		if (event.event === 'finished') {
			this.finish();
			return;
		}
		this.reportedAny = true;
		if (event.event === 'started') {
			this.flushFailures();
		}
		if (event.hook) {
			// A failed hook stops the tests of its suite that did not run yet: fail them with the hook's error.
			const failed = this.leaves.filter((leaf) => !leaf.done && matchesTitles(leaf.titles, event.titles, true));
			failed.forEach((leaf) => (leaf.done = true));
			this.pendingFailures.push({ leaves: failed, event });
			return;
		}
		const leaf = this.leaves.find((candidate) => !candidate.done && matchesTitles(candidate.titles, event.titles));
		if (!leaf) {
			this.logger.debug(`Testing view: no test item for "${event.titles.join(' > ')}"`);
			return;
		}
		switch (event.event) {
			case 'started':
				this.run.started(leaf.item);
				break;
			case 'passed':
				leaf.done = true;
				this.run.passed(leaf.item, event.duration);
				break;
			case 'failed':
				leaf.done = true;
				this.pendingFailures.push({ leaves: [leaf], event });
				break;
			case 'skipped':
				leaf.done = true;
				this.run.skipped(leaf.item);
				break;
		}
	}

	/**
	 * Ends the tests that Mocha did not report once it ran all tests, so they do not keep spinning
	 * while the process shuts down, or when it does not exit. Without any reported test, extest most
	 * likely found no test files, so the tests fail with a hint instead.
	 */
	private finish(): void {
		this.flushFailures();
		const notRun = this.leaves.filter((leaf) => !leaf.done);
		const message = this.reportedAny
			? undefined
			: new vscode.TestMessage(
					'Mocha finished without running any of these tests. Check the task terminal: extest may not have found the test files ' +
						'(for compiled tests, check the outputFolder and rootFolder settings), or no test matched the selected title.',
				);
		for (const leaf of notRun) {
			leaf.done = true;
			if (message) {
				this.run.errored(leaf.item, message);
			} else {
				// Not run: filtered out by .only or grep, or reported under a title the parser could not match.
				this.run.skipped(leaf.item);
			}
		}
	}

	/**
	 * Reports the failures that wait for their screenshot. Call it when the run ended.
	 */
	flushFailures(): void {
		const failures = this.pendingFailures;
		this.pendingFailures = [];
		for (const { leaves, event } of failures) {
			const screenshot = this.findScreenshot(event.titles);
			for (const leaf of leaves) {
				const messages = [this.toMessage(event, leaf.item)];
				if (screenshot) {
					messages.push(this.toScreenshotMessage(screenshot, leaf.item));
				}
				this.run.failed(leaf.item, messages, event.duration);
			}
		}
	}

	private reportOutput(event: ResultEvent): void {
		const text = (event.text ?? '').replaceAll(/\r?\n/g, '\r\n');
		if (!text) {
			return;
		}
		const leaf = event.titles.length ? this.leaves.find((candidate) => matchesTitles(candidate.titles, event.titles)) : undefined;
		if (leaf) {
			this.run.appendOutput(text, undefined, leaf.item);
		} else {
			this.run.appendOutput(text);
		}
	}

	private toMessage(event: ResultEvent, item: vscode.TestItem): vscode.TestMessage {
		const error = event.error ?? { message: 'Failed' };
		const hasDiff = error.expected !== undefined && error.actual !== undefined;
		const message = hasDiff ? vscode.TestMessage.diff(error.message, error.expected!, error.actual!) : new vscode.TestMessage(error.message);
		if (item.uri && item.range) {
			message.location = new vscode.Location(item.uri, item.range);
		}
		if (error.stack) {
			message.stackTrace = toStackFrames(error.stack);
		}
		return message;
	}

	private toScreenshotMessage(screenshot: vscode.Uri, item: vscode.TestItem): vscode.TestMessage {
		// Parentheses are encoded too, so a file name such as `a (1).png` does not end the Markdown link.
		const openCommand = `command:vscode.open?${encodeURIComponent(JSON.stringify([screenshot.toJSON()]))
			.replaceAll('(', '%28')
			.replaceAll(')', '%29')}`;
		// A thumbnail that opens the full screenshot when clicked.
		// The height is set up front: the panel sizes the message before the image loads and would cut it to a strip.
		const size = pngSize(screenshot.fsPath) ?? { width: 16, height: 9 };
		const height = Math.round((THUMBNAIL_WIDTH * size.height) / size.width);
		const thumbnail = `<a href="${openCommand}" title="Open screenshot"><img src="${screenshot.toString()}" width="${THUMBNAIL_WIDTH}" height="${height}" alt="Screenshot of the failure"></a>`;
		const markdown = new vscode.MarkdownString(`**Screenshot of the failure** ([open](${openCommand}))\n\n${thumbnail}`);
		markdown.supportHtml = true;
		markdown.isTrusted = { enabledCommands: ['vscode.open'] };
		const message = new vscode.TestMessage(markdown);
		message.contextValue = SCREENSHOT_MESSAGE_CONTEXT;
		if (item.uri && item.range) {
			message.location = new vscode.Location(item.uri, item.range);
		}
		return message;
	}

	/**
	 * Finds the screenshot ExTester took of a failure in this run: in the newest screenshot folder
	 * written since the job started, named after the full title or the title path of the test.
	 */
	private findScreenshot(titles: string[]): vscode.Uri | undefined {
		if (!this.screenshotsRoot) {
			return undefined;
		}
		try {
			const folders = readdirSync(this.screenshotsRoot, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => path.join(this.screenshotsRoot!, entry.name))
				.map((folder) => ({ folder, time: statSync(folder).mtimeMs }))
				.filter(({ time }) => time >= this.startTime)
				.sort((a, b) => b.time - a.time);
			const names = [screenshotName(titles.join(' ')), screenshotName(titles.join('.'))].map((name) => name + '.png');
			for (const { folder } of folders) {
				const file = names.map((name) => path.join(folder, name)).find((candidate) => statSync(candidate, { throwIfNoEntry: false })?.isFile());
				if (file) {
					return vscode.Uri.file(file);
				}
			}
		} catch (error) {
			this.logger.debug(`Testing view: no screenshot for "${titles.join(' > ')}": ${error}`);
		}
		return undefined;
	}
}
