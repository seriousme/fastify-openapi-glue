const utils = require("../templateUtils");

module.exports = data => `// implementation of the operations in the openapi specification

class Service {
  constructor() {}

${data.routes
  .map(
    route => `

  // Operation: ${route.operationId}
  // URL: ${route.url}
  // summary:  ${route.schema.summary}
${utils.comments(route)}
  async ${route.operationId}(req, reply) {
    console.log("${route.operationId}", req.params);
    return { key: "value" };
  }`
  )
  .join("\n")}
}

module.exports = opts => new Service(opts);
`;
