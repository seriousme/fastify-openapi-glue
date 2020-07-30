// a class for parsing openapi v3 data into config data for fastify
const HttpOperations = new Set([
  "delete",
  "get",
  "head",
  "patch",
  "post",
  "put",
  "options"
]);

class parserV3 {
  constructor() {
    this.config = { generic: {}, routes: [], contentTypes: new Set() };
  }

  makeOperationId(operation, path) {
    // make a nice camelCase operationID
    // e.g. get /user/{name}  becomes getUserByName
    const firstUpper = str => str.substr(0, 1).toUpperCase() + str.substr(1);
    const by = (matched, p1) => "By" + firstUpper(p1);
    const parts = path.split("/").slice(1);
    const opId = parts
      .map((item, i) => (i > 0 ? firstUpper(item) : item))
      .join("")
      .replace(/{(\w+)}/g, by)
      .replace(/[^a-z]/gi, "");
    return opId;
  }

  makeURL(path) {
    // fastify wants 'path/:param' instead of openapis 'path/{param}'
    return path.replace(/{(\w+)}/g, ":$1");
  }

  copyProps(source, target, list) {
    list.forEach(item => {
      if (source[item]) target[item] = source[item];
    });
  }

  parseParams(data) {
    const params = {
      type: "object",
      properties: {}
    };
    const required = [];
    data.forEach(item => {
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
    data.forEach(item => {
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
      for (let mimeType in data.content) {
        this.config.contentTypes.add(mimeType);
        schema = data.content[mimeType].schema;
      }
    }
    return schema;
  }

  parseResponses(responses) {
    const result = {};
    let hasResponse = false;
    for (let httpCode in responses) {
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
    this.copyProps(data, schema, copyItems);
    if (data.parameters) this.parseParameters(schema, data.parameters);
    const body = this.parseBody(data.requestBody);
    if (body) schema.body = body;
    const response = this.parseResponses(data.responses);
    if (response) schema.response = response;
    return schema;
  }

  processOperation(path, operation, operationSpec, genericSchema) {
    const route = {
      method: operation.toUpperCase(),
      url: this.makeURL(path),
      schema: this.makeSchema(genericSchema, operationSpec),
      operationId: operationSpec.operationId || this.makeOperationId(operation, path),
      openapiSource: operationSpec
    };

    if (operationSpec.security || this.spec.security) {
      route.security = Object.values(operationSpec.security || this.spec.security).map(obj => Object.keys(obj)[0]);
    }

    this.config.routes.push(route);
  }

  processPaths(paths) {
    const copyItems = ["summary", "description"];
    for (let path in paths) {
      let genericSchema = {};
      let pathSpec = paths[path];

      this.copyProps(pathSpec, genericSchema, copyItems);
      if (typeof pathSpec.parameters === "object") {
        this.parseParameters(genericSchema, pathSpec.parameters);
      }
      for (let pathItem in pathSpec) {
        if (HttpOperations.has(pathItem)) {
          this.processOperation(path, pathItem, pathSpec[pathItem], genericSchema);
        }
      }
    }
  }

  parse(spec) {
    this.spec = spec;

    for (let item in spec) {
      switch (item) {
        case "paths":
          this.processPaths(spec.paths);
          break;
        default:
          this.config.generic[item] = spec[item];
      }
    }
    return this.config;
  }
}

module.exports = parserV3;
