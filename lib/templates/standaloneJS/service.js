import { comments } from "../templateUtils.js";

export default (
	data,
) => `// implementation of the operations in the openapi specification

export class Service {
${data.routes
	.map(
		(route) => `
	// Operation: ${route.operationId}
	// URL: ${route.url}
	// summary:	${route.schema.summary}
${comments(route, 1)}
	async ${route.operationId}(req, _reply) {
		console.log("${route.operationId}", req.params);
		return { key: "value" };
	}`,
	)
	.join("\n")}
}
`;
