// async service provider example
import service from "./service.js";
export default async opts => new Promise(resolve => resolve(service(opts)));
