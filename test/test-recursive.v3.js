import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const testSpec = await importJSON("./test-openapi-v3-recursive.json");
const treeSpec = localFile("./test-openapi-v3-recursive2.yaml");

const treeData = { id: "root", children: [] };
const forestData = [];

class Service {
	async postRecursive(req) {
		return req.body;
	}

	async getTree() {
		return treeData;
	}
	async getForest() {
		return forestData;
	}
}

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

test("route works with recursion", async (t) => {
	const opts = {
		specification: testSpec,
		serviceHandlers,
	};

	const data = {
		objRef: { str1: "test data" },
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts);
	await fastify.ready();
	const res = await fastify.inject({
		method: "post",
		url: "/recursive",
		payload: data,
	});
	t.assert.equal(res.statusCode, 200, "request ok");
	t.assert.deepStrictEqual(
		JSON.parse(res.body),
		data,
		"recursive result is correct",
	);
});

test("route works with recursion from tree spec", async (t) => {
	const opts = {
		specification: treeSpec,
		serviceHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts);
	await fastify.ready();
	const treeRes = await fastify.inject({ method: "GET", url: "/tree" });
	t.assert.equal(treeRes.statusCode, 200, "request ok");
	t.assert.deepStrictEqual(
		JSON.parse(treeRes.body),
		treeData,
		"treeData result is correct",
	);
	const forestRes = await fastify.inject({ method: "GET", url: "/forest" });
	t.assert.equal(forestRes.statusCode, 200, "request ok");
	t.assert.deepStrictEqual(
		JSON.parse(forestRes.body),
		forestData,
		"forestData result is correct",
	);
});
