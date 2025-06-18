// just test the basics to aid debugging
import { test } from "node:test";
import { ParserBase } from "../lib/ParserBase.js";

test("generation of operationId works", (t) => {
	const pb = new ParserBase();
	t.assert.equal(
		pb.makeOperationId("get", "/user/{name}"),
		"getUserByName",
		"get /user/{name} becomes getUserByName",
	);
});
