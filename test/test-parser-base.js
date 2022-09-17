// just test the basics to aid debugging
import { test } from "tap";
import { ParserBase } from "../lib/ParserBase.js";

test("generation of operationId works", (t) => {
  t.plan(1);
  const pb = new ParserBase();
  t.equal(
    pb.makeOperationId("get", "/user/{name}"),
    "getUserByName",
    "get /user/{name} becomes getUserByName"
  );
});
