import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import { Generator } from "../lib/generator.js";
import { createRequire } from "module";
import { templateTypes } from "../lib/templates/templateTypes.js";
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;
const dir = localFile(".");
const checksumOnly = true;
const localPlugin = false;

// if you need new checksums (e.g. because you changed template or spec file)
// run `npm run updateChecksums`
const specs = new Set(["./test-swagger.v2", "./test-swagger-noBasePath.v2"]);
for (const type of templateTypes) {
	for (const spec of specs) {
		const specFile = localFile(`${spec}.json`);
		const checksumFile = localFile(`${spec}.${type}.checksums.json`);
		const testChecksums = await importJSON(checksumFile);
		const project = `generated-${type}-project`;
		const generator = new Generator(checksumOnly, localPlugin);
		await test(`generator generates ${type} project data for ${spec}`, async (t) => {
			try {
				await generator.parse(specFile);
				const checksums = await generator.generateProject(dir, project, type);
				assert.deepEqual(checksums, testChecksums, "checksums match");
			} catch (e) {
				assert.fail(e.message);
			}
		});
	}
}
