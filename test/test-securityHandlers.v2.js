const t = require("tap");
const test = t.test;
const Fastify = require("fastify");
const fastifyOpenapiGlue = require("../index");

const testSpec = require("./test-swagger.v2.json");
const petStoreSpec = require("./petstore-swagger.v2.json");
const securityHandlers = require('./security');
const serviceFile = `${__dirname}/service.js`;
const service = require(serviceFile);

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

test("security registration succeeds, but preHandler throws error", t => {
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
    t.strictEqual(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 401);
      t.strictEqual(res.statusMessage, 'Unauthorized');
    }
  );
});

test("security preHandler passes with short-circuit", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.goodAuthCheck,
      failing: securityHandlers.failingAuthCheck
    }
  };

  t.plan(3);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
      t.strictEqual(res.statusMessage, 'OK');
    }
  );
});

test("security preHandler handles multiple failures", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      failing: securityHandlers.failingAuthCheck
    }
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, req, reply) => {
    t.strictEqual(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 401);
      t.strictEqual(res.statusMessage, 'Unauthorized');
    }
  );
});

test("initalization of securityHandlers succeeds", t => {
  t.plan(2);

  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      initialize: (securitySchemes) => {
        const securitySchemeFromSpec = JSON.stringify(testSpec.securityDefinitions);
        t.strictEqual(JSON.stringify(securitySchemes), securitySchemeFromSpec);
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
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
      t.strictEqual(res.statusMessage, 'OK');
      t.strictEqual(res.body, '{"response":"authentication succeeded!"}');
    }
  );

  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurityWithParameter",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
      t.strictEqual(res.statusMessage, 'OK');
      t.strictEqual(res.body, '{"response":"skipped"}');
    }
  );
});
