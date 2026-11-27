import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import testSpec from "./test-openapi.v3.query.json" with { type: "json" };

class Service {
	async queryMethod(req) {
		if (typeof req.body.str1 !== "string") {
			throw new Error("req.body.str1 is not a string");
		}
		return req.body.str1;
	}
}

const serviceHandlers = new Service();

const opts = {
	specification: testSpec,
	serviceHandlers,
};

process.on("warning", (warning) => {
	if (warning.name === "FastifyWarning") {
		throw new Error(`Fastify generated a warning: ${warning}`);
	}
});

test("http query method works", async (t) => {
	const fastify = Fastify();
	const str1 = "This is a query body string";
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "QUERY",
		url: "/queryMethod",
		body: { str1 },
	});
	t.assert.equal(res.statusCode, 200);
	t.assert.equal(res.body, str1);
});

test("http query method parameter validation works", async (t) => {
	const fastify = Fastify();
	const str1 = "This is a query body string";
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "QUERY",
		url: "/queryMethod",
		body: { str2: str1 },
	});
	t.assert.equal(res.statusCode, 400);
});
