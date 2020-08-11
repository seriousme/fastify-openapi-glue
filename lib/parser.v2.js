// a class for parsing openapi V2 data into config data for fastify
const parserBase = require("./parserBase");

class parserV2 extends parserBase {
  constructor() {
    super(); // Now 'this' is initialized by calling the parent constructor.
  }

  parseParams(data) {
    const params = {
      type: "object",
      properties: {},
    };
    const required = [];
    data.forEach((item) => {
      // item.type "file" breaks ajv, so treat is as a special here
      if (item.type === "file") {
        item.type = "string";
        item.isFile = true;
      }
      //
      params.properties[item.name] = {};
      this.copyProps(item, params.properties[item.name], [
        "type",
        "description",
      ]);
      // ajv wants "required" to be an array, which seems to be too strict
      // see https://github.com/json-schema/json-schema/wiki/Properties-and-required
      if (item.required) {
        required.push(item.name);
      }
    });
    if (required.length > 0) {
      params.required = required;
    }
    return params;
  }

  parseParameters(schema, data) {
    const params = [];
    const querystring = [];
    const headers = [];
    const formData = [];
    data.forEach((item) => {
      switch (item.in) {
        case "body":
          schema.body = item.schema;
          break;
        case "formData":
          formData.push(item);
          break;
        case "path":
          params.push(item);
          break;
        case "query":
          querystring.push(item);
          break;
        case "header":
          headers.push(item);
          break;
      }
    });
    if (params.length > 0) schema.params = this.parseParams(params);
    if (querystring.length > 0)
      schema.querystring = this.parseParams(querystring);
    if (headers.length > 0) schema.headers = this.parseParams(headers);
    if (formData.length > 0) schema.body = this.parseParams(formData);
  }

  parseResponses(responses) {
    const result = {};
    let hasResponse = false;
    for (const httpCode in responses) {
      if (responses[httpCode].schema !== undefined) {
        result[httpCode] = responses[httpCode].schema;
        hasResponse = true;
      }
    }
    return hasResponse ? result : null;
  }

  makeSchema(data) {
    const schema = {};
    const copyItems = [
      "tags",
      "summary",
      "description",
      "operationId",
      "produces",
      "consumes",
      "deprecated",
    ];
    this.copyProps(data, schema, copyItems);
    if (data.parameters) this.parseParameters(schema, data.parameters);
    const response = this.parseResponses(data.responses);
    if (response) {
      schema.response = response;
    }
    return schema;
  }

  processOperation(path, operation, data) {
    const route = {
      method: operation.toUpperCase(),
      url: this.makeURL(path),
      schema: this.makeSchema(data),
      operationId: data.operationId || this.makeOperationId(operation, path),
      openapiSource: data,
      security: this.parseSecurity(data.security || this.spec.security),
    };
    this.config.routes.push(route);
  }

  processPaths(paths) {
    for (const path in paths) {
      for (const operation in paths[path]) {
        this.processOperation(path, operation, paths[path][operation]);
      }
    }
  }

  parse(spec) {
    this.spec = spec;

    for (const item in spec) {
      switch (item) {
        case "paths":
          this.processPaths(spec.paths);
          break;
        case "basePath":
          this.config.prefix = spec[item];
        // the missing break is on purpose !
        case "securityDefinitions":
          this.config.securitySchemes = spec[item];
        // the missing break is on purpose !
        default:
          this.config.generic[item] = spec[item];
      }
    }
    return this.config;
  }
}

module.exports = parserV2;
