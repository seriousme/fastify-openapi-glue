// ES6 Module implementation of the operations in the openapi specification

export class Service {
	async postMultipleBodyMimeTypes(req) {
		if (req.body.str1 !== "string" && req.body.int1 !== 2) {
			throw new Error(
				"req.body.str1 is not a string or req.body.int1 is not 2",
			);
		}
		return "";
	}
	async getMultipleResponseMimeTypes(req, reply) {
		if (req.query.responseType === "application/json") {
			reply.type("application/json");
			return { str1: "test data" };
		}
		reply.type("text/json");
		return { int1: 2 };
	}
}
