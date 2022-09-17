// just test the basics to aid debugging
import { test } from "tap";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
import { Writable } from "stream";

const testSpec = await importJSON("./test-openapi.v3.json");
import { Service } from "./service.js";
const service = new Service();
import securityHandlers from "./security.js";

class DebugCatcher {
  constructor() {
    this.data = [];
  }
  stream() {
    const that = this;
    return new Writable({
      write(chunk, encoding, callback) {
        that.data.push(chunk.toString("utf8"));
        callback();
      },
    });
  }
}

const missingMethods = (service, methodSet) => {
  const proto = Object.getPrototypeOf(service);
  const notPresent = (item) =>
    typeof service[item] === "function" &&
    item.match(/^(get|post|test)/) &&
    !methodSet.has(item);
  return Object.getOwnPropertyNames(proto).some(notPresent);
};

test("Service registration is logged at level 'debug'", async (t) => {
  const catcher = new DebugCatcher();
  const opts = {
    specification: testSpec,
    service,
  };
  t.plan(2);
  const fastify = Fastify({
    logger: {
      level: "debug",
      stream: catcher.stream(),
    },
  });
  fastify.register(fastifyOpenapiGlue, opts);
  const res = await fastify.inject({
    method: "get",
    url: "/noParam",
  });
  t.equal(res.statusCode, 200, "result is ok");
  const operations = new Set();
  for await (const data of catcher.data) {
    const match = data.match(/"msg":"service has '(\w+)'"/);
    if (match !== null) {
      operations.add(match[1]);
    }
  }
  t.equal(
    missingMethods(service, operations),
    false,
    "all operations are present in the debug log"
  );
});

test("Error from invalid securityHandler is logged at level 'debug' ", async (t) => {
  const catcher = new DebugCatcher();
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      skipped: securityHandlers.goodAuthCheck,
      failing: securityHandlers.failingAuthCheck,
    },
  };
  t.plan(2);
  const fastify = Fastify({
    logger: {
      level: "debug",
      stream: catcher.stream(),
    },
  });
  fastify.register(fastifyOpenapiGlue, opts);
  const res = await fastify.inject({
    method: "GET",
    url: "/operationSecurity",
  });
  t.equal(res.statusCode, 200, "request succeeded");
  const handlers = new Set();
  for await (const data of catcher.data) {
    const match = data.match(
      /Security handler 'api_key' failed: 'API key was invalid or not found'/
    );
    if (match !== null) {
      handlers.add(match[0]);
    }
  }
  t.equal(
    handlers.has(
      "Security handler 'api_key' failed: 'API key was invalid or not found'"
    ),
    true,
    "securityHandler error is present in the debug log"
  );
});
