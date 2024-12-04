const emptyScheme = Symbol("emptyScheme");

export class SecurityError extends Error {
	constructor(message, statusCode, name, errors) {
		super(message);
		this.statusCode = statusCode;
		this.name = name;
		this.errors = errors;
	}
}

export class SecurityHandlers {
	/** constructor */
	constructor(handlers) {
		this.handlers = handlers;
		this.handlerMap = new Map();
		this.missingHandlers = [];
	}

	add(schemes) {
		if (!(schemes?.length > 0)) {
			return false;
		}
		const mapKey = JSON.stringify(schemes);
		if (!this.handlerMap.has(mapKey)) {
			for (const schemeList of schemes) {
				for (const name in schemeList) {
					if (!(name in this.handlers)) {
						this.handlers[name] = () => {
							throw `Missing handler for "${name}" validation`;
						};
						this.missingHandlers.push(name);
					}
				}
			}
			this.handlerMap.set(mapKey, this._buildHandler(schemes));
		}
		return this.handlerMap.has(mapKey);
	}

	get(schemes) {
		const mapKey = JSON.stringify(schemes);
		return this.handlerMap.get(mapKey);
	}

	has(schemes) {
		const mapKey = JSON.stringify(schemes);
		return this.handlerMap.has(mapKey);
	}

	getMissingHandlers() {
		return this.missingHandlers;
	}

	_buildHandler(schemes) {
		const securityHandlers = this.handlers;
		return async (req, reply) => {
			const handlerErrors = [];
			const schemeListDone = [];
			let statusCode = 401;
			for (const schemeList of schemes) {
				let name;
				const andList = [];
				try {
					for (name in schemeList) {
						const parameters = schemeList[name];
						andList.push(name);
						// all the handlers in a scheme list must succeed
						await securityHandlers[name](req, reply, parameters);
					}
					return; // If one list of schemes passes, no need to try any others
				} catch (err) {
					req.log.debug(`Security handler '${name}' failed: '${err}'`);
					handlerErrors.push(err);
					if (err.statusCode !== undefined) {
						statusCode = err.statusCode;
					}
				}
				schemeListDone.push(andList.toString());
			}
			// if we get this far no security handlers validated this request
			throw new SecurityError(
				`None of the security schemes (${schemeListDone.join(
					", ",
				)}) successfully authenticated this request.`,
				statusCode,
				"Unauthorized",
				handlerErrors,
			);
		};
	}
}
