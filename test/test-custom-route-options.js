import { createRequire } from "module";
import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi.v3.json");

test("return route params from operationResolver", (t) => {
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

	fastify.inject(
		{
			method: "GET",
			url: "/queryParamObject?int1=1&int2=2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 304);
		},
	);
});

test("operationResolver route params overwrite default params", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		specification: testSpec,
		operationResolver: () => {
			return {
				config: { foo: "bar" },
				handler: async (req) => {
					return req.routeConfig;
				},
			};
		},
	});

	fastify.inject(
		{
			method: "GET",
			url: "/queryParamObject?int1=1&int2=2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
			assert.equal(JSON.parse(res.body)?.foo, "bar");
		},
	);
});

test("throw an error if handler is not specified", (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, {
		specification: testSpec,
		operationResolver: () => ({}),
	});

	fastify.inject(
		{
			method: "GET",
			url: "/queryParamObject?int1=1&int2=2",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 500);
			const parsedBody = JSON.parse(res.body);
			assert.equal(parsedBody?.statusCode, 500);
			assert.equal(parsedBody?.error, "Internal Server Error");
			assert.equal(
				parsedBody?.message,
				"Operation getQueryParamObject not implemented",
			);
		},
	);
});
