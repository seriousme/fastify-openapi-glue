import { strict as assert } from "node:assert/strict";
import { after, test } from "node:test";
// test fastify-cli as used by the npm start script
import { URL, fileURLToPath } from "node:url";
import { build } from "fastify-cli/helper.js";

function localFile(fileName) {
	return fileURLToPath(new URL(fileName, import.meta.url));
}

test("test fastify-cli with petstore example", async (t) => {
	const fastifyCli = await build([
		"--options",
		localFile("../examples/petstore/index.js"),
	]);
	after(() => fastifyCli.close());
	const res = await fastifyCli.inject({
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
