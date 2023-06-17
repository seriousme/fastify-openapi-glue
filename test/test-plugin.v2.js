import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const testSpec = await importJSON("./test-swagger.v2.json");
const petStoreSpec = await importJSON("./petstore-swagger.v2.json");
const testSpecYAML = localFile("./test-swagger.v2.yaml");
import { Service } from "./service.js";
const serviceHandlers = new Service();

const noStrict = {
	ajv: {
		customOptions: {
			strict: false,
		},
	},
};

const opts = {
	specification: testSpec,
	serviceHandlers,
};

const yamlOpts = {
	specification: testSpecYAML,
	serviceHandlers,
};

const invalidSwaggerOpts = {
	specification: { valid: false },
	serviceHandlers,
};

const invalidServiceOpts = {
	specification: testSpecYAML,
	serviceHandlers: "wrong",
};

const missingServiceOpts = {
	specification: testSpecYAML,
	serviceHandlers: localFile("./not-a-valid-service.js"),
};

const petStoreOpts = {
	specification: petStoreSpec,
	serviceHandlers,
};

process.on("warning", (warning) => {
	if (warning.name === "FastifyWarning") {
		throw new Error(`Fastify generated a warning: ${warning}`);
	}
});

test("path parameters work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/v2/pathParam/2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("query parameters work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/v2/queryParam?int1=1&int2=2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("header parameters work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/v2/headerParam",
			headers: {
				"X-Request-ID": "test data",
			},
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("body parameters work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "post",
			url: "/v2/bodyParam",
			payload: { str1: "test data" },
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("no parameters work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "get",
			url: "/v2/noParam",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("missing operation from service returns error 500", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "get",
			url: "/v2/noOperationId/1",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 500);
		},
	);
});

test("response schema works with valid response", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "get",
			url: "/v2/responses?replyType=valid",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("response schema works with invalid response", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "get",
			url: "/v2/responses?replyType=invalid",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 500);
		},
	);
});

test("yaml spec works", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, yamlOpts);

	fastify.inject(
		{
			method: "GET",
			url: "/v2/pathParam/2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("invalid openapi v2 specification throws error ", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidSwaggerOpts);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'specification' parameter must contain a valid version 2.0 or 3.0.x or 3.1.x specification",
				"got expected error",
			);
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("missing service definition throws error ", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidServiceOpts);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'serviceHandlers' parameter must refer to an object",
				"got expected error",
			);
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("invalid service definition throws error ", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, missingServiceOpts);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'serviceHandlers' parameter must refer to an object",
				"got expected error",
			);
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("full pet store V2 definition does not throw error ", (t) => {
	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, petStoreOpts);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
		}
	});
});

test("x- props are copied", (t) => {
	const fastify = Fastify();
	fastify.addHook("preHandler", async (request, reply) => {
		if (request.routeSchema["x-tap-ok"]) {
			assert.ok(true, "found x- prop");
		} else {
			assert.fail("missing x- prop");
		}
	});
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/v2/queryParam?int1=1&int2=2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("x-fastify-config is applied", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		...opts,
		serviceHandlers: {
			operationWithFastifyConfigExtension: (req, reply) => {
				assert.equal(req.routeConfig.rawBody, true, "config.rawBody is true");
				return reply;
			},
		},
	});

	fastify.inject(
		{
			method: "GET",
			url: "/v2/operationWithFastifyConfigExtension",
		},
		() => {
			assert.ok(true);
		},
	);
});
