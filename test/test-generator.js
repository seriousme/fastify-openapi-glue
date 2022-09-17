import { test } from "tap";
import { Generator } from "../lib/generator.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;
const dir = localFile(".");

// if you need new checksums (e.g. because you changed template or spec file)
// run `npm run updateChecksums`
const testChecksums = await importJSON("./test-swagger.v2.checksums.json");
const specPath = localFile("./test-swagger.v2.json");

const noBasePathChecksums = await importJSON(
  "./test-swagger-noBasePath.v2.checksums.json"
);
const noBasePathSpecPath = await importJSON(
  "./test-swagger-noBasePath.v2.json"
);

const projectName = "generatedProject";

const checksumOnly = true;
const localPlugin = false;

const generator = new Generator(checksumOnly, localPlugin);

test("generator generates data matching checksums", async (t) => {
  t.plan(1);

  try {
    await generator.parse(specPath);
    const checksums = await generator.generateProject(dir, projectName);
    t.same(checksums, testChecksums, "checksums match");
  } catch (e) {
    t.fail(e.message);
  }
});

test("generator generates data matching checksums for swagger without basePath", async (t) => {
  t.plan(1);

  try {
    await generator.parse(noBasePathSpecPath);
    const checksums = await generator.generateProject(dir, projectName);
    t.same(checksums, noBasePathChecksums, "checksums match");
  } catch (e) {
    t.fail(e.message);
  }
});
