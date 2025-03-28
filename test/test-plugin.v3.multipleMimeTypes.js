import { strict as assert } from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi.v3.multipleMimeTypes.json");
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

test("multiple MIME types in request body work", async (t) => {
	const fastify = Fastify();
	fastify.addContentTypeParser(
		"text/json",
		{ parseAs: "string" },
		fastify.getDefaultJsonParser(),
	);
	fastify.register(fastifyOpenapiGlue, opts);

	const method = "POST";
	const url = "/postMultipleBodyMimeTypes";
	const res1 = await fastify.inject({
		method,
		url,
		payload: {
			str1: "string",
		},
	});
	assert.equal(res1.statusCode, 200);
	const res2 = await fastify.inject({
		headers: {
			"content-type": "text/json",
		},
		method,
		url,
		payload: {
			int1: 2,
		},
	});
	assert.equal(res2.statusCode, 200);

	// just to be sure
	const res3 = await fastify.inject({
		headers: {
			"content-type": "application/vnd.v2-json",
		},
		method,
		url,
		payload: {
			str1: "string",
			int1: 2,
		},
	});
	assert.equal(res3.statusCode, 415); // 415 = unsupported media type
});

test("multiple MIME types in response work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const method = "GET";
	const url = "/getMultipleResponseMimeTypes";
	const res1 = await fastify.inject({
		method,
		url,
		query: {
			responseType: "application/json",
		},
	});
	console.log(res1);
	assert.equal(res1.statusCode, 200);
	const res1Body = JSON.parse(res1.body);
	assert.equal(res1Body.str1, "test data");
	assert.ok(res1.headers["content-type"].includes("application/json"));
	const res2 = await fastify.inject({
		method,
		url,
		query: {
			responseType: "text/json",
		},
	});
	assert.equal(res2.statusCode, 200);
	const res2Body = JSON.parse(res2.body);
	assert.equal(res2Body.int1, 2);
	assert.ok(res2.headers["content-type"].includes("text/json"));
});

