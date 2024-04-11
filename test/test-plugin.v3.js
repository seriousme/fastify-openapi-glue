import { strict as assert } from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const testSpec = await importJSON("./test-openapi.v3.json");
const petStoreSpec = await importJSON("./petstore-openapi.v3.json");
const testSpecYAML = localFile("./test-openapi.v3.yaml");
const genericPathItemsSpec = await importJSON(
	"./test-openapi-v3-generic-path-items.json",
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

const prefixOpts = {
	specification: testSpec,
	serviceHandlers,
	prefix: "prefix",
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

const petStoreOpts = {
	specification: petStoreSpec,
	serviceHandlers,
};

const genericPathItemsOpts = {
	specification: genericPathItemsSpec,
	serviceHandlers,
};

const serviceAndOperationResolver = {
	specification: testSpec,
	serviceHandlers: localFile("./not-a-valid-service.js"),
	operationResolver() {
		return;
	},
};

const noServiceNoResolver = {
	specification: testSpec,
};

const withOperationResolver = {
	specification: testSpec,
	operationResolver() {
		return async (req, reply) => {
			reply.send("ok");
		};
	},
};

const withOperationResolverUsingMethodPath = {
	specification: testSpec,
	operationResolver(_operationId, method) {
		const result = method === "GET" ? "ok" : "notOk";
		return async (req, reply) => {
			reply.send(result);
		};
	},
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
		url: "/pathParam/2",
	});
	assert.equal(res.statusCode, 200);
});

test("query parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParam?int1=1&int2=2",
	});
	assert.equal(res.statusCode, 200);
});

test("query parameters with object schema work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParamObject?int1=1&int2=2",
	});
	assert.equal(res.statusCode, 200);
});

test("query parameters with array schema work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParamArray?arr=1&arr=2",
	});
	assert.equal(res.statusCode, 200);
});

test("header parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		url: "/headerParam",
		method: "GET",
		headers: {
			"X-Request-ID": "test data",
		},
	});
	assert.equal(res.statusCode, 200);
});

test("missing header parameters returns error 500", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/headerParam",
	});
	assert.equal(res.statusCode, 500);
});

test("missing authorization header returns error 500", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/authHeaderParam",
	});
	assert.equal(res.statusCode, 500);
});

test("body parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "post",
		url: "/bodyParam",
		payload: {
			str1: "test data",
			str2: "test data",
		},
	});
	assert.equal(res.statusCode, 200);
});

test("no parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/noParam",
	});
	assert.equal(res.statusCode, 200);
});

test("prefix in opts works", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, prefixOpts);

	const res = await fastify.inject({
		method: "get",
		url: "/prefix/noParam",
	});
	assert.equal(res.statusCode, 200);
});

test("missing operation from service returns error 500", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/noOperationId/1",
	});
	assert.equal(res.statusCode, 500);
});

test("response schema works with valid response", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/responses?replyType=valid",
	});
	assert.equal(res.statusCode, 200);
});

test("response schema works with invalid response", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "get",
		url: "/responses?replyType=invalid",
	});
	assert.equal(res.statusCode, 500);
});

test("yaml spec works", async (t) => {
	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, yamlOpts);

	const res = await fastify.inject({
		method: "GET",
		url: "/pathParam/2",
	});
	assert.equal(res.statusCode, 200);
});

test("generic path parameters work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

	const res = await fastify.inject({
		method: "GET",
		url: "/pathParam/2",
	});
	assert.equal(res.statusCode, 200);
});

test("generic path parameters override works", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

	const res = await fastify.inject({
		method: "GET",
		url: "/noParam",
	});
	assert.equal(res.statusCode, 200);
});

test("invalid openapi v3 specification throws error ", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidSwaggerOpts);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'specification' parameter must contain a valid version 2.0 or 3.0.x or 3.1.x specification",
				"got expected error",
			);
			done();
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("missing service definition throws error ", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, invalidServiceOpts);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'serviceHandlers' parameter must refer to an object",
				"got expected error",
			);
			done();
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("full pet store V3 definition does not throw error ", (t, done) => {
	const fastify = Fastify(noStrict);
	// dummy parser to fix coverage testing
	fastify.addContentTypeParser(
		"application/xml",
		{ parseAs: "string" },
		(req, body) => body,
	);
	fastify.register(fastifyOpenapiGlue, petStoreOpts);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("V3.0.1 definition does not throw error", (t, done) => {
	const spec301 = JSON.parse(JSON.stringify(petStoreSpec));
	spec301["openapi"] = "3.0.1";
	const opts301 = {
		specification: spec301,
		serviceHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts301);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("V3.0.2 definition does not throw error", (t, done) => {
	const spec302 = JSON.parse(JSON.stringify(petStoreSpec));
	spec302["openapi"] = "3.0.2";
	const opts302 = {
		specification: spec302,
		serviceHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts302);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("V3.0.3 definition does not throw error", (t, done) => {
	const spec303 = JSON.parse(JSON.stringify(petStoreSpec));
	spec303["openapi"] = "3.0.3";
	const opts303 = {
		specification: spec303,
		serviceHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts303);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("x- props are copied", async (t) => {
	const fastify = Fastify();
	fastify.addHook("preHandler", async (request, reply) => {
		if (request.routeOptions.schema["x-tap-ok"]) {
			assert.ok(true, "found x- prop");
		} else {
			assert.fail("missing x- prop");
		}
	});
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParam?int1=1&int2=2",
	});
	assert.equal(res.statusCode, 200);
});

test("x-fastify-config is applied", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		...opts,
		serviceHandlers: {
			operationWithFastifyConfigExtension: async (req, reply) => {
				assert.equal(
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
		url: "/operationWithFastifyConfigExtension",
	});
});

test("x-no-fastify-config is applied", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		...opts,
		serviceHandlers: {
			ignoreRoute: async (req, reply) => {},
		},
	});

	const res = await fastify.inject({
		method: "GET",
		url: "/ignoreRoute",
	});
	assert.equal(res.statusCode, 404);
});

test("service and operationResolver together throw error", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, serviceAndOperationResolver);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'serviceHandlers' and 'operationResolver' are mutually exclusive",
				"got expected error",
			);
			done();
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("no service and no operationResolver throw error", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, noServiceNoResolver);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"either 'serviceHandlers' or 'operationResolver' are required",
				"got expected error",
			);
			done();
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("operation resolver works", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, withOperationResolver);

	const res = await fastify.inject({
		method: "get",
		url: "/noParam",
	});
	assert.equal(res.body, "ok");
});

test("operation resolver with method and url works", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, withOperationResolverUsingMethodPath);

	const res = await fastify.inject({
		method: "get",
		url: "/noParam",
	});
	assert.equal(res.body, "ok");
});

test("create an empty body with allowEmptyBody option", async (t) => {
	const fastify = Fastify();

	let emptyBodySchemaFound = false;
	fastify.addHook("onRoute", (routeOptions) => {
		if (routeOptions.url === "/emptyBodySchema") {
			assert.deepStrictEqual(routeOptions.schema.response?.["204"], {});
			assert.deepStrictEqual(routeOptions.schema.response?.["302"], {});
			emptyBodySchemaFound = true;
		}
	});

	await fastify.register(fastifyOpenapiGlue, {
		specification: testSpec,
		serviceHandlers: new Set(),
		allowEmptyBody: true,
	});
	assert.ok(emptyBodySchemaFound);
});
