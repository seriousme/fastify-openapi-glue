const { test } = require("tap");

test("import in CommonJS works", async (t) => {
	const openapiGlue = await import("../index.js");
	assert.equal(openapiGlue.fastifyOpenapiGlue !== undefined, true);
});
