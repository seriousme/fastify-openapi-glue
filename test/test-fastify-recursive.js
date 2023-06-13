import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import Fastify from "fastify";

const opts = {
	schema: {
		body: {
			$id: "https://example.com/tree",
			type: "object",
			additionalProperties: false,
			properties: {
				str1: {
					type: "string",
				},
				obj1: {
					$ref: "#",
				},
			},
			required: ["str1"],
		},
	},
};

test("fastify validation works", (t) => {
	const fastify = Fastify();

	async function routes(fastify) {
		fastify.post("/", opts, async (request) => {
			assert.deepEqual(
				request.body,
				{ str1: "test data", obj1: { str1: "test data" } },
				"expected value",
			);
			return;
		});
	}
	fastify.register(routes);
	fastify.inject(
		{
			method: "POST",
			url: "/",
			payload: {
				str1: "test data",
				obj1: {
					str1: "test data",
				},
			},
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 200, "expected HTTP code");
		},
	);
	fastify.inject(
		{
			method: "GET",
			url: "/blah",
		},
		(err, res) => {
			assert.ifError(err);
			assert.equal(res.statusCode, 404, "expected HTTP code");
		},
	);
});
