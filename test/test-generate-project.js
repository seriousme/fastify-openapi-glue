import { test } from "tap";
import { Generator } from "../lib/generator.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const specPath = localFile("./petstore-swagger.v2.json");
const specPath3 = localFile("./petstore-openapi.v3.json");
const projectName = "generatedProject";
const dir = localFile("../examples");
const nonExistentDir = localFile("./non-existent-directory");
const spec301 = await importJSON(specPath3);

const checksumOnly = false;
const localPlugin = true;
const noLocalPlugin = false;

const localGenerator = new Generator(checksumOnly, localPlugin);
const generator = new Generator(checksumOnly, noLocalPlugin);

test("generator generates V3.0.0 project without error", async (t) => {
  t.plan(1);

  try {
    await generator.parse(specPath3);
    await generator.generateProject(dir, projectName);
    t.pass("no error occurred");
  } catch (e) {
    t.fail(e.message);
  }
});

test("generator generates V3.0.1 project without error", async (t) => {
  spec301["openapi"] = "3.0.1";
  t.plan(1);

  try {
    await generator.parse(spec301);
    await generator.generateProject(dir, projectName);
    t.pass("no error occurred");
  } catch (e) {
    t.fail(e.message);
  }
});

test("generator generates project with local plugin without error", async (t) => {
  t.plan(1);

  try {
    await localGenerator.parse(specPath);
    await localGenerator.generateProject(dir, projectName);
    t.pass("no error occurred");
  } catch (e) {
    t.fail(e.message);
  }
});

test("generator throws error on non-existent basedir", async (t) => {
  t.plan(1);

  try {
    await generator.parse(specPath);
    await generator.generateProject(nonExistentDir, projectName);
    t.fail("no error occurred");
  } catch (e) {
    t.equal(e.code, "ENOENT", "got expected error");
  }
});

// this one needs to be last

test("generator generates project without error", async (t) => {
  t.plan(1);
  try {
    await generator.parse(specPath);
    await generator.generateProject(dir, projectName);
    t.pass("no error occurred");
  } catch (e) {
    t.fail(e.message);
  }
});
