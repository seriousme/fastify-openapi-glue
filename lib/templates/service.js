import { comments } from "../templateUtils.js";

export default data => `// implementation of the operations in the openapi specification

class Service {
  constructor() {}

${data.routes
  .map(
    route => `

  // Operation: ${route.operationId}
  // URL: ${route.url}
  // summary:  ${route.schema.summary}
${comments(route)}
  async ${route.operationId}(req, reply) {
    console.log("${route.operationId}", req.params);
    return { key: "value" };
  }`
  )
  .join("\n")}
}

module.exports = opts => new Service(opts);
`;
