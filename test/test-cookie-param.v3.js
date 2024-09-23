import { strict as assert } from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi-v3-cookie-param.json");

import { Service } from "./service.js";
const serviceHandlers = new Service();

const noStrict = {
	ajv: {
		customOptions: {
			strict: false,
		},
	},
};

test("route registration succeeds with cookie param", (t, done) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
	};

	const fastify = Fastify(structuredClone(noStrict));
	fastify.register(fastifyOpenapiGlue, opts);
	fastify.ready((err) => {
		if (err) {
			assert.fail("got unexpected error");
		} else {
			assert.ok(true, "no unexpected error");
			done();
		}
	});
});

test("route registration inserts cookie schema", (t, done) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
		addCookieSchema: true,
	};

	const fastify = Fastify(structuredClone(noStrict));
	// Register onRoute handler which will be called when the plugin registers routes in the specification.
	let hadCookieSchema = false;
	fastify.addHook("onRoute", (routeOptions) => {
		const schema = routeOptions.schema;
		if (schema.operationId === "getCookieParam") {
			hadCookieSchema =
				schema?.cookies &&
				typeof schema?.cookies?.properties?.cookieValue === "object";
		}
	});
	fastify.register(fastifyOpenapiGlue, opts);
	fastify.ready((err) => {
		// Our onRoute handler above should have been invoked already and should have found the cookie schema we asked for (with 'addCookieSchema' option).
		if (err) {
			assert.fail("got unexpected error");
		} else if (hadCookieSchema) {
			assert.ok(true, "no unexpected error");
			done();
		} else {
			assert.fail("cookie schema not found");
		}
	});
});
