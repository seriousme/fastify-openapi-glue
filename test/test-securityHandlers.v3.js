import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
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

test("security preHandler throws error", (t) => {
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
			url: "/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 401);
			assert.equal(res.statusMessage, "Unauthorized");
		},
	);
});

test("security preHandler passes on succes", (t) => {
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

	fastify.inject(
		{
			method: "GET",
			url: "/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(res.statusMessage, "OK");
		},
	);
});

test("security preHandler passes with empty handler", (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers,
	};

	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/operationSecurityEmptyHandler",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(res.statusMessage, "OK");
		},
	);
});

test("security preHandler handles missing handlers", (t) => {
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
	fastify.inject(
		{
			method: "GET",
			url: "/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 401);
			assert.equal(res.statusMessage, "Unauthorized");
		},
	);
});

test("invalid securityHandler definition throws error ", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidSecurityOpts);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'securityHandlers' parameter must refer to an object",
				"got expected error",
			);
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("initalization of securityHandlers succeeds", (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			initialize: (securitySchemes) => {
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
			url: "/operationSecurity",
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
			url: "/operationSecurityWithParameter",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(res.statusMessage, "OK");
			assert.equal(res.body, '{"response":"skipped"}');
		},
	);
});

test("security preHandler throws error with custom StatusCode", (t) => {
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
	fastify.inject(
		{
			method: "GET",
			url: "/operationSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 451);
			assert.equal(res.statusMessage, "Unavailable For Legal Reasons");
		},
	);
});

test("security preHandler does not throw error when global security handler is overwritten with local empty security", (t) => {
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
	fastify.inject(
		{
			method: "GET",
			url: "/operationSecurityOverrideWithNoSecurity",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(res.statusMessage, "OK");
			assert.equal(res.body, '{"response":"authentication succeeded!"}');
		},
	);
});
