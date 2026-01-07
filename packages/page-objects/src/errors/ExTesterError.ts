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
 * Context information for debugging ExTester errors.
 */
export interface ErrorContext {
	/** Name of the page object component (e.g., "TextEditor", "ActivityBar") */
	component?: string;
	/** The action being performed when the error occurred */
	action?: string;
	/** VS Code version being tested */
	vscodeVersion?: string;
	/** String representation of the locator used */
	locator?: string;
	/** Additional details about the element or operation */
	details?: string;
	/** The original error that caused this error, if any */
	cause?: Error;
}

/**
 * Base error class for all ExTester-specific errors.
 * Provides rich context for debugging test failures.
 */
export class ExTesterError extends Error {
	public readonly context: ErrorContext;
	public readonly timestamp: Date;

	constructor(message: string, context: ErrorContext = {}) {
		super(message);
		this.name = 'ExTesterError';
		this.context = context;
		this.timestamp = new Date();

		// Maintain proper stack trace in V8 environments
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Get a detailed string representation of the error for logging.
	 */
	toDetailedString(): string {
		const lines = [`${this.name}: ${this.message}`, `  Timestamp: ${this.timestamp.toISOString()}`];

		if (this.context.component) {
			lines.push(`  Component: ${this.context.component}`);
		}
		if (this.context.action) {
			lines.push(`  Action: ${this.context.action}`);
		}
		if (this.context.vscodeVersion) {
			lines.push(`  VS Code Version: ${this.context.vscodeVersion}`);
		}
		if (this.context.locator) {
			lines.push(`  Locator: ${this.context.locator}`);
		}
		if (this.context.details) {
			lines.push(`  Details: ${this.context.details}`);
		}
		if (this.context.cause) {
			lines.push(`  Caused by: ${this.context.cause.name}: ${this.context.cause.message}`);
		}

		return lines.join('\n');
	}

	override toString(): string {
		return this.toDetailedString();
	}
}

/**
 * Error thrown when an element cannot be found in the DOM.
 */
export class ElementNotFoundError extends ExTesterError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'ElementNotFoundError';
	}
}

/**
 * Error thrown when an element exists but is not visible.
 */
export class ElementNotVisibleError extends ExTesterError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'ElementNotVisibleError';
	}
}

/**
 * Error thrown when an element cannot be interacted with (e.g., blocked, disabled).
 */
export class ElementNotInteractableError extends ExTesterError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'ElementNotInteractableError';
	}
}

/**
 * Error thrown when an element reference has become stale (DOM was modified).
 */
export class StaleElementError extends ExTesterError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'StaleElementError';
	}
}

/**
 * Error thrown when element recovery/reinitialization fails.
 */
export class ElementRecoveryError extends ExTesterError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'ElementRecoveryError';
	}
}

/**
 * Error thrown when a timeout occurs waiting for a condition.
 */
export class TimeoutError extends ExTesterError {
	public readonly timeoutMs: number;

	constructor(message: string, timeoutMs: number, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'TimeoutError';
		this.timeoutMs = timeoutMs;
	}

	override toDetailedString(): string {
		const base = super.toDetailedString();
		return `${base}\n  Timeout: ${this.timeoutMs}ms`;
	}
}

/**
 * Error thrown when a locator fails to match any elements.
 */
export class LocatorError extends ExTesterError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'LocatorError';
	}
}

/**
 * Error thrown for platform-specific limitations (e.g., macOS native dialogs).
 */
export class PlatformNotSupportedError extends ExTesterError {
	public readonly platform: string;

	constructor(message: string, platform: string = process.platform, context: ErrorContext = {}) {
		super(message, context);
		this.name = 'PlatformNotSupportedError';
		this.platform = platform;
	}

	override toDetailedString(): string {
		const base = super.toDetailedString();
		return `${base}\n  Platform: ${this.platform}`;
	}
}

/**
 * Error thrown when an operation is not supported for the current VS Code version.
 */
export class VersionNotSupportedError extends ExTesterError {
	public readonly requiredVersion: string;
	public readonly currentVersion: string;

	constructor(message: string, requiredVersion: string, currentVersion: string, context: ErrorContext = {}) {
		super(message, { ...context, vscodeVersion: currentVersion });
		this.name = 'VersionNotSupportedError';
		this.requiredVersion = requiredVersion;
		this.currentVersion = currentVersion;
	}

	override toDetailedString(): string {
		const base = super.toDetailedString();
		return `${base}\n  Required Version: ${this.requiredVersion}`;
	}
}

/**
 * Utility to wrap native Selenium errors with ExTester context.
 */
export function wrapError(originalError: Error, context: ErrorContext): ExTesterError {
	const message = originalError.message;

	if (originalError.name === 'StaleElementReferenceError') {
		return new StaleElementError(message, { ...context, cause: originalError });
	}

	if (originalError.name === 'NoSuchElementError') {
		return new ElementNotFoundError(message, { ...context, cause: originalError });
	}

	if (originalError.name === 'ElementNotInteractableError' || originalError.name === 'ElementClickInterceptedError') {
		return new ElementNotInteractableError(message, { ...context, cause: originalError });
	}

	if (originalError.name === 'ElementNotVisibleError') {
		return new ElementNotVisibleError(message, { ...context, cause: originalError });
	}

	if (originalError.name === 'TimeoutError') {
		return new TimeoutError(message, 0, { ...context, cause: originalError });
	}

	// Generic fallback
	return new ExTesterError(message, { ...context, cause: originalError });
}
