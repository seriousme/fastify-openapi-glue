class Security {
    constructor() { }

    async goodAuthCheck(req, reply, params) {
        // Do nothing--auth check succeeds!
    }

    async failingAuthCheck(req, reply, params) {
        throw 'API key was invalid or not found';
    }

}

module.exports = new Security();
