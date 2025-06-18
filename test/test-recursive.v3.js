import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi-v3-recursive.json");

import { Service } from "./service.js";

const serviceHandlers = new Service();

const noStrict = {
	ajv: {
		customOptions: {
			strict: false,
		},
	},
};

test("route registration succeeds with recursion", (t, done) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts);
	fastify.ready((err) => {
		if (err) {
			t.assert.fail("got unexpected error");
		} else {
			t.assert.ok(true, "no unexpected error");
			done();
		}
	});
});
