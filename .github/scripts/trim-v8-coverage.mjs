/**
 * Trims raw NODE_V8_COVERAGE dumps down to the scripts that live under
 * <workspace>/packages/. Every Node process spawned during a UI test run
 * (npm, the ExTester runner, the VS Code CLI, VS Code itself and its
 * extension host) writes a dump that mostly describes Node builtins and
 * VS Code internals; only the framework code is wanted in the report, and
 * shipping the rest as CI artifacts is pure cost.
 *
 * Usage: node trim-v8-coverage.mjs <dump-dir> <workspace-dir>
 */
import { readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [dumpDir, workspaceDir] = process.argv.slice(2);
if (!dumpDir || !workspaceDir) {
	console.error('usage: trim-v8-coverage.mjs <dump-dir> <workspace-dir>');
	process.exit(2);
}

// V8 records real paths, so resolve symlinks the same way before comparing.
const prefix = `${pathToFileURL(realpathSync(resolve(workspaceDir))).href}/packages/`;
let files = 0;
let kept = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for (const name of readdirSync(dumpDir)) {
	if (!name.endsWith('.json')) {
		continue;
	}
	const file = join(dumpDir, name);
	files++;
	bytesBefore += statSync(file).size;
	let dump;
	try {
		dump = JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		// A process that died mid-write leaves a truncated file; c8 would skip it too.
		rmSync(file);
		continue;
	}
	const result = (dump.result ?? []).filter((script) => typeof script.url === 'string' && script.url.startsWith(prefix));
	if (result.length === 0) {
		rmSync(file);
		continue;
	}
	const trimmed = { result };
	if (dump['source-map-cache']) {
		trimmed['source-map-cache'] = Object.fromEntries(Object.entries(dump['source-map-cache']).filter(([url]) => url.startsWith(prefix)));
	}
	const json = JSON.stringify(trimmed);
	writeFileSync(file, json);
	kept++;
	bytesAfter += Buffer.byteLength(json);
}

const mb = (n) => (n / 1048576).toFixed(2);
console.log(`trim-v8-coverage: kept ${kept} of ${files} dump files, ${mb(bytesBefore)} MB -> ${mb(bytesAfter)} MB (prefix ${prefix})`);
