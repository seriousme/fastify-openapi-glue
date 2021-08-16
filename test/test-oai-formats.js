const { test } = require("tap");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

test("adding formats to AJV works", (t) => {
  t.plan(1);
  t.doesNotThrow(() => {
    const ajv = new Ajv();
    addFormats(ajv);
  }, "succes");
});

test("byte", (t) => {
  t.plan(5);
  const ajv = new Ajv();
  t.throws(
    () => ajv.compile({ type: "string", format: "byte" }),
    "throws without definition for byte",
  );
  addFormats(ajv);
  const validator = ajv.compile({ type: "string", format: "byte" });
  t.ok(validator("aGVsbG8gd29ybGQ="), "'hello world' encoded in base64");
  t.ok(
    validator(
      `VGhpcyBpcyBhIGJhc2U2NCBtdWx0aWxpbmUgc3RyaW5nIHRoYXQgc3BhbnMgbW9yZSB0aGFuIDc2
IGNoYXJhY3RlcnMgdG8gdGVzdCBtdWx0aWxpbmUgY2FwYWJpbGl0aWVzCg==`,
    ),
    "multiline base64",
  );
  // test again to make sure multiple invocations work
  t.ok(
    validator(
      `VGhpcyBpcyBhIGJhc2U2NCBtdWx0aWxpbmUgc3RyaW5nIHRoYXQgc3BhbnMgbW9yZSB0aGFuIDc2
IGNoYXJhY3RlcnMgdG8gdGVzdCBtdWx0aWxpbmUgY2FwYWJpbGl0aWVzCg==`,
    ),
    "multiline base64",
  );
  t.notOk(validator("aGVsbG8gd29ybG="), "invalid base64");
});

test("int32", (t) => {
  t.plan(5);
  const ajv = new Ajv();
  t.throws(
    () => ajv.compile({ type: "number", format: "int32" }),
    "throws without definition for int32",
  );
  addFormats(ajv);
  const validator = ajv.compile({ type: "number", format: "int32" });
  t.ok(validator(256), "256 ok");
  t.notOk(validator(256.1), "256.1 fails");
  t.notOk(validator(Math.pow(2, 32)), "2^32 fails");
  t.notOk(validator("a"), "'a' fails");
});

test("int64", (t) => {
  t.plan(4);
  const ajv = new Ajv();
  t.throws(
    () => ajv.compile({ type: "number", format: "int64" }),
    "throws without definition for int64",
  );
  addFormats(ajv);
  const validator = ajv.compile({ type: "number", format: "int64" });
  t.ok(validator(256), "256 ok");
  t.notOk(validator(256.1), "256.1 fails");
  t.notOk(validator("a"), "'a' fails");
});

test("float", (t) => {
  t.plan(3);
  const ajv = new Ajv();
  t.throws(
    () => ajv.compile({ type: "number", format: "float" }),
    "throws without definition for float",
  );
  addFormats(ajv);
  const validator = ajv.compile({ type: "number", format: "float" });
  t.ok(validator(256.1), "256.1 ok");
  t.notOk(validator("a"), "'a' fails");
});

test("double", (t) => {
  t.plan(3);
  const ajv = new Ajv();
  t.throws(
    () => ajv.compile({ type: "number", format: "double" }),
    "throws without definition for double",
  );
  addFormats(ajv);
  const validator = ajv.compile({ type: "number", format: "double" });
  t.ok(validator(256.1), "256.1 ok");
  t.notOk(validator("a"), "'a' fails");
});

test("binary", (t) => {
  t.plan(2);
  const ajv = new Ajv();
  t.throws(
    () => ajv.compile({ type: "string", format: "binary" }),
    "throws without definition for binary",
  );
  addFormats(ajv);
  const validator = ajv.compile({ type: "string", format: "binary" });
  t.ok(validator("binary string"), "'binary string' ok");
});

test("password", (t) => {
  t.plan(2);
  const ajv = new Ajv();
  t.throws(
    () => ajv.compile({ type: "string", format: "password" }),
    "throws without definition for password",
  );
  addFormats(ajv);
  const validator = ajv.compile({ type: "string", format: "password" });
  t.ok(validator("password string"), "'password string' ok");
});
