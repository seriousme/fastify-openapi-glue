const utils = require('../templateUtils')
//=> [{"filename": "content"}]
function formatSchema(obj){
  let newObj = {...obj} 
  if(newObj.response || newObj.body || newObj.params){
    utils.stripResponseFormats(newObj);
  }
  return newObj
}
function generateFileContent(route) {
  const schema = {}
  const content = route
    .map(method => {
      schema[method.operationId] = formatSchema(method.schema)
      return `fastify.route({
  method: '${method.method}',
  url: '${method.url}',
  schema: schema['${method.operationId}'],
  handler: async (request, reply) => {}
})
`}).join('\n')
  return {content, schema: JSON.stringify(schema, null, 2)}
} //todo ajouter les exports

const generateFiles = routes => {
  const names = []
  const files = []
  let index = ''
  let idxSchema = {};

  for (const route of Object.keys(routes)) {
    if (route === '/') {
      const tmp = generateFileContent(routes[route])
      index = tmp.content
      idxSchema = tmp.schema
    } else {
      const fname = route.substr(1)
      names.push(fname)
      let {content, schema}  = generateFileContent(routes[route])

      content = `const schema = require('./routeConfig.json')

module.exports = (fastify, opts)=>{
  ${content}
}`

      files.push({type: 'folder', name: fname})
      files.push({type: 'file', folder: fname, filename: 'index.js', content })
      files.push({type: 'file', folder:fname, filename: 'routeConfig.json', content:schema})
    }
  }
  files.push({type: "file", folder:'', filename: 'index.js', content: makeIndex(index, names) })
  if(index){
    files.push({type: "file", folder:'', filename: 'routeConfig.json', content: idxSchema})
  }
  return files
}

const makeIndex = (content, files) => `const fp = require("fastify-plugin")
${files
  .map(f => `const ${f} = require("./${f}")`)
  .join('\n')}

${content && `function registerIndex(fastify, opts){
  ${content}
}`}

function registerRoutes(fastify, opts, next){
${files.map(f=>`  ${f}(fastify, opts)`).join('\n')}
  ${content &&`registerIndex(fastify, opts)`}
  next()
}

module.exports = fp(registerRoutes)`

module.exports = generateFiles
