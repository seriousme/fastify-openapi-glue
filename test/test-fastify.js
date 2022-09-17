// just test the basics to aid debugging
import { test } from "tap";
import Fastify from "fastify";

const opts = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        hello: { type: "string" },
      },
      required: ["hello"],
    },
  },
};

test("basic fastify works", (t) => {
  t.plan(2);
  const fastify = Fastify();

  async function routes(fastify) {
    fastify.get("/", async () => {
      return { hello: "world" };
    });
  }
  fastify.register(routes);
  fastify.inject(
    {
      method: "GET",
      url: "/",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("fastify validation works", (t) => {
  t.plan(5);
  const fastify = Fastify();

  async function routes(fastify) {
    fastify.get("/", opts, async (request) => {
      return { hello: request.query.hello };
    });
  }
  fastify.register(routes);
  fastify.inject(
    {
      method: "GET",
      url: "/?hello=world",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.body, '{"hello":"world"}', "expected value");
      t.equal(res.statusCode, 200, "expected HTTP code");
    }
  );
  fastify.inject(
    {
      method: "GET",
      url: "/?ello=world",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 400, "expected HTTP code");
    }
  );
});
