import { test } from "tap";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const testSpec = await importJSON("./test-swagger.v2.json");
const petStoreSpec = await importJSON("./petstore-swagger.v2.json");
const testSpecYAML = localFile("./test-swagger.v2.yaml");
import { Service } from "./service.js";
const service = new Service();

const noStrict = {
  ajv: {
    customOptions: {
      strict: false,
    },
  },
};

const opts = {
  specification: testSpec,
  service,
};

const yamlOpts = {
  specification: testSpecYAML,
  service,
};

const invalidSwaggerOpts = {
  specification: { valid: false },
  service,
};

const invalidServiceOpts = {
  specification: testSpecYAML,
  service: "wrong",
};

const missingServiceOpts = {
  specification: testSpecYAML,
  service: localFile("./not-a-valid-service.js"),
};

const petStoreOpts = {
  specification: petStoreSpec,
  service,
};

test("path parameters work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/pathParam/2",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("query parameters work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/queryParam?int1=1&int2=2",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("header parameters work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/headerParam",
      headers: {
        "X-Request-ID": "test data",
      },
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("body parameters work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "post",
      url: "/v2/bodyParam",
      payload: { str1: "test data" },
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("no parameters work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "get",
      url: "/v2/noParam",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("missing operation from service returns error 500", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "get",
      url: "/v2/noOperationId/1",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 500);
    }
  );
});

test("response schema works with valid response", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "get",
      url: "/v2/responses?replyType=valid",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("response schema works with invalid response", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "get",
      url: "/v2/responses?replyType=invalid",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 500);
    }
  );
});

test("yaml spec works", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, yamlOpts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/pathParam/2",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("invalid openapi v2 specification throws error ", (t) => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, invalidSwaggerOpts);
  fastify.ready((err) => {
    if (err) {
      t.equal(
        err.message,
        "'specification' parameter must contain a valid version 2.0 or 3.0.x or 3.1.x specification",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("missing service definition throws error ", (t) => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, invalidServiceOpts);
  fastify.ready((err) => {
    if (err) {
      t.equal(
        err.message,
        "'service' parameter must refer to an object",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("invalid service definition throws error ", (t) => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, missingServiceOpts);
  fastify.ready((err) => {
    if (err) {
      t.match(
        err.message,
        "'service' parameter must refer to an object",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("full pet store V2 definition does not throw error ", (t) => {
  t.plan(1);
  const fastify = Fastify(noStrict);
  fastify.register(fastifyOpenapiGlue, petStoreOpts);
  fastify.ready((err) => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("x- props are copied", (t) => {
  t.plan(3);
  const fastify = Fastify();
  fastify.addHook("preHandler", async (request, reply) => {
    if (reply.context.schema["x-tap-ok"]) {
      t.pass("found x- prop");
    } else {
      t.fail("missing x- prop");
    }
  });
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/queryParam?int1=1&int2=2",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("x-fastify-config is applied", (t) => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, {
    ...opts,
    service: {
      operationWithFastifyConfigExtension: (req, reply) => {
        t.equal(req.routeConfig.rawBody, true, "config.rawBody is true");
        return reply;
      },
    },
  });

  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationWithFastifyConfigExtension",
    },
    () => {
      t.pass();
    }
  );
});
