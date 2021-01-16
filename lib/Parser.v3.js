// a class for parsing openapi v3 data into config data for fastify

import { ParserBase } from "./ParserBase.js";

const HttpOperations = new Set([
  "delete",
  "get",
  "head",
  "patch",
  "post",
  "put",
  "options",
]);

export class ParserV3 extends ParserBase {
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
      params.properties[item.name] = item.schema;
      this.copyProps(item, params.properties[item.name], ["description"]);
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
    // const formData = [];
    data.forEach((item) => {
      switch (item.in) {
        // case "body":
        //   schema.body = item.schema;
        //   break;
        // case "formData":
        //   formData.push(item);
        //   break;
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
  }

  parseBody(data) {
    let schema;
    if (data && data.content) {
      for (const mimeType in data.content) {
        this.config.contentTypes.add(mimeType);
        schema = data.content[mimeType].schema;
      }
    }
    return schema;
  }

  parseResponses(responses) {
    const result = {};
    let hasResponse = false;
    for (const httpCode in responses) {
      const body = this.parseBody(responses[httpCode]);
      if (body !== undefined) {
        result[httpCode] = body;
        hasResponse = true;
      }
    }
    return hasResponse ? result : null;
  }

  makeSchema(genericSchema, data) {
    const schema = Object.assign({}, genericSchema);
    const copyItems = ["tags", "summary", "description", "operationId"];
    this.copyProps(data, schema, copyItems, true);
    if (data.parameters) this.parseParameters(schema, data.parameters);
    const body = this.parseBody(data.requestBody);
    if (body) schema.body = body;
    const response = this.parseResponses(data.responses);
    if (response) {
      schema.response = response;
    }
    return schema;
  }

  processOperation(path, operation, operationSpec, genericSchema) {
    const route = {
      method: operation.toUpperCase(),
      url: this.makeURL(path),
      schema: this.makeSchema(genericSchema, operationSpec),
      operationId:
        operationSpec.operationId || this.makeOperationId(operation, path),
      openapiSource: operationSpec,
      security: this.parseSecurity(
        operationSpec.security || this.spec.security
      ),
    };
    this.config.routes.push(route);
  }

  processPaths(paths) {
    const copyItems = ["summary", "description"];
    for (const path in paths) {
      let genericSchema = {};
      let pathSpec = paths[path];

      this.copyProps(pathSpec, genericSchema, copyItems, true);
      if (typeof pathSpec.parameters === "object") {
        this.parseParameters(genericSchema, pathSpec.parameters);
      }
      for (const pathItem in pathSpec) {
        if (HttpOperations.has(pathItem)) {
          this.processOperation(
            path,
            pathItem,
            pathSpec[pathItem],
            genericSchema
          );
        }
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
        case "components":
          if (spec.components.securitySchemes) {
            this.config.securitySchemes = spec.components.securitySchemes;
          } // the missing break is on purpose !
        default:
          this.config.generic[item] = spec[item];
      }
    }
    return this.config;
  }
}

