import { fileURLToPath, URL } from "url";
import { test } from "tap";
import { execSync } from "child_process";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
const testChecksums = await importJSON("./test-swagger.v2.checksums.json");
const specPath = localFile("./test-swagger.v2.json");
const cli = localFile("../bin/openapi-glue-cli.js");

function localFile(fileName) {
  return fileURLToPath(new URL(fileName, import.meta.url));
}

test("cli does not error", (t) => {
  t.plan(1);
  const checksums = JSON.parse(execSync(`node ${cli} -c ${specPath}`));
  t.same(checksums, testChecksums, "checksums match");
});

test("cli with local plugin", (t) => {
  t.plan(1);
  const result = execSync(`node ${cli} -c -l ${specPath}`);
  t.ok(result);
});

test("cli fails on no spec", (t) => {
  t.plan(1);
  t.throws(() => execSync(`node ${cli}`));
});

test("cli fails on invalid spec", (t) => {
  t.plan(1);
  t.throws(() => execSync(`node ${cli} -c nonExistingSpec.json`));
});
