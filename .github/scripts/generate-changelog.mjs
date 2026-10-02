#!/usr/bin/env node
/**
 * generate-changelog.mjs
 *
 * Generates CHANGELOG.md from git log between the previous v* tag and HEAD,
 * sectioned by Conventional Commits prefixes.
 *
 * Usage: node .github/scripts/generate-changelog.mjs
 *
 * Output: CHANGELOG.md written to cwd (repo root).
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// Find the most recent v* tag (the new tag does not exist yet at this point)
let prevTag = '';
try {
	prevTag =
		execSync('git tag --list "v*" --sort=-creatordate', { encoding: 'utf8' })
			.split('\n')
			.map((t) => t.trim())
			.find(Boolean) ?? '';
} catch {
	prevTag = '';
}

console.log(`Comparing changes from ${prevTag || '(none)'} to HEAD`);

// Collect commit subjects
let log = '';
try {
	const range = prevTag ? `${prevTag}..HEAD` : 'HEAD';
	log = execSync(`git log ${range} --pretty='format:%s by **%aN** in %H' -- .`, {
		encoding: 'utf8',
	})
		.split('\n')
		.filter((line) => !/\(runner\)/.test(line))
		.join('\n')
		.trim();
} catch {
	log = '';
}

if (!log && !prevTag) {
	// Fallback: no tags at all yet
	try {
		log = execSync(`git log --reverse --pretty='format:%s by **%aN** in %H' -- .`, {
			encoding: 'utf8',
		})
			.split('\n')
			.filter((line) => !/\(runner\)/.test(line))
			.join('\n')
			.trim();
	} catch {
		log = '';
	}
}

if (!log) {
	log = 'Initial release (first tag)';
}

// Conventional Commits: breaking change = "!" before the colon, e.g. "feat(scope)!: ..."
const BREAKING_RE = /^[a-z]+(\([^)]*\))?!:/;

function formatBreakingSection(lines) {
	const content = lines.filter((l) => BREAKING_RE.test(l));
	if (!content.length) return '';
	return `### ⚠️ Breaking\n${content.join('\n')}\n\n`;
}

function formatSection(lines, pattern, title) {
	const re = new RegExp(pattern, 'i');
	const content = lines.filter((l) => !BREAKING_RE.test(l) && re.test(l));
	if (!content.length) return '';
	return `### ${title}\n${content.join('\n')}\n\n`;
}

function formatOtherSection(lines) {
	const knownPrefixes = /^(feat|feature|fix|test|chore|refactor|internal|ci|docs|deps|dependencies|build)/;
	const content = lines.filter((l) => !BREAKING_RE.test(l) && !knownPrefixes.test(l));
	if (!content.length) return '';
	return `### 🧼 Other Changes\n${content.join('\n')}\n\n`;
}

const lines = log.split('\n');

const changelog = [
	"## What's Changed\n",
	formatBreakingSection(lines),
	formatSection(lines, '^feat|^feature', '🚀 Features'),
	formatSection(lines, '^fix', '🚫 Bugs'),
	formatSection(lines, '^test', '🔎 Tests'),
	formatSection(lines, '^chore|^refactor|^internal|^ci|^docs', '🔧 Maintenance'),
	formatSection(lines, '^deps|^dependencies|^build', '📦 Dependencies'),
	formatOtherSection(lines),
]
	.join('')
	.trimEnd();

writeFileSync('CHANGELOG.md', changelog + '\n', 'utf8');
console.log('Generated CHANGELOG.md');
console.log(changelog);
