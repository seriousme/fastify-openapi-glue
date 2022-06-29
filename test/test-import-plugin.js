import { test } from "tap";
import { fastifyOpenapiGlue } from "../index.js";
import openapiGlue from "../index.js";

test("named import in ESM works", async (t) => {
  t.plan(1);
  t.equal(fastifyOpenapiGlue.fastifyOpenapiGlue !== undefined, true);
});

test("default import in ESM works", async (t) => {
  t.plan(1);
  t.equal(openapiGlue.fastifyOpenapiGlue !== undefined, true);
});
