import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { Service } from "./service.js";
import testSpec from "./test-openapi.v3.content.json" with { type: "json" };

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

test("query parameters with object schema in content work", async (t) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParamObjectInContent?int1=1&int2=2",
	});
	t.assert.equal(res.statusCode, 200);
});
