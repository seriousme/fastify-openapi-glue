// this suite tests the examples shown in README.md
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");
const petstoreExample = require("../examples/petstore/index");

test("/v2/pet/24 works", t => {
  t.plan(3);
  const fastify = Fastify();
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/24"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
      t.strictEqual(res.body, '{"id":24,"name":"Kitty the cat","photoUrls":["https://en.wikipedia.org/wiki/Cat#/media/File:Kittyply_edit1.jpg"],"status":"available"}');
    }
  );
});

test("/v2/pet/myPet returns Fastify validation error", t => {
  t.plan(3);
  const fastify = Fastify();
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/myPet"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 400);
      t.strictEqual(res.body, '{"statusCode":400,"error":"Bad Request","message":"params/petId should be integer"}');
    }
  );
});

test("v2/pet/findByStatus?status=available&status=pending returns 'not implemented'", t => {
  t.plan(3);
  const fastify = Fastify();
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/findByStatus?status=available&status=pending"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 500);
      t.strictEqual(res.body, '{"statusCode":500,"error":"Internal Server Error","message":"Operation findPetsByStatus not implemented"}');
    }
  );
});

test("v2/pet/0 returns serialization error", t => {
  t.plan(3);
  const fastify = Fastify();
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/0"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 500);
      t.strictEqual(res.body, '{"statusCode":500,"error":"Internal Server Error","message":"\\"name\\" is required!"}');
    }
  );
});


