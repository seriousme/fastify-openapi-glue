// just test the basics to aid debugging
const t = require("tap");
const test = t.test;
const ParserBase = require("../lib/parserBase.js");

test("generation of operationId works", t => {
    t.plan(1);
    const pb = new ParserBase();
    t.equal(pb.makeOperationId("get","/user/{name}"),"getUserByName","get /user/{name} becomes getUserByName");
});
