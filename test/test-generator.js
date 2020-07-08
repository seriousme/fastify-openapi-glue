const t = require("tap");
const test = t.test;

const path = require("path");
const Generator = require("../lib/generator");

// if you need new checksums (e.g. because you changed template or swaggerfile)
// run `node ..\generator.js -c test-swagger.v2.json > test-swagger.v2.checksums.json`
const testChecksums = require("./test-swagger.v2.checksums.json");
const specPath = path.join(__dirname, "test-swagger.v2.json");

// run `node ..\generator.js -c test-swagger-noBasePath.v2.json > test-swagger-noBasePath.v2.checksums.json`
const noBasePathChecksums = require("./test-swagger-noBasePath.v2.checksums.json");
const noBasePathSpecPath = require("./test-swagger-noBasePath.v2.json");

const projectName = "generatedProject";
const dir = __dirname;
const checksumOnly = true;
const localPlugin = false;

const generator = new Generator(checksumOnly, localPlugin);

test("generator generates data matching checksums", t => {
  t.plan(1);

  generator
    .parse(specPath)
    .then(_ => {
      const checksums = generator.generateProject(dir, projectName);

      t.same(checksums, testChecksums, "checksums match");
    })
    .catch(e => t.fail(e.message));
});

test("generator generates data matching checksums for swagger without basePath", t => {
  t.plan(1);

  generator
    .parse(noBasePathSpecPath)
    .then(_ => {
      const checksums = generator.generateProject(dir, projectName);
      t.same(checksums, noBasePathChecksums, "checksums match");
    })
    .catch(e => t.fail(e.message));
});
