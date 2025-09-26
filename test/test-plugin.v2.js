import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const testSpec = await importJSON("./test-swagger.v2.json");
const petStoreSpec = await importJSON("./petstore-swagger.v2.json");
const testSpecYAML = localFile("./test-swagger.v2.yaml");
const genericPathItemsSpec = await importJSON(
	"./test-swagger-v2-generic-path-items.json",
);

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

const genericPathItemsOpts = {
	specification: genericPathItemsSpec,
	serviceHandlers,
};

process.on("warning", (warning) => {
	if (warning.name === "FastifyWarning") {
		throw new Error(`Fastify generated a warning: ${warning}`);
	}
});

test("path parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/v2/pathParam/2",
	});
	t.assert.equal(res.statusCode, 200);
});

test("query parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/v2/queryParam?int1=1&int2=2",
	});
	t.assert.equal(res.statusCode, 200);
});

test("header parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/v2/headerParam",
		headers: {
			"X-Request-ID": "test data",
		},
	});
	t.assert.equal(res.statusCode, 200);
});

test("body parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "post",
		url: "/v2/bodyParam",
		payload: { str1: "test data" },
	});
	t.assert.equal(res.statusCode, 200);
});

test("no parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/v2/noParam",
	});
	t.assert.equal(res.statusCode, 200);
});

test("missing operation from service returns error 500", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/v2/noOperationId/1",
	});
	t.assert.equal(res.statusCode, 500);
});

test("response schema works with valid response", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/v2/responses?replyType=valid",
	});
	t.assert.equal(res.statusCode, 200);
});

test("response schema works with invalid response", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/v2/responses?replyType=invalid",
	});
	t.assert.equal(res.statusCode, 500);
});

test("yaml spec works", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, yamlOpts);

	const res = await fastify.inject({
		method: "GET",
		url: "/v2/pathParam/2",
	});
	t.assert.equal(res.statusCode, 200);
});

test("invalid openapi v2 specification throws error ", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidSwaggerOpts);
	fastify.ready((err) => {
		if (err) {
			t.assert.equal(
				err.message,
				"'specification' parameter must contain a valid specification of a supported OpenApi version",
				"got expected error",
			);
			done();
		} else {
			t.assert.fail("missed expected error");
		}
	});
});

test("missing service definition throws error ", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidServiceOpts);
	fastify.ready((err) => {
		if (err) {
			t.assert.equal(
				err.message,
				"'serviceHandlers' parameter must refer to an object",
				"got expected error",
			);
			done();
		} else {
			t.assert.fail("missed expected error");
		}
	});
});

test("invalid service definition throws error ", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, missingServiceOpts);
	fastify.ready((err) => {
		if (err) {
			t.assert.equal(
				err.message,
				"'serviceHandlers' parameter must refer to an object",
				"got expected error",
			);
			done();
		} else {
			t.assert.fail("missed expected error");
		}
	});
});

test("full pet store V2 definition does not throw error ", (t, done) => {
	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, {
		specification: structuredClone(petStoreSpec),
		serviceHandlers,
	});
	fastify.ready((err) => {
		if (err) {
			t.assert.fail("got unexpected error");
		} else {
			t.assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("x- props are copied", async (t) => {
	const fastify = Fastify();
	fastify.addHook("preHandler", async (request, _reply) => {
		if (request.routeOptions.schema["x-tap-ok"]) {
			t.assert.ok(true, "found x- prop");
		} else {
			t.assert.fail("missing x- prop");
		}
	});
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/v2/queryParam?int1=1&int2=2",
	});
	t.assert.equal(res.statusCode, 200);
});

test("x-fastify-config is applied", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		...opts,
		serviceHandlers: {
			operationWithFastifyConfigExtension: async (req, _reply) => {
				t.assert.equal(
					req.routeOptions.config.rawBody,
					true,
					"config.rawBody is true",
				);
				return;
			},
		},
	});

	await fastify.inject({
		method: "GET",
		url: "/v2/operationWithFastifyConfigExtension",
	});
});

test("generic path parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

	const res = await fastify.inject({
		method: "GET",
		url: "/pathParam/2",
	});
	t.assert.equal(res.statusCode, 200);
});

test("generic path parameters override works", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

	const res = await fastify.inject({
		method: "GET",
		url: "/noParam",
	});
	t.assert.equal(res.statusCode, 200);
});

test("schema attributes for non-body parameters work", async (t) => {
	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, {
		specification: structuredClone(petStoreSpec),
		serviceHandlers,
	});
	const res = await fastify.inject({
		method: "GET",
		url: "v2/store/order/11",
	});
	t.assert.equal(res.statusCode, 400);
	const parsedBody = JSON.parse(res.body);
	t.assert.equal(parsedBody.statusCode, 400);
	t.assert.equal(parsedBody.error, "Bad Request");
	t.assert.equal(parsedBody.message, "params/orderId must be <= 10");
});

test("create an empty body with addEmptySchema option", async (t) => {
	const fastify = Fastify();

	let emptyBodySchemaFound = false;
	fastify.addHook("onRoute", (routeOptions) => {
		if (routeOptions.url === "/v2/emptyBodySchema") {
			t.assert.deepStrictEqual(routeOptions.schema.response?.["204"], {});
			t.assert.deepStrictEqual(routeOptions.schema.response?.["302"], {});
			emptyBodySchemaFound = true;
		}
	});

	await fastify.register(fastifyOpenapiGlue, {
		specification: testSpec,
		serviceHandlers: new Set(),
		addEmptySchema: true,
	});
	t.assert.ok(emptyBodySchemaFound);
});
