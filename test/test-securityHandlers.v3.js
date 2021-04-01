const t = require("tap");
const test = t.test;
const Fastify = require("fastify");
const fastifyOpenapiGlue = require("../index");

const testSpec = require("./test-openapi.v3.json");
const petStoreSpec = require("./petstore-openapi.v3.json");
const securityHandlers = require('./security');
const serviceFile = `${__dirname}/service.js`;
const service = require(serviceFile);

const invalidSecurityOpts = {
  specification: testSpec,
  service,
  securityHandlers: () => { }
};

test("security handler registration succeeds", t => {
  const opts = {
    specification: petStoreSpec,
    service,
    securityHandlers
  };

  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.ready(err => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("security preHandler throws error", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck
    }
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
      t.equal(res.statusMessage, 'Unauthorized');
    }
  );
});

test("security preHandler passes on succes", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      skipped: securityHandlers.goodAuthCheck,
      failing: securityHandlers.failingAuthCheck
    }
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
      t.equal(res.statusMessage, 'OK');
    }
  );
});

test("security preHandler passes with empty handler", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers
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
      t.equal(res.statusMessage, 'OK');
    }
  );
});

test("security preHandler handles missing handlers", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      ipa_key: securityHandlers.failingAuthCheck
    }
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
      t.equal(res.statusMessage, 'Unauthorized');
    }
  );
});

test("invalid securityHandler definition throws error ", t => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, invalidSecurityOpts);
  fastify.ready(err => {
    if (err) {
      t.match(err.message, "'securityHandlers' parameter must refer to an object", "got expected error");
    } else {
      t.fail("missed expected error");
    }
  });
});

test("initalization of securityHandlers succeeds", t => {
  t.plan(2);

  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      initialize: (securitySchemes) => {
        const securitySchemeFromSpec = JSON.stringify(testSpec.components.securitySchemes);
        t.equal(JSON.stringify(securitySchemes), securitySchemeFromSpec);
      }
    }
  };

  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.ready(err => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("security preHandler gets parameters passed", t => {
  t.plan(8);
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      skipped: (req, repl, param) => { req.scope = param[0] },
      failing: securityHandlers.failingAuthCheck
    }
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
      t.equal(res.statusMessage, 'OK');
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
      t.equal(res.statusMessage, 'OK');
      t.equal(res.body, '{"response":"skipped"}');
    }
  );
});
