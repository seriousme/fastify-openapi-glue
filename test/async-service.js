// async service provider example
const service = require("./service.js");
module.exports = async opts => new Promise(resolve => resolve(service(opts)));
