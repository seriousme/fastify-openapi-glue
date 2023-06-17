<h1 align="center">fastify-openapi-glue</h1>

## operationResolver
The easiest way to use `fastify-openapi-glue` is to use the [serviceHandlers](serviceHandlers.md) option.

However if you need more flexibility in mapping operationId's to methods then the `operationResolver` can be convenient.

You provide a function and that function returns the method that will handle the request.

An example of a simple resolver is:
```javascript
function (operationId) {
  if (operationId in myObject) {
    return myObject[operationId];
  }
};
```
But you can make the logic as complex as you like. 

In this example `myObject[operationId]` can point to a function, e.g.:

```javascript
const myObject = { getPetbyId: async () => { pet: "Doggie the dog" }}
```

But you can also point it to a full fastify route definition, e.g.:
```javascript
const myObject = { getPetbyId: {
    onSend: async (req, res) => {
      res.code(304);
      return null;
    },
    handler: async () => {
      return { pet: "Doggie the dog" };
    },
  };
}
```
