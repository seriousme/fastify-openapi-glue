<h1 align="center">fastify-openapi-glue</h1>

## ServiceHandlers
Each [OpenApi](https://www.openapis.org/) `Operation` object typically contains a unique `operationId` property. E.g. the [PetStore example](../examples/petstore) contains an OpenApi specification](../examples/petstore/petstore-openapi.v3.json) which contains a section:
```json
...
"/pet/{petId}": {
  "get": {
    "tags": ["pet"],
    "summary": "Find pet by ID",
    "description": "Returns a single pet",
    "operationId": "getPetById",
    ...
```

In this Petstore example the `Service` class in [service.js](../examples/petstore/service.js) contains:
```javascript
async getPetById(req, resp) {
		console.log("getPetById", req.params.petId);
		if (req.params.petId === 0) {
			// missing required data on purpose !
			// this will trigger a server error on serialization
			return { pet: "Doggie the dog" };
		}
    ...
```

If you provide this class to the `serviceHandlers` option then `fastify-openapi-glue` will create a configuration for Fastify that will map the path `/pet/{petId}` to the method with the name of the `operationId`, in this case `getPetByID`. All parameters that a caller provides to Fastify will be passed on to the method and any data returned by the method will be returned to the caller. 

### No operationId
If no `operationId` is present in the specification then `fastify-openapi-glue` will try to generate one based on the path and the type of operation.

If you let `fastify-openapi-glue` [generate](../README.md#generator) a project you can see exactly what methods the plugin will look for.

### OperationResolver
If you want to use a different mapping of operationId's to methods then you can use the [operationResolver](operationResolver.md) option.