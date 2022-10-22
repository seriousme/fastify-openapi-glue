import { test } from "tap";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";

const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const testSpec = await importJSON("./test-openapi.v3.json");
const petStoreSpec = await importJSON("./petstore-openapi.v3.json");
const testSpecYAML = localFile("./test-openapi.v3.yaml");
const genericPathItemsSpec = await importJSON(
  "./test-openapi-v3-generic-path-items.json"
);
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

const prefixOpts = {
  specification: testSpec,
  service,
  prefix: "prefix",
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

const petStoreOpts = {
  specification: petStoreSpec,
  service,
};

const genericPathItemsOpts = {
  specification: genericPathItemsSpec,
  service,
};

const serviceAndOperationResolver = {
  specification: testSpec,
  service: localFile("./not-a-valid-service.js"),
  operationResolver() {
    return;
  },
};

const noServiceNoResolver = {
  specification: testSpec,
};

const withOperationResolver = {
  specification: testSpec,
  operationResolver() {
    return function (req, reply) {
      reply.send("ok");
    };
  },
};

const withOperationResolverUsingMethodPath = {
  specification: testSpec,
  operationResolver(_operationId, method) {
    const result = method === "GET" ? "ok" : "notOk";
    return function (req, reply) {
      reply.send(result);
    };
  },
};

test("path parameters work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/pathParam/2",
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
      url: "/queryParam?int1=1&int2=2",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("query parameters with object schema work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/queryParamObject?int1=1&int2=2",
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
      url: "/headerParam",
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

test("missing header parameters returns error 500", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/headerParam",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 500);
    }
  );
});

test("missing authorization header returns error 500", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/authHeaderParam",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 500);
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
      url: "/bodyParam",
      payload: {
        str1: "test data",
        str2: "test data",
      },
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
      url: "/noParam",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("prefix in opts works", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, prefixOpts);

  fastify.inject(
    {
      method: "get",
      url: "/prefix/noParam",
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
      url: "/noOperationId/1",
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
      url: "/responses?replyType=valid",
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
      url: "/responses?replyType=invalid",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 500);
    }
  );
});

test("yaml spec works", (t) => {
  t.plan(2);
  const fastify = Fastify(noStrict);
  fastify.register(fastifyOpenapiGlue, yamlOpts);

  fastify.inject(
    {
      method: "GET",
      url: "/pathParam/2",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("generic path parameters work", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

  fastify.inject(
    {
      method: "GET",
      url: "/pathParam/2",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("generic path parameters override works", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, genericPathItemsOpts);

  fastify.inject(
    {
      method: "GET",
      url: "/noParam",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
    }
  );
});

test("invalid openapi v3 specification throws error ", (t) => {
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

test("full pet store V3 definition does not throw error ", (t) => {
  t.plan(1);
  const fastify = Fastify(noStrict);
  // dummy parser to fix coverage testing
  fastify.addContentTypeParser(
    "application/xml",
    { parseAs: "string" },
    function (req, body) {
      return body;
    }
  );
  fastify.register(fastifyOpenapiGlue, petStoreOpts);
  fastify.ready((err) => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("V3.0.1 definition does not throw error", (t) => {
  const spec301 = JSON.parse(JSON.stringify(petStoreSpec));
  spec301["openapi"] = "3.0.1";
  const opts301 = {
    specification: spec301,
    service,
  };

  t.plan(1);
  const fastify = Fastify(noStrict);
  fastify.register(fastifyOpenapiGlue, opts301);
  fastify.ready((err) => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("V3.0.2 definition does not throw error", (t) => {
  const spec302 = JSON.parse(JSON.stringify(petStoreSpec));
  spec302["openapi"] = "3.0.2";
  const opts302 = {
    specification: spec302,
    service,
  };

  t.plan(1);
  const fastify = Fastify(noStrict);
  fastify.register(fastifyOpenapiGlue, opts302);
  fastify.ready((err) => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("V3.0.3 definition does not throw error", (t) => {
  const spec303 = JSON.parse(JSON.stringify(petStoreSpec));
  spec303["openapi"] = "3.0.3";
  const opts303 = {
    specification: spec303,
    service,
  };

  t.plan(1);
  const fastify = Fastify(noStrict);
  fastify.register(fastifyOpenapiGlue, opts303);
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
      url: "/queryParam?int1=1&int2=2",
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
      url: "/operationWithFastifyConfigExtension",
    },
    () => {
      t.pass();
    }
  );
});

test("service and operationResolver together throw error", (t) => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, serviceAndOperationResolver);
  fastify.ready((err) => {
    if (err) {
      t.equal(
        err.message,
        "'service' and 'operationResolver' are mutually exclusive",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("no service and no operationResolver throw error", (t) => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, noServiceNoResolver);
  fastify.ready((err) => {
    if (err) {
      t.equal(
        err.message,
        "either 'service' or 'operationResolver' are required",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("operation resolver works", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, withOperationResolver);

  fastify.inject(
    {
      method: "get",
      url: "/noParam",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.body, "ok");
    }
  );
});

test("operation resolver with method and url works", (t) => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, withOperationResolverUsingMethodPath);

  fastify.inject(
    {
      method: "get",
      url: "/noParam",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.body, "ok");
    }
  );
});
