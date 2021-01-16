// CommonJS implementation of the operations in the openapi specification

class Service {
  constructor() {}

  // Operation: getPathParam
  // summary:  Test path parameters
  // req.params:
  //   type: object
  //   properties:
  //     id:
  //       type: integer
  //   required:
  //     - id
  //
  // valid responses:
  //   '200':
  //     description: ok
  //

  async getPathParam(req, reply) {
    if (typeof req.params.id !== "number") {
      throw new Error("req.params.id is not a number");
    }
    return "";
  }

  // Operation: getQueryParam
  // summary:  Test query parameters
  // req.query:
  //   type: object
  //   properties:
  //     int1:
  //       type: integer
  //     int2:
  //       type: integer
  //
  // valid responses:
  //   '200':
  //     description: ok
  //

  async getQueryParam(req, reply) {
    if (
      typeof req.query.int1 !== "number" ||
      typeof req.query.int2 !== "number"
    ) {
      throw new Error("req.params.int1 or req.params.int2 is not a number");
    }
    return "";
  }

  // Operation: getHeaderParam
  // summary:  Test header parameters
  // req.headers:
  //   type: object
  //   properties:
  //     X-Request-ID:
  //       type: string
  //
  // valid responses:
  //   '200':
  //     description: ok
  //

  async getHeaderParam(req, reply) {
    if (typeof req.headers["x-request-id"] !== "string") {
      throw new Error("req.header['x-request-id'] is not a string");
    }
    return "";
  }

  // Operation: getAuthHeaderParam
  // summary:  Test authorization header parameters
  // req.headers:
  //   type: object
  //   properties:
  //     authorization:
  //       type: string
  //
  // valid responses:
  //   '200':
  //     description: ok
  //

  async getAuthHeaderParam(req, reply) {
    if (typeof req.headers["authorization"] !== "string") {
      throw new Error("req.header['authorization'] is not a string");
    }
    return "";
  }

  // Operation: getNoParam
  // summary:  Test no parameters
  //
  // valid responses:
  //   '200':
  //     description: ok
  //

  async getNoParam(req, reply) {
    return "";
  }

  // Operation: postBodyParam
  // summary:  Test body parameters
  // req.body:
  //   type: string
  //
  // valid responses:
  //   '200':
  //     description: ok
  //

  async postBodyParam(req, reply) {
    if (typeof req.body.str1 !== "string") {
      throw new Error("req.body.str1 is not a string");
    }
    return "";
  }

  // Operation: getResponse
  // summary:  Test response serialization
  // req.query:
  //   type: object
  //   properties:
  //     respType:
  //       type: string
  //
  // valid responses:
  //   '200':
  //     description: ok
  //     schema:
  //       type: object
  //       properties:
  //         response:
  //           type: string
  //       required:
  //         - response
  //

  async getResponse(req, reply) {
    if (req.query.replyType === "valid") {
      return { response: "test data" };
    } else {
      return { invalid: 1 };
    }
  }

  // Operation: testOperationSecurity
  // summary:  Test response serialization
  // req.query:
  //   type: object
  //   properties:
  //     respType:
  //       type: string
  //
  // valid responses:
  //   '200':
  //     description: ok
  //     schema:
  //       type: object
  //       properties:
  //         response:
  //           type: string
  //       required:
  //         - response
  //

  async testOperationSecurity(req, reply) {
    return {
      response: req.scope || "authentication succeeded!"
    };
  }

  // Operation: testOperationSecurityWithParameter
  // summary:  Test response serialization
  // req.query:
  //   type: object
  //   properties:
  //     respType:
  //       type: string
  //
  // valid responses:
  //   '200':
  //     description: ok
  //     schema:
  //       type: object
  //       properties:
  //         response:
  //           type: string
  //       required:
  //         - response
  //
  
  async testOperationSecurityWithParameter(req, reply) {
    return {
      response: req.scope || "authentication succeeded!"
    };
  }
}

module.exports = opts => new Service(opts);
