import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";

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
		return function (req, reply) {
			reply.send("ok");
		};
	},
};

const withOperationResolverUsingMethodPath = {
	specification: testSpec,
	operationResolver(_operationId, method) {
		const result = method === "GET" ? "ok" : "notOk";
		return function (req, reply) {
			reply.send(result);
		};
	},
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
			url: "/pathParam/2",
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
			url: "/queryParam?int1=1&int2=2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("query parameters with object schema work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/queryParamObject?int1=1&int2=2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("query parameters with array schema work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/queryParamArray?arr=1&arr=2",
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
			url: "/headerParam",
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

test("missing header parameters returns error 500", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/headerParam",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 500);
		},
	);
});

test("missing authorization header returns error 500", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "GET",
			url: "/authHeaderParam",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 500);
		},
	);
});

test("body parameters work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	fastify.inject(
		{
			method: "post",
			url: "/bodyParam",
			payload: {
				str1: "test data",
				str2: "test data",
			},
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
			url: "/noParam",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("prefix in opts works", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, prefixOpts);

	fastify.inject(
		{
			method: "get",
			url: "/prefix/noParam",
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
			url: "/noOperationId/1",
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
			url: "/responses?replyType=valid",
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
			url: "/responses?replyType=invalid",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 500);
		},
	);
});

test("yaml spec works", (t) => {
	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, yamlOpts);

	fastify.inject(
		{
			method: "GET",
			url: "/pathParam/2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("generic path parameters work", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

	fastify.inject(
		{
			method: "GET",
			url: "/pathParam/2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("generic path parameters override works", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

	fastify.inject(
		{
			method: "GET",
			url: "/noParam",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("invalid openapi v3 specification throws error ", (t) => {
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

test("full pet store V3 definition does not throw error ", (t) => {
	const fastify = Fastify(noStrict);
	// dummy parser to fix coverage testing
	fastify.addContentTypeParser(
		"application/xml",
		{ parseAs: "string" },
		function (req, body) {
			return body;
		},
	);
	fastify.register(fastifyOpenapiGlue, petStoreOpts);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
		}
	});
});

test("V3.0.1 definition does not throw error", (t) => {
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
		}
	});
});

test("V3.0.2 definition does not throw error", (t) => {
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
		}
	});
});

test("V3.0.3 definition does not throw error", (t) => {
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
			url: "/queryParam?int1=1&int2=2",
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
			url: "/operationWithFastifyConfigExtension",
		},
		() => {
			assert.ok(true);
		},
	);
});

test("service and operationResolver together throw error", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, serviceAndOperationResolver);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"'serviceHandlers' and 'operationResolver' are mutually exclusive",
				"got expected error",
			);
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("no service and no operationResolver throw error", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, noServiceNoResolver);
	fastify.ready((err) => {
		if (err) {
			assert.equal(
				err.message,
				"either 'serviceHandlers' or 'operationResolver' are required",
				"got expected error",
			);
		} else {
			assert.fail("missed expected error");
		}
	});
});

test("operation resolver works", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, withOperationResolver);

	fastify.inject(
		{
			method: "get",
			url: "/noParam",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.body, "ok");
		},
	);
});

test("operation resolver with method and url works", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, withOperationResolverUsingMethodPath);

	fastify.inject(
		{
			method: "get",
			url: "/noParam",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.body, "ok");
		},
	);
});
