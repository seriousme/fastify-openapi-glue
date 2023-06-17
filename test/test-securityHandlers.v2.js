import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
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

test("security handler registration succeeds", (t) => {
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
		}
	});
});

test("security registration succeeds, but preHandler throws error", (t) => {
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
	fastify.inject(
		{
			method: "GET",
			url: "/v2/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 401);
			assert.equal(res.statusMessage, "Unauthorized");
		},
	);
});

test("security preHandler passes with short-circuit", (t) => {
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
	fastify.inject(
		{
			method: "GET",
			url: "/v2/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(res.statusMessage, "OK");
		},
	);
});

test("security preHandler handles multiple failures", (t) => {
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
	fastify.inject(
		{
			method: "GET",
			url: "/v2/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 401);
			assert.equal(res.statusMessage, "Unauthorized");
		},
	);
});

test("initalization of securityHandlers succeeds", (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			initialize: (securitySchemes) => {
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
		}
	});
});

test("security preHandler gets parameters passed", (t) => {
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

	fastify.inject(
		{
			method: "GET",
			url: "/v2/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(res.statusMessage, "OK");
			assert.equal(res.body, '{"response":"authentication succeeded!"}');
		},
	);

	fastify.inject(
		{
			method: "GET",
			url: "/v2/operationSecurityWithParameter",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(res.statusMessage, "OK");
			assert.equal(res.body, '{"response":"skipped"}');
		},
	);
});
