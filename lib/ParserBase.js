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
    //return schemes ? schemes.map((item) => Object.keys(item)[0]) : undefined;
  }
}
