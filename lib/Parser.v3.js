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

const explodingTypes = new Set(["object", "array"]);

export class ParserV3 extends ParserBase {
  constructor() {
    super(); // Now 'this' is initialized by calling the parent constructor.
  }

  parseQueryString(data) {
    if (
      data.length === 1 &&
      data[0].explode !== false &&
      typeof data[0].schema === "object" &&
      explodingTypes.has(data[0].schema.type)
    ) {
      return data[0].schema;
    }
    return this.parseParams(data);
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
      schema.querystring = this.parseQueryString(querystring);
    if (headers.length > 0) schema.headers = this.parseParams(headers);
  }

  parseBody(data) {
    if (data && data.content) {
      const mimeTypes = Object.keys(data.content);
      if (mimeTypes.length === 0) {
        return undefined;
      }
      mimeTypes.forEach((mimeType) => this.config.contentTypes.add(mimeType));
      // fastify only supports one mimeType per path, pick the last
      return data.content[mimeTypes.pop()].schema;
    }
    return undefined;
  }

  parseResponses(responses) {
    const result = {};
    for (const httpCode in responses) {
      const body = this.parseBody(responses[httpCode]);
      if (body !== undefined) {
        result[httpCode] = body;
      }
    }
    return result;
  }

  makeSchema(genericSchema, data) {
    const schema = Object.assign({}, genericSchema);
    const copyItems = ["tags", "summary", "description", "operationId"];
    this.copyProps(data, schema, copyItems, true);
    if (data.parameters) this.parseParameters(schema, data.parameters);
    const body = this.parseBody(data.requestBody);
    if (body) {
      schema.body = body;
    }
    const response = this.parseResponses(data.responses);
    if (Object.keys(response).length > 0) {
      schema.response = response;
    }

    this.removeRecursion(schema);
    return schema;
  }

  processOperation(path, operation, operationSpec, genericSchema) {
    const route = {
      method: operation.toUpperCase(),
      url: this.makeURL(path),
      schema: this.makeSchema(genericSchema, operationSpec),
      openapiPath: path,
      operationId:
        operationSpec.operationId || this.makeOperationId(operation, path),
      openapiSource: operationSpec,
      security: this.parseSecurity(
        operationSpec.security || this.spec.security
      ),
    };

    if (operationSpec["x-fastify-config"]) {
      route.config = operationSpec["x-fastify-config"];
    }

    this.config.routes.push(route);
  }

  processPaths(paths) {
    const copyItems = ["summary", "description"];
    for (const path in paths) {
      const genericSchema = {};
      const pathSpec = paths[path];

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
        // eslint-disable-next-line no-fallthrough
        default:
          this.config.generic[item] = spec[item];
      }
    }
    return this.config;
  }
}
