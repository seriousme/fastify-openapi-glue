// just test the basics to aid debugging
import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
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

test("basic fastify works", (t) => {
	const fastify = Fastify();

	async function routes(fastify) {
		fastify.get("/", async () => {
			return { hello: "world" };
		});
	}
	fastify.register(routes);
	fastify.inject(
		{
			method: "GET",
			url: "/",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200);
		},
	);
});

test("fastify validation works", (t) => {
	const fastify = Fastify();

	async function routes(fastify) {
		fastify.get("/", opts, async (request) => {
			return { hello: request.query.hello };
		});
	}
	fastify.register(routes);
	fastify.inject(
		{
			method: "GET",
			url: "/?hello=world",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.body, '{"hello":"world"}', "expected value");
			assert.equal(res.statusCode, 200, "expected HTTP code");
		},
	);
	fastify.inject(
		{
			method: "GET",
			url: "/?ello=world",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 400, "expected HTTP code");
		},
	);
});
