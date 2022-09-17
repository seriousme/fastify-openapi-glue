// baseclass for the v2 and v3 parsers

export class ParserBase {
  constructor() {
    this.config = { generic: {}, routes: [], contentTypes: new Set() };
  }

  makeOperationId(operation, path) {
    // make a nice camelCase operationID
    // e.g. get /user/{name}  becomes getUserByName
    const firstUpper = (str) => str.substr(0, 1).toUpperCase() + str.substr(1);
    const by = (matched, p1) => "By" + firstUpper(p1);
    const parts = path.split("/").slice(1);
    parts.unshift(operation);
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

  copyProps(source, target, list, copyXprops = false) {
    Object.keys(source).forEach((item) => {
      if (list.includes(item) || (copyXprops && item.startsWith("x-"))) {
        target[item] = source[item];
      }
    });
  }

  parseSecurity(schemes) {
    return schemes
      ? schemes.map((item) => {
          const name = Object.keys(item)[0];
          return {
            name,
            parameters: item[name],
          };
        })
      : undefined;
  }

  removeRecursion(schemas) {
    function escapeJsonPointer(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }

    function processSchema(obj) {
      let refAdded = false;

      function inspectNode(obj, path, paths) {
        if (typeof obj === "object" && obj !== null) {
          if (paths.has(obj)) {
            return paths.get(obj);
          }
          const newPaths = new Map(paths);
          newPaths.set(obj, path);
          for (const key in obj) {
            const $ref = inspectNode(
              obj[key],
              `${path}/${escapeJsonPointer(key)}`,
              newPaths
            );
            if (typeof $ref === "string") {
              obj[key] = { $ref };
              refAdded = true;
            }
          }
        }
        return undefined;
      }

      const paths = new Map();
      inspectNode(obj, "#", paths);
      // AJV requires an $id attribute for references to work
      if (refAdded && typeof obj["$id"] === "undefined") {
        obj["$id"] = "http://example.com/fastifySchema";
      }
    }

    for (const item in schemas) {
      const schema = schemas[item];
      // the response schema in fastify is in the form of "response->200->schema"
      // it needs to be dereffed per HTTP response code
      if (item === "response") {
        for (const responseCode in schema) {
          processSchema(schema[responseCode]);
        }
      } else {
        // all others are in the form of "body->schema" or "query->schema" etc
        processSchema(schema);
      }
    }
  }
}
