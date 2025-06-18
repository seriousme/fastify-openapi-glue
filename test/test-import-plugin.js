import { test } from "node:test";
import openapiGlue, { fastifyOpenapiGlue } from "../index.js";

test("named import in ESM works", async (t) => {
	t.assert.equal(fastifyOpenapiGlue.fastifyOpenapiGlue !== undefined, true);
});

test("default import in ESM works", async (t) => {
	t.assert.equal(openapiGlue.fastifyOpenapiGlue !== undefined, true);
});
