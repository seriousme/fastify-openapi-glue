import { strict as assert } from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi.v3.json");
const petStoreSpec = await importJSON("./petstore-openapi.v3.json");
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

const invalidSecurityOpts = {
	specification: testSpec,
	serviceHandlers,
	securityHandlers: () => {},
};

test("security handler registration succeeds", (t, done) => {
	const opts = {
		specification: petStoreSpec,
		serviceHandlers,
		securityHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("security preHandler throws error", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			api_key: securityHandlers.failingAuthCheck,
		},
	};

	const fastify = Fastify();
	fastify.setErrorHandler((err, req, reply) => {
		assert.equal(err.errors.length, 3);
		reply.code(err.statusCode).send(err);
	});
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/operationSecurity",
	});
	assert.equal(res.statusCode, 401);
	assert.equal(res.statusMessage, "Unauthorized");
});

test("security preHandler passes on succes using OR", async (t) => {
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
		url: "/operationSecurity",
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.statusMessage, "OK");
});

test("security preHandler passes on succes using AND", async (t) => {
	const result = {};
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
		url: "/operationSecurityUsingAnd",
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.statusMessage, "OK");
	assert.equal(res.body, '{"response":"Authentication succeeded!"}');
});

test("security preHandler fails correctly on failure using AND", async (t) => {
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
		url: "/operationSecurityUsingAnd",
	});
	assert.equal(res.statusCode, 401);
	assert.equal(res.statusMessage, "Unauthorized");
});

test("security preHandler passes with empty handler", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers,
	};

	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/operationSecurityEmptyHandler",
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.statusMessage, "OK");
});

test("security preHandler handles missing handlers", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			ipa_key: securityHandlers.failingAuthCheck,
		},
	};

	const fastify = Fastify();
	fastify.setErrorHandler((err, req, reply) => {
		assert.equal(err.errors.length, 3);
		reply.code(err.statusCode).send(err);
	});
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/operationSecurity",
	});
	assert.equal(res.statusCode, 401);
	assert.equal(res.statusMessage, "Unauthorized");
});

test("invalid securityHandler definition throws error ", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidSecurityOpts);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'securityHandlers' parameter must refer to an object",
				"got expected error",
			);
			done();
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("initalization of securityHandlers succeeds", (t, done) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			initialize: async (securitySchemes) => {
				const securitySchemeFromSpec = JSON.stringify(
					testSpec.components.securitySchemes,
				);
				assert.equal(JSON.stringify(securitySchemes), securitySchemeFromSpec);
			},
		},
	};

	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("security preHandler gets parameters passed", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			api_key: securityHandlers.failingAuthCheck,
			skipped: (req, repl, param) => {
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
			url: "/operationSecurity",
		});
		assert.equal(res.statusCode, 200);
		assert.equal(res.statusMessage, "OK");
		assert.equal(res.body, '{"response":"authentication succeeded!"}');
	}

	{
		const res = await fastify.inject({
			method: "GET",
			url: "/operationSecurityWithParameter",
		});
		assert.equal(res.statusCode, 200);
		assert.equal(res.statusMessage, "OK");
		assert.equal(res.body, '{"response":"skipped"}');
	}
});

test("security preHandler throws error with custom StatusCode", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			api_key: securityHandlers.failingAuthCheckCustomStatusCode,
		},
	};

	const fastify = Fastify();
	fastify.setErrorHandler((err, req, reply) => {
		assert.equal(err.errors.length, 3);
		reply.code(err.statusCode).send(err);
	});
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/operationSecurity",
	});
	assert.equal(res.statusCode, 451);
	assert.equal(res.statusMessage, "Unavailable For Legal Reasons");
});

test("security preHandler does not throw error when global security handler is overwritten with local empty security", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			api_key: securityHandlers.failingAuthCheck,
		},
	};

	const fastify = Fastify();
	fastify.setErrorHandler((err, _req, reply) => {
		assert.equal(err.errors.length, 3);
		reply.code(err.statusCode).send(err);
	});
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/operationSecurityOverrideWithNoSecurity",
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.statusMessage, "OK");
	assert.equal(res.body, '{"response":"authentication succeeded!"}');
});
