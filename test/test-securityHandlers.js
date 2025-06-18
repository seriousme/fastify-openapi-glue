import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);

import securityHandlers from "./security.js";
import { Service } from "./service.js";

const serviceHandlers = new Service();

const noStrict = {
	ajv: {
		customOptions: {
			strict: false,
		},
	},
};

await doTest(
	"v2",
	"./test-swagger.v2.json",
	"./petstore-swagger.v2.json",
	"/v2",
);
await doTest("v3", "./test-openapi.v3.json", "./petstore-openapi.v3.json", "");

async function doTest(version, testSpecName, petStoreSpecName, prefix) {
	const testSpec = await importJSON(testSpecName);
	const petStoreSpec = await importJSON(petStoreSpecName);

	const invalidSecurityOpts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: () => {},
	};

	test(`${version} security handler registration succeeds`, (t, done) => {
		const opts = {
			specification: petStoreSpec,
			serviceHandlers,
			securityHandlers,
		};

		const fastify = Fastify(noStrict);
		fastify.register(fastifyOpenapiGlue, opts);
		fastify.ready((err) => {
			if (err) {
				t.assert.fail("got unexpected error");
			} else {
				t.assert.ok(true, "no unexpected error");
				done();
			}
		});
	});

	test(`${version} security preHandler throws error`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				api_key: securityHandlers.failingAuthCheck,
			},
		};

		const fastify = Fastify();
		fastify.setErrorHandler((err, _req, reply) => {
			t.assert.equal(err.errors.length, 3);
			reply.code(err.statusCode).send(err);
		});
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurity`,
		});
		t.assert.equal(res.statusCode, 401);
		t.assert.equal(res.statusMessage, "Unauthorized");
	});

	test(`${version} security preHandler passes on succes using OR`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				api_key: securityHandlers.failingAuthCheck,
				skipped: securityHandlers.goodAuthCheck,
				failing: securityHandlers.failingAuthCheck,
			},
		};

		const fastify = Fastify();
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurity`,
		});
		t.assert.equal(res.statusCode, 200);
		t.assert.equal(res.statusMessage, "OK");
	});

	test(`${version} security preHandler passes on succes using AND`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				api_key: securityHandlers.goodAuthCheck,
				skipped: securityHandlers.goodAuthCheck,
				failing: securityHandlers.failingAuthCheck,
			},
		};

		const fastify = Fastify();
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurityUsingAnd`,
		});
		t.assert.equal(res.statusCode, 200);
		t.assert.equal(res.statusMessage, "OK");
		t.assert.equal(res.body, '{"response":"Authentication succeeded!"}');
	});

	test(`${version} security preHandler fails correctly on failure using AND`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				api_key: securityHandlers.failingAuthCheck,
				skipped: securityHandlers.goodAuthCheck,
				failing: securityHandlers.failingAuthCheck,
			},
		};

		const fastify = Fastify();
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurityUsingAnd`,
		});
		t.assert.equal(res.statusCode, 401);
		t.assert.equal(res.statusMessage, "Unauthorized");
	});

	test(`${version} security preHandler passes with empty handler`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers,
		};

		const fastify = Fastify();
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurityEmptyHandler`,
		});
		t.assert.equal(res.statusCode, 200);
		t.assert.equal(res.statusMessage, "OK");
	});

	test(`${version} security preHandler handles missing handlers`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				ipa_key: securityHandlers.failingAuthCheck,
			},
		};

		const fastify = Fastify();
		fastify.setErrorHandler((err, _req, reply) => {
			t.assert.equal(err.errors.length, 3);
			reply.code(err.statusCode).send(err);
		});
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurity`,
		});
		t.assert.equal(res.statusCode, 401);
		t.assert.equal(res.statusMessage, "Unauthorized");
	});

	test(`${version} invalid securityHandler definition throws error `, (t, done) => {
		const fastify = Fastify();
		fastify.register(fastifyOpenapiGlue, invalidSecurityOpts);
		fastify.ready((err) => {
			if (err) {
				t.assert.equal(
					err.message,
					"'securityHandlers' parameter must refer to an object",
					"got expected error",
				);
				done();
			} else {
				t.assert.fail("missed expected error");
			}
		});
	});

	if (version !== "v2") {
		test(`${version} initalization of securityHandlers succeeds`, (t, done) => {
			const opts = {
				specification: testSpec,
				serviceHandlers,
				securityHandlers: {
					initialize: async (securitySchemes) => {
						const securitySchemeFromSpec = JSON.stringify(
							testSpec.components.securitySchemes,
						);
						t.assert.equal(
							JSON.stringify(securitySchemes),
							securitySchemeFromSpec,
						);
					},
				},
			};

			const fastify = Fastify();
			fastify.register(fastifyOpenapiGlue, opts);
			fastify.ready((err) => {
				if (err) {
					t.assert.fail("got unexpected error");
				} else {
					t.assert.ok(true, "no unexpected error");
					done();
				}
			});
		});
	}

	test(`${version} security preHandler gets parameters passed`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				api_key: securityHandlers.failingAuthCheck,
				skipped: (req, _repl, param) => {
					req.scope = param[0];
				},
				failing: securityHandlers.failingAuthCheck,
			},
		};

		const fastify = Fastify();
		fastify.register(fastifyOpenapiGlue, opts);

		{
			const res = await fastify.inject({
				method: "GET",
				url: `${prefix}/operationSecurity`,
			});
			t.assert.equal(res.statusCode, 200);
			t.assert.equal(res.statusMessage, "OK");
			t.assert.equal(res.body, '{"response":"authentication succeeded!"}');
		}

		{
			const res = await fastify.inject({
				method: "GET",
				url: `${prefix}/operationSecurityWithParameter`,
			});
			t.assert.equal(res.statusCode, 200);
			t.assert.equal(res.statusMessage, "OK");
			t.assert.equal(res.body, '{"response":"skipped"}');
		}
	});

	test(`${version} security preHandler throws error with custom StatusCode`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				api_key: securityHandlers.failingAuthCheckCustomStatusCode,
			},
		};

		const fastify = Fastify();
		fastify.setErrorHandler((err, _req, reply) => {
			t.assert.equal(err.errors.length, 3);
			reply.code(err.statusCode).send(err);
		});
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurity`,
		});
		t.assert.equal(res.statusCode, 451);
		t.assert.equal(res.statusMessage, "Unavailable For Legal Reasons");
	});

	test(`${version} security preHandler does not throw error when global security handler is overwritten with local empty security`, async (t) => {
		const opts = {
			specification: testSpec,
			serviceHandlers,
			securityHandlers: {
				api_key: securityHandlers.failingAuthCheck,
			},
		};

		const fastify = Fastify();
		fastify.setErrorHandler((err, _req, reply) => {
			t.assert.equal(err.errors.length, 3);
			reply.code(err.statusCode).send(err);
		});
		fastify.register(fastifyOpenapiGlue, opts);

		const res = await fastify.inject({
			method: "GET",
			url: `${prefix}/operationSecurityOverrideWithNoSecurity`,
		});
		t.assert.equal(res.statusCode, 200);
		t.assert.equal(res.statusMessage, "OK");
		t.assert.equal(res.body, '{"response":"authentication succeeded!"}');
	});
}
