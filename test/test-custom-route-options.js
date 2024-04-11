import { strict as assert } from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi.v3.json");

test("return route params from operationResolver", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		specification: testSpec,
		operationResolver: () => {
			return {
				onSend: async (req, res) => {
					res.code(304);
					return null;
				},
				handler: async () => {
					return { hello: "world" };
				},
			};
		},
	});

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParamObject?int1=1&int2=2",
	});
	assert.equal(res.statusCode, 304);
});

test("operationResolver route params overwrite default params", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		specification: testSpec,
		operationResolver: () => {
			return {
				config: { foo: "bar" },
				handler: async (req) => {
					return req.routeOptions.config;
				},
			};
		},
	});

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParamObject?int1=1&int2=2",
	});
	assert.equal(res.statusCode, 200);
	assert.equal(JSON.parse(res.body)?.foo, "bar");
});

test("throw an error if handler is not specified", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		specification: testSpec,
		operationResolver: () => ({}),
	});

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParamObject?int1=1&int2=2",
	});
	assert.equal(res.statusCode, 500);
	const parsedBody = JSON.parse(res.body);
	assert.equal(parsedBody?.statusCode, 500);
	assert.equal(parsedBody?.error, "Internal Server Error");
	assert.equal(
		parsedBody?.message,
		"Operation getQueryParamObject not implemented",
	);
});
