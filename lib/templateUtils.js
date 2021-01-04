const jsYaml = require("js-yaml");

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
      const dataStrings = jsYaml.dump(data).split("\n");
      return `  // ${label}
${dataStrings
        .map(item => (item.length > 0 ? `  //   ${item}` : `  //`))
        .join("\n")}
`;
    };

    const result = Object.keys(items).reduce(
      (acc, label) => acc + commentize(label),
      ""
    );
    return result;
  }
};

module.exports = utils;
