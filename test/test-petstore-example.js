import { strict as assert } from "node:assert/strict";
// this suite tests the examples shown in README.md
import { test } from "node:test";
import Fastify from "fastify";
import petstoreExample, { options } from "../examples/petstore/index.js";

test("/v2/pet/24 works", async (t) => {
	const fastify = Fastify(structuredClone(options));
	fastify.register(petstoreExample, {});
	const res = await fastify.inject({
		method: "GET",
		url: "v2/pet/24",
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(JSON.parse(res.body), {
		id: 24,
		name: "Kitty the cat",
		photoUrls: [
			"https://en.wikipedia.org/wiki/Cat#/media/File:Kittyply_edit1.jpg",
		],
		status: "available",
	});
});

test("/v2/pet/myPet returns Fastify validation error", async (t) => {
	const fastify = Fastify(structuredClone(options));
	fastify.register(petstoreExample, {});
	const res = await fastify.inject({
		method: "GET",
		url: "v2/pet/myPet",
	});
	assert.equal(res.statusCode, 400);
	const parsedBody = JSON.parse(res.body);
	assert.equal(parsedBody.statusCode, 400);
	assert.equal(parsedBody.error, "Bad Request");
	assert.equal(parsedBody.message, "params/petId must be integer");
});

test("v2/pet/findByStatus?status=available&status=pending returns 'not implemented'", async (t) => {
	const fastify = Fastify(structuredClone(options));
	fastify.register(petstoreExample, {});
	const res = await fastify.inject({
		method: "GET",
		url: "v2/pet/findByStatus?status=available&status=pending",
	});
	assert.equal(res.statusCode, 500);
	const parsedBody = JSON.parse(res.body);
	assert.equal(parsedBody.statusCode, 500);
	assert.equal(parsedBody.error, "Internal Server Error");
	assert.equal(
		parsedBody.message,
		"Operation findPetsByStatus not implemented",
	);
});

test("v2/pet/0 returns serialization error", async (t) => {
	const fastify = Fastify(structuredClone(options));
	fastify.register(petstoreExample, {});
	const res = await fastify.inject({
		method: "GET",
		url: "v2/pet/0",
	});
	assert.equal(res.statusCode, 500);
	const parsedBody = JSON.parse(res.body);
	assert.equal(parsedBody.statusCode, 500);
	assert.equal(parsedBody.error, "Internal Server Error");
	assert.equal(parsedBody.message, '"name" is required!');
});
