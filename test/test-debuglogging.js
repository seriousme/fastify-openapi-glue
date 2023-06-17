// just test the basics to aid debugging
import { test } from "node:test";
import { strict as assert } from "node:assert/strict";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
import { Writable } from "stream";

const testSpec = await importJSON("./test-openapi.v3.json");
import { Service } from "./service.js";
const serviceHandlers = new Service();
import securityHandlers from "./security.js";

class DebugCatcher {
	constructor() {
		this.data = [];
	}
	stream() {
		const that = this;
		return new Writable({
			write(chunk, encoding, callback) {
				that.data.push(chunk.toString("utf8"));
				callback();
			},
		});
	}
}

const missingMethods = (service, methodSet) => {
	const proto = Object.getPrototypeOf(service);
	const notPresent = (item) =>
		typeof service[item] === "function" &&
		item.match(/^(get|post|test)/) &&
		!methodSet.has(item);
	return Object.getOwnPropertyNames(proto).some(notPresent);
};

test("Service registration is logged at level 'debug'", async (t) => {
	const catcher = new DebugCatcher();
	const opts = {
		specification: testSpec,
		serviceHandlers,
	};
	const fastify = Fastify({
		logger: {
			level: "debug",
			stream: catcher.stream(),
		},
	});
	fastify.register(fastifyOpenapiGlue, opts);
	const res = await fastify.inject({
		method: "get",
		url: "/noParam",
	});
	assert.equal(res.statusCode, 200, "result is ok");
	const operations = new Set();
	for await (const data of catcher.data) {
		const match = data.match(/"msg":"serviceHandlers has '(\w+)'"/);
		if (match !== null) {
			operations.add(match[1]);
		}
	}
	assert.equal(
		missingMethods(serviceHandlers, operations),
		false,
		"all operations are present in the debug log",
	);
});

test("Error from invalid securityHandler is logged at level 'debug' ", async (t) => {
	const catcher = new DebugCatcher();
	const opts = {
		specification: testSpec,
		serviceHandlers,
		securityHandlers: {
			api_key: securityHandlers.failingAuthCheck,
			skipped: securityHandlers.goodAuthCheck,
			failing: securityHandlers.failingAuthCheck,
		},
	};
	const fastify = Fastify({
		logger: {
			level: "debug",
			stream: catcher.stream(),
		},
	});
	fastify.register(fastifyOpenapiGlue, opts);
	const res = await fastify.inject({
		method: "GET",
		url: "/operationSecurity",
	});
	assert.equal(res.statusCode, 200, "request succeeded");
	const handlers = new Set();
	for await (const data of catcher.data) {
		const match = data.match(
			/Security handler 'api_key' failed: 'API key was invalid or not found'/,
		);
		if (match !== null) {
			handlers.add(match[0]);
		}
	}
	assert.equal(
		handlers.has(
			"Security handler 'api_key' failed: 'API key was invalid or not found'",
		),
		true,
		"securityHandler error is present in the debug log",
	);
});
