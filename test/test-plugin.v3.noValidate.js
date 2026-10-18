import { test } from "node:test";
import { Validator } from "@seriousme/openapi-schema-validator";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { Service } from "./service.js";
import testSpec from "./test-openapi.v3.content.json" with { type: "json" };

const serviceHandlers = new Service();

const opts = {
	specification: testSpec,
	serviceHandlers,
	noValidation: true,
};

const nonObjectOpts = {
	specification: "I am a spec",
	serviceHandlers,
	noValidation: true,
};

const noVersionOpts = {
	specification: {},
	serviceHandlers,
	noValidation: true,
};

process.on("warning", (warning) => {
	if (warning.name === "FastifyWarning") {
		throw new Error(`Fastify generated a warning: ${warning}`);
	}
});

test("spec with noValidate works", async (t) => {
	const validateSpy = t.mock.method(Validator.prototype, "validate");
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, opts);

	const res = await fastify.inject({
		method: "GET",
		url: "/queryParamObjectInContent?int1=1&int2=2",
	});
	t.assert.equal(res.statusCode, 200);

	t.assert.equal(
		validateSpy.mock.callCount(),
		0,
		"validator.validate() should not have been called!",
	);
});

test("non-object spec throws error", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, nonObjectOpts);
	fastify.ready((err) => {
		if (err) {
			t.assert.equal(
				err.message,
				"'specification' parameter must contain a valid specification of a supported OpenApi version",
				"got expected error",
			);
			done();
		} else {
			t.assert.fail("missed expected error");
		}
	});
});

test("object spec with no version throws error", (t, done) => {
	const fastify = Fastify();
	fastify.register(fastifyOpenapiGlue, noVersionOpts);
	fastify.ready((err) => {
		if (err) {
			t.assert.equal(
				err.message,
				"'specification' parameter must contain a valid specification of a supported OpenApi version",
				"got expected error",
			);
			done();
		} else {
			t.assert.fail("missed expected error");
		}
	});
});
