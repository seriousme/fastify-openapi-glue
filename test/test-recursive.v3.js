import { test } from "tap";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi-v3-recursive.json");

import { Service } from "./service.js";
const service = new Service();

const noStrict = {
  ajv: {
    customOptions: {
      strict: false,
    },
  },
};

test("route registration succeeds with recursion", (t) => {
  const opts = {
    specification: testSpec,
    service,
  };

  t.plan(1);
  const fastify = Fastify(noStrict);
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.ready((err) => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});
