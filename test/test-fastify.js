import { strict as assert } from "node:assert/strict";
// just test the basics to aid debugging
import { test } from "node:test";
import Fastify from "fastify";

const opts = {
	schema: {
		querystring: {
			type: "object",
			properties: {
				hello: { type: "string" },
			},
			required: ["hello"],
		},
	},
};

test("basic fastify works", async (t) => {
	const fastify = Fastify();

	async function routes(fastify) {
		fastify.get("/", async () => {
			return { hello: "world" };
		});
	}
	fastify.register(routes);
	const res = await fastify.inject({
		method: "GET",
		url: "/",
	});
	assert.equal(res.statusCode, 200);
});

test("fastify validation works", async (t) => {
	const fastify = Fastify();

	async function routes(fastify) {
		fastify.get("/", opts, async (request) => {
			return { hello: request.query.hello };
		});
	}
	fastify.register(routes);
	{
		const res = await fastify.inject({
			method: "GET",
			url: "/?hello=world",
		});
		assert.equal(res.body, '{"hello":"world"}', "expected value");
		assert.equal(res.statusCode, 200, "expected HTTP code");
	}
	{
		const res = await fastify.inject({
			method: "GET",
			url: "/?ello=world",
		});
		assert.equal(res.statusCode, 400, "expected HTTP code");
	}
});
