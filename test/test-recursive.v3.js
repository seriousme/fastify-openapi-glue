import { createRequire } from "node:module";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";

const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const testSpec = await importJSON("./test-openapi-v3-recursive.json");

class Service {
	async postRecursive(req) {
		return req.body;
	}
}
const serviceHandlers = new Service();

const recursive2Spec = localFile("./test-openapi-v3-recursive2.yaml");
const recursive3Spec = localFile("./test-openapi-v3-recursive3.yaml");

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
	const serviceHandlers = new Service();
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

test("route works with recursion from recursion2 spec", async (t) => {
	const treeData2 = { id: "root", children: [] };
	const forestData2 = [];

	class Service2 {
		async getTree() {
			return treeData2;
		}
		async getForest() {
			return forestData2;
		}
	}

	const serviceHandlers = new Service2();
	const opts = {
		specification: recursive2Spec,
		serviceHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts);
	await fastify.ready();
	const treeRes = await fastify.inject({ method: "GET", url: "/tree" });
	t.assert.equal(treeRes.statusCode, 200, "request ok");
	t.assert.deepStrictEqual(
		JSON.parse(treeRes.body),
		treeData2,
		"treeData result is correct",
	);
	const forestRes = await fastify.inject({ method: "GET", url: "/forest" });
	t.assert.equal(forestRes.statusCode, 200, "request ok");
	t.assert.deepStrictEqual(
		JSON.parse(forestRes.body),
		forestData2,
		"forestData result is correct",
	);
});

test("route works with recursion from recursion3 spec", async (t) => {
	const treeData3 = {
		metadata: { createdAt: "2026-01-01", updatedAt: "2026-01-01" },
		id: "root",
		children: [],
	};
	const forestData3 = [];

	class Service3 {
		async getTree() {
			return treeData3;
		}
		async getForest() {
			return forestData3;
		}
	}
	const serviceHandlers = new Service3();
	const opts = {
		specification: recursive3Spec,
		serviceHandlers,
	};

	const fastify = Fastify(noStrict);
	fastify.register(fastifyOpenapiGlue, opts);
	await fastify.ready();
	const treeRes = await fastify.inject({ method: "GET", url: "/tree" });
	t.assert.equal(treeRes.statusCode, 200, "request ok");
	t.assert.deepStrictEqual(
		JSON.parse(treeRes.body),
		treeData3,
		"treeData result is correct",
	);
	const forestRes = await fastify.inject({ method: "GET", url: "/forest" });
	t.assert.equal(forestRes.statusCode, 200, "request ok");
	t.assert.deepStrictEqual(
		JSON.parse(forestRes.body),
		forestData3,
		"forestData result is correct",
	);
});
