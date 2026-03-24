import { writeText } from 'tinyclip';

/** @returns {Promise<string>} */
async function getInput() {
	return new Promise(async (resolve) => {
		process.stdin.on('data', (chunk) => resolve(chunk.toString().trim()));
	});
}

const text = await getInput();

await writeText(text);
