import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import { Generator } from "../lib/generator.js";
import { createRequire } from "module";
import { templateTypes } from "../lib/templates/templateTypes.js";
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const specPath = localFile("./petstore-swagger.v2.json");
const specPath3 = localFile("./petstore-openapi.v3.json");
const projectName = `generated-${templateTypes[0]}-project`;
const dir = localFile("../examples");
const nonExistentDir = localFile("./non-existent-directory");
const spec301 = await importJSON(specPath3);

const checksumOnly = false;
const localPlugin = true;
const noLocalPlugin = false;

const localGenerator = new Generator(checksumOnly, localPlugin);
const generator = new Generator(checksumOnly, noLocalPlugin);

test("generator generates V3.0.0 project without error", async (t) => {
	try {
		await generator.parse(specPath3);
		await generator.generateProject(dir, projectName);
		assert.ok(true, "no error occurred");
	} catch (e) {
		assert.fail(e.message);
	}
});

test("generator generates V3.0.1 project without error", async (t) => {
	spec301["openapi"] = "3.0.1";

	try {
		await generator.parse(spec301);
		await generator.generateProject(dir, projectName);
		assert.ok(true, "no error occurred");
	} catch (e) {
		assert.fail(e.message);
	}
});

test("generator generates project with local plugin without error", async (t) => {
	try {
		await localGenerator.parse(specPath);
		await localGenerator.generateProject(dir, projectName);
		assert.ok(true, "no error occurred");
	} catch (e) {
		assert.fail(e.message);
	}
});

test("generator throws error on non-existent basedir", async (t) => {
	try {
		await generator.parse(specPath);
		await generator.generateProject(nonExistentDir, projectName);
		assert.fail("no error occurred");
	} catch (e) {
		assert.equal(e.code, "ENOENT", "got expected error");
	}
});

// this one needs to be last

for (const type of templateTypes) {
	const project = `generated-${type}-project`;
	const generator = new Generator(checksumOnly, localPlugin);
	await test(`generator generates ${type} project without error`, async (t) => {
		try {
			await generator.parse(specPath);
			await generator.generateProject(dir, project, type);
			assert.ok(true, "no error occurred");
		} catch (e) {
			assert.fail(e.message);
		}
	});
}
