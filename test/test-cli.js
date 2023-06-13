import { fileURLToPath, URL } from "url";
import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import { execSync } from "child_process";
import { createRequire } from "module";
import { templateTypes } from "../lib/templates/templateTypes.js";
const importJSON = createRequire(import.meta.url);
const spec = "./test-swagger.v2";
const cli = localFile("../bin/openapi-glue-cli.js");

// if you need new checksums (e.g. because you changed template or spec file)
// run `npm run updateChecksums`

function localFile(fileName) {
	return fileURLToPath(new URL(fileName, import.meta.url));
}

for (const type of templateTypes) {
	const specPath = localFile(`${spec}.json`);
	const checksumFile = localFile(`${spec}.${type}.checksums.json`);
	const project = `generated-${type}-project`;
	const testChecksums = await importJSON(checksumFile);
	await test(`cli ${type} does not error`, (t) => {
		const checksums = JSON.parse(
			execSync(`node ${cli} -c -p ${project} -t ${type} ${specPath}`),
		);
		assert.deepEqual(checksums, testChecksums, "checksums match");
	});

	await test("cli with local plugin", (t) => {
		const result = execSync(
			`node ${cli} -c -l -p ${project} -t ${type} ${specPath}`,
		);
		assert.ok(result);
	});
}

test("cli fails on no spec", (t) => {
	assert.throws(() => execSync(`node ${cli}`));
});

test("cli fails on invalid projectType", (t) => {
	assert.throws(() =>
		execSync(`node ${cli} -c -l ${spec}.json -t nonExistent`),
	);
});

test("cli fails on invalid spec", (t) => {
	assert.throws(() => execSync(`node ${cli} -c nonExistingSpec.json`));
});
