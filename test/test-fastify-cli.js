// test fastify-cli as used by the npm start script
import { fileURLToPath, URL } from "url";
import { build } from "fastify-cli/helper.js";
import { test } from "tap";

function localFile(fileName) {
	return fileURLToPath(new URL(fileName, import.meta.url));
}

test("test fastify-cli with petstore example", async (t) => {
	t.plan(2);

	const fastifyCli = await build([
		"--options",
		localFile("../examples/petstore/index.js"),
	]);
	t.teardown(() => fastifyCli.close());
	const res = await fastifyCli.inject({
		method: "GET",
		url: "v2/pet/24",
	});
	t.equal(res.statusCode, 200);
	t.equal(
		res.body,
		'{"id":24,"name":"Kitty the cat","photoUrls":["https://en.wikipedia.org/wiki/Cat#/media/File:Kittyply_edit1.jpg"],"status":"available"}',
	);
});
