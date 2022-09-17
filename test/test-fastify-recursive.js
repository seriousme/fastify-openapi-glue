import { test } from "tap";
import Fastify from "fastify";

const opts = {
  schema: {
    body: {
      $id: "https://example.com/tree",
      type: "object",
      additionalProperties: false,
      properties: {
        str1: {
          type: "string",
        },
        obj1: {
          $ref: "#",
        },
      },
      required: ["str1"],
    },
  },
};

test("fastify validation works", (t) => {
  t.plan(5);
  const fastify = Fastify();

  async function routes(fastify) {
    fastify.post("/", opts, async (request) => {
      t.same(
        request.body,
        { str1: "test data", obj1: { str1: "test data" } },
        "expected value"
      );
      return;
    });
  }
  fastify.register(routes);
  fastify.inject(
    {
      method: "POST",
      url: "/",
      payload: {
        str1: "test data",
        obj1: {
          str1: "test data",
        },
      },
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200, "expected HTTP code");
    }
  );
  fastify.inject(
    {
      method: "GET",
      url: "/blah",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 404, "expected HTTP code");
    }
  );
});
