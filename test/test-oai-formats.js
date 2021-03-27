const t = require("tap");
const Ajv = require("ajv").default;

// AJV misses some validators for byte, float, double, int32 and int64 that oai-formats adds
const oaiFormats = require("../lib/oai-formats");
const test = t.test;


test("adding formats to AJV works", t => {

    t.plan(1);
    t.doesNotThrow(() => new Ajv({ formats: oaiFormats }), "succes");
});


test("byte", t => {
    t.plan(4);
    const ajv = new Ajv();
    t.throws(() => ajv.compile({ type: 'string', format: 'byte' }), "throws without definition for byte")
    ajv.addFormat('byte', oaiFormats.byte);
    const validator = ajv.compile({ type: 'string', format: 'byte' });
    t.ok(validator("aGVsbG8gd29ybGQ="), "'hello world' encoded in base64");
    t.ok(validator(`VGhpcyBpcyBhIGJhc2U2NCBtdWx0aWxpbmUgc3RyaW5nIHRoYXQgc3BhbnMgbW9yZSB0aGFuIDc2
IGNoYXJhY3RlcnMgdG8gdGVzdCBtdWx0aWxpbmUgY2FwYWJpbGl0aWVzCg==`),"multiline base64")
    t.notOk(validator("aGVsbG8gd29ybG="), "invalid base64");
});

test("int32", t => {
    t.plan(5);
    const ajv = new Ajv();
    t.throws(() => ajv.compile({ type: 'number', format: 'int32' }), "throws without definition for int32")
    ajv.addFormat('int32', oaiFormats.int32);
    const validator = ajv.compile({ type: 'number', format: 'int32' });
    t.ok(validator(256), "256 ok");
    t.notOk(validator(256.1), "256.1 fails");
    t.notOk(validator(Math.pow(2, 32)), "2^32 fails");
    t.notOk(validator("a"), "'a' fails");
});

test("int64", t => {
    t.plan(5);
    const ajv = new Ajv();
    t.throws(() => ajv.compile({ type: 'number', format: 'int64' }), "throws without definition for int64")
    ajv.addFormat('int64', oaiFormats.int64);
    const validator = ajv.compile({ type: 'number', format: 'int64' });
    t.ok(validator(256), "256 ok");
    t.notOk(validator(256.1), "256.1 fails");
    t.notOk(validator(Math.pow(2, 64)), "2^64 fails");
    t.notOk(validator("a"), "'a' fails");
});

test("float", t => {
    t.plan(3);
    const ajv = new Ajv();
    t.throws(() => ajv.compile({ type: 'number', format: 'float' }), "throws without definition for float")
    ajv.addFormat('float', oaiFormats.float);
    const validator = ajv.compile({ type: 'number', format: 'float' });
    t.ok(validator(256.1), "256.1 ok");
    t.notOk(validator("a"), "'a' fails");
});

test("double", t => {
    t.plan(3);
    const ajv = new Ajv();
    t.throws(() => ajv.compile({ type: 'number', format: 'double' }), "throws without definition for double")
    ajv.addFormat('double', oaiFormats.double);
    const validator = ajv.compile({ type: 'number', format: 'double' });
    t.ok(validator(256.1), "256.1 ok");
    t.notOk(validator("a"), "'a' fails");
});

test("binary", t => {
    t.plan(2);
    const ajv = new Ajv();
    t.throws(() => ajv.compile({ type: 'string', format: 'binary' }), "throws without definition for binary")
    ajv.addFormat('binary', oaiFormats.binary);
    const validator = ajv.compile({ type: 'string', format: 'binary' });
    t.ok(validator('binary string'), "'binary string' ok");
});

test("password", t => {
    t.plan(2);
    const ajv = new Ajv();
    t.throws(() => ajv.compile({ type: 'string', format: 'password' }), "throws without definition for password")
    ajv.addFormat('password', oaiFormats.password);
    const validator = ajv.compile({ type: 'string', format: 'password' });
    t.ok(validator('password string'), "'password string' ok");
});

