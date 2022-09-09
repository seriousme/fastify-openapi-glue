// this suite tests the examples shown in README.md
import { test } from "tap";
import Fastify from "fastify";
import petstoreExample from "../examples/petstore/index.js";

const noStrict = {
  ajv: {
    customOptions: {
      strict: false,
    },
  },
};

test("/v2/pet/24 works", (t) => {
  t.plan(3);
  const fastify = Fastify(noStrict);
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/24",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(
        res.body,
        '{"id":24,"name":"Kitty the cat","photoUrls":["https://en.wikipedia.org/wiki/Cat#/media/File:Kittyply_edit1.jpg"],"status":"available"}'
      );
    }
  );
});

test("/v2/pet/myPet returns Fastify validation error", (t) => {
  t.plan(3);
  const fastify = Fastify(noStrict);
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/myPet",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 400);
      t.equal(
        res.body,
        '{"statusCode":400,"error":"Bad Request","message":"params/petId must be integer"}'
      );
    }
  );
});

test("v2/pet/findByStatus?status=available&status=pending returns 'not implemented'", (t) => {
  t.plan(3);
  const fastify = Fastify(noStrict);
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/findByStatus?status=available&status=pending",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 500);
      t.equal(
        res.body,
        '{"statusCode":500,"error":"Internal Server Error","message":"Operation findPetsByStatus not implemented"}'
      );
    }
  );
});

test("v2/pet/0 returns serialization error", (t) => {
  t.plan(3);
  const fastify = Fastify(noStrict);
  fastify.register(petstoreExample, {});
  fastify.inject(
    {
      method: "GET",
      url: "v2/pet/0",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 500);
      t.equal(
        res.body,
        '{"statusCode":500,"error":"Internal Server Error","message":"\\"name\\" is required!"}'
      );
    }
  );
});
