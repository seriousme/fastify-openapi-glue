import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi.v3.content.json");

import { Service } from "./service.js";

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
