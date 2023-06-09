import { test } from "tap";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";

const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi.v3.json");

test("return route params from operationResolver", (t) => {
	t.plan(2);
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
			t.error(err);
			t.equal(res.statusCode, 304);
		},
	);
});

test("operationResolver route params overwrite default params", (t) => {
	t.plan(3);
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
			t.error(err);
			t.equal(res.statusCode, 200);
			t.has(JSON.parse(res.body), { foo: "bar" });
		},
	);
});

test("throw an error if handler is not specified", (t) => {
	t.plan(3);
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
			t.error(err);
			t.equal(res.statusCode, 500);
			t.has(JSON.parse(res.body), {
				statusCode: 500,
				error: "Internal Server Error",
				message: "Operation getQueryParamObject not implemented",
			});
		},
	);
});
