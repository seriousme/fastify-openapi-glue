const jsYaml = require("js-yaml");

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

const unknownFormats = { int32: true, int64: true, binary: true };
function stripResponseFormats(schema) {
  for (let item in schema) {
    if (isObject(schema[item])) {
      if (schema[item].format && unknownFormats[schema[item].format]) {
        schema[item].format = undefined;
      }
      stripResponseFormats(schema[item]);
    }
  }
}

const utils = {
  comments(route) {
    const items = {
      "req.headers": route.schema.headers,
      "req.params": route.schema.params,
      "req.query": route.schema.querystring,
      "req.body": route.schema.body,
      "valid responses": route.openapiSource.responses
    };

    const commentize = label => {
      const data = items[label];
      if (!data) return "";
      const dataStrings = jsYaml.safeDump(data).split("\n");
      return `  ${label}
${dataStrings
        .map(item => (item.length > 0 ? `   ${item}` : ``))
        .join("\n")}
`;
    };

    const result = Object.keys(items).reduce(
      (acc, label) => acc + commentize(label),
      ""
    );
    return result;
  },
  stripResponseFormats
};



module.exports = utils;
