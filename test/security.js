async function goodAuthCheck(req, reply) {
    // Do nothing--auth check succeeds!
}

async function failingAuthCheck(req, reply) {
    throw new Error('API key was invalid or not found');
}

module.exports = {
    goodAuthCheck,
    failingAuthCheck
}