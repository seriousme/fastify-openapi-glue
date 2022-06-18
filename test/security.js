class Security {
    constructor() { }

    async goodAuthCheck(req, reply, params) {
        // Do nothing--auth check succeeds!
    }

    async failingAuthCheck(req, reply, params) {
        throw 'API key was invalid or not found';
    }

    async failingAuthCheckCustomStatusCode(req, reply, params) {
        const err = new Error('API key was invalid or not found');
        err.statusCode = 451;
        throw err;
    }

}

export default new Security();
