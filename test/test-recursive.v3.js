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

function countRefs(value) {
	if (Array.isArray(value)) {
		return value.reduce((count, item) => count + countRefs(item), 0);
	}

	if (value && typeof value === "object") {
		return Object.entries(value).reduce((count, [key, child]) => {
			return count + (key === "$ref" ? 1 : 0) + countRefs(child);
		}, 0);
	}

	return 0;
}

test("route registration succeeds with recursion", (t, done) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
	};

	const numRefsBefore = countRefs(testSpec);
	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts);
	fastify.ready((err) => {
		if (err) {
			t.assert.fail("got unexpected error");
		} else {
			t.assert.ok(true, "no unexpected error");
			const numRefsAfter = countRefs(testSpec);
			t.assert.equal(numRefsAfter, numRefsBefore, "same number of refs");
			done();
		}
	});
});
