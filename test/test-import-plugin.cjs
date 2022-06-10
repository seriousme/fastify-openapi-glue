const { test } = require("tap");


test("import in CommonJS works", async t => {
    t.plan(1);
    const openapiGlue = await import('../index.js');
    t.equal(openapiGlue.fastifyOpenapiGlue !== undefined, true);
});
