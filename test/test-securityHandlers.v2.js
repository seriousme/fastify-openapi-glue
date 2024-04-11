import { strict as assert } from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-swagger.v2.json");
const petStoreSpec = await importJSON("./petstore-swagger.v2.json");
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

test("security registration succeeds, but preHandler throws error", async (t) => {
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
		url: "/v2/operationSecurity",
	});
	assert.equal(res.statusCode, 401);
	assert.equal(res.statusMessage, "Unauthorized");
});

test("security preHandler passes with short-circuit", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			api_key: securityHandlers.goodAuthCheck,
			failing: securityHandlers.failingAuthCheck,
		},
	};

	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/v2/operationSecurity",
	});
	assert.equal(res.statusCode, 200);
	assert.equal(res.statusMessage, "OK");
});

test("security preHandler handles multiple failures", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			api_key: securityHandlers.failingAuthCheck,
			failing: securityHandlers.failingAuthCheck,
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
		url: "/v2/operationSecurity",
	});
	assert.equal(res.statusCode, 401);
	assert.equal(res.statusMessage, "Unauthorized");
});

test("initalization of securityHandlers succeeds", (t, done) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			initialize: async (securitySchemes) => {
				const securitySchemeFromSpec = JSON.stringify(
					testSpec.securityDefinitions,
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
			url: "/v2/operationSecurity",
		});
		assert.equal(res.statusCode, 200);
		assert.equal(res.statusMessage, "OK");
		assert.equal(res.body, '{"response":"authentication succeeded!"}');
	}

	{
		const res = await fastify.inject({
			method: "GET",
			url: "/v2/operationSecurityWithParameter",
		});
		assert.equal(res.statusCode, 200);
		assert.equal(res.statusMessage, "OK");
		assert.equal(res.body, '{"response":"skipped"}');
	}
});
