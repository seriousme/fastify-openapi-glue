import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import { fastifyOpenapiGlue } from "../index.js";
import openapiGlue from "../index.js";

test("named import in ESM works", async (t) => {
	assert.equal(fastifyOpenapiGlue.fastifyOpenapiGlue !== undefined, true);
});

test("default import in ESM works", async (t) => {
	assert.equal(openapiGlue.fastifyOpenapiGlue !== undefined, true);
});
