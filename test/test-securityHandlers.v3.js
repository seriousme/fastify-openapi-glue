import { test } from "tap";
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);

const testSpec = await importJSON("./test-openapi.v3.json");
const petStoreSpec = await importJSON("./petstore-openapi.v3.json");
import securityHandlers from "./security.js";
import { Service } from "./service.js";
const service = new Service();

const noStrict = {
  ajv: {
    customOptions: {
      strict: false,
    },
  },
};

const invalidSecurityOpts = {
  specification: testSpec,
  service,
  securityHandlers: () => {},
};

test("security handler registration succeeds", (t) => {
  const opts = {
    specification: petStoreSpec,
    service,
    securityHandlers,
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

test("security preHandler throws error", (t) => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
    },
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, req, reply) => {
    t.equal(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 401);
      t.equal(res.statusMessage, "Unauthorized");
    }
  );
});

test("security preHandler passes on succes", (t) => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      skipped: securityHandlers.goodAuthCheck,
      failing: securityHandlers.failingAuthCheck,
    },
  };

  t.plan(3);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, "OK");
    }
  );
});

test("security preHandler passes with empty handler", (t) => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers,
  };

  t.plan(3);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurityEmptyHandler",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, "OK");
    }
  );
});

test("security preHandler handles missing handlers", (t) => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      ipa_key: securityHandlers.failingAuthCheck,
    },
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, req, reply) => {
    t.equal(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 401);
      t.equal(res.statusMessage, "Unauthorized");
    }
  );
});

test("invalid securityHandler definition throws error ", (t) => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, invalidSecurityOpts);
  fastify.ready((err) => {
    if (err) {
      t.match(
        err.message,
        "'securityHandlers' parameter must refer to an object",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("initalization of securityHandlers succeeds", (t) => {
  t.plan(2);

  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      initialize: (securitySchemes) => {
        const securitySchemeFromSpec = JSON.stringify(
          testSpec.components.securitySchemes
        );
        t.equal(JSON.stringify(securitySchemes), securitySchemeFromSpec);
      },
    },
  };

  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.ready((err) => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("security preHandler gets parameters passed", (t) => {
  t.plan(8);
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      skipped: (req, repl, param) => {
        req.scope = param[0];
      },
      failing: securityHandlers.failingAuthCheck,
    },
  };

  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, "OK");
      t.equal(res.body, '{"response":"authentication succeeded!"}');
    }
  );

  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurityWithParameter",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, "OK");
      t.equal(res.body, '{"response":"skipped"}');
    }
  );
});

test("security preHandler throws error with custom StatusCode", (t) => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheckCustomStatusCode,
    },
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, req, reply) => {
    t.equal(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 451);
      t.equal(res.statusMessage, "Unavailable For Legal Reasons");
    }
  );
});

test("security preHandler does not throw error when global security handler is overwritten with local empty security", (t) => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
    },
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, _req, reply) => {
    t.equal(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurityOverrideWithNoSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, "OK");
      t.equal(res.body, '{"response":"authentication succeeded!"}');
    }
  );
});
