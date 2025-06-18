const { test } = require("node:test");

test("import in CommonJS works", async (t) => {
	const openapiGlue = await import("../index.js");
	t.assert.equal(openapiGlue.fastifyOpenapiGlue !== undefined, true);
});
