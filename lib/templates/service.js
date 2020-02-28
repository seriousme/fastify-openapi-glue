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
  const content = route
    .map(method => `fastify.route({
  method: '${method.method}',
  url: '${method.url}',
  schema: ${JSON.stringify(formatSchema(method.schema), null, 2)},
  handler: (request, reply) => {}
})
`).join('\n')
  return content
} //todo ajouter les exports

const generateFiles = routes => {
  const names = []
  const files = []
  let index = ''

  for (const route of Object.keys(routes)) {
    if (route === '/') {
      index = generateFileContent(routes[route])
    } else {
      const fname = route.substr(1)
      names.push(fname)
      let content  = generateFileContent(routes[route])

      content = `module.exports = (fastify, opts)=>{
        ${content}
      }`
      files.push({ filename: `${fname}.js`, content })
    }
  }
  files.push({ filename: 'index.js', content: makeIndex(index, names) })
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
