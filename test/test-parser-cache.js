import { readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Parser } from "../lib/Parser.js";

const specFile = new URL("./test-openapi.v3.json", import.meta.url);
const readSpec = () => JSON.parse(readFileSync(specFile, "utf8"));

test("an object parsed twice gives equal results that are separate copies", async (t) => {
	const spec = readSpec();
	const first = await new Parser().parse(spec);
	const second = await new Parser().parse(spec);
	t.assert.deepEqual(second, first, "both parses describe the same routes");
	t.assert.notStrictEqual(second, first, "each caller gets its own result");
	first.routes[0].schema.changedByTheFirstCaller = true;
	const third = await new Parser().parse(spec);
	t.assert.equal(
		third.routes[0].schema.changedByTheFirstCaller,
		undefined,
		"a change to one caller's routes does not reach the next",
	);
});

test("the same object parsed with other options is parsed again", async (t) => {
	const spec = readSpec();
	const plain = await new Parser().parse(spec);
	const withEmpty = await new Parser().parse(spec, { addEmptySchema: true });
	t.assert.notDeepEqual(withEmpty, plain, "the options change the result");
	t.assert.deepEqual(
		await new Parser().parse(spec, { addEmptySchema: true }),
		withEmpty,
		"the same options give the same result again",
	);
});

test("a file is read again on every parse", async (t) => {
	const dir = await mkdtemp(join(tmpdir(), "openapi-glue-"));
	t.after(() => rm(dir, { recursive: true, force: true }));
	const file = join(dir, "spec.json");
	const spec = readSpec();
	writeFileSync(file, JSON.stringify(spec));
	const before = await new Parser().parse(file);
	delete spec.paths[Object.keys(spec.paths)[0]];
	writeFileSync(file, JSON.stringify(spec));
	const after = await new Parser().parse(file);
	t.assert.ok(
		after.routes.length < before.routes.length,
		"the second parse sees the path the file no longer has",
	);
});

test("an object is validated once, however often it is parsed", async (t) => {
	const spec = readSpec();
	const validate = t.mock.method(Parser.prototype, "preProcessSpec");
	await Promise.all([new Parser().parse(spec), new Parser().parse(spec)]);
	await new Parser().parse(spec);
	t.assert.equal(validate.mock.callCount(), 1);
});

test("specification() returns the original after a repeated parse", async (t) => {
	const spec = readSpec();
	const first = new Parser();
	await first.parse(spec);
	const second = new Parser();
	await second.parse(spec);
	t.assert.deepEqual(second.specification(), first.specification());
	t.assert.notStrictEqual(second.specification(), first.specification());
});

test("an invalid object is refused every time it is parsed", async (t) => {
	const invalid = { openapi: "3.0.0" };
	for (const attempt of [1, 2]) {
		await t.assert.rejects(
			new Parser().parse(invalid),
			/must contain a valid specification/,
			`attempt ${attempt} is refused`,
		);
	}
	await t.assert.rejects(
		new Parser().parse(null),
		/must contain a valid specification/,
	);
});
