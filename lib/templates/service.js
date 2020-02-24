const utils = require("../templateUtils");
//=> [{"filename": "content"}]

function generateFileContent (route){
  const functions = [];
  let content = route.map(
    method=>{
      functions.push(method.operationId)
      return `/*
  Operation: ${method.operationId}
  URL: ${method.url}
  Summary: ${method.schema.summary}
  ${utils.comments(method)}*/
async function ${method.operationId}(req, reply){
  console.log("${method.operationId}", req.params)
  return {"key":"value"}
}
`
    }).join("\n")
    return {content, functions}
}//todo ajouter les exports

const generateFiles = (routes)=>{
  const names = [];
  const files = [];
  let index = {content: "", functions: []};

  for (const route of Object.keys(routes)) {
    if(route === "/"){
      index = generateFileContent(routes[route])
    } else {
      const fname = route.substr(1);
      names.push(fname);
      let {content, functions} = generateFileContent(routes[route])

      content += `
module.exports = {
  ${functions.join(",\n")}
}`
      files.push({filename: `${fname}.js`, content})
    }
  }
  files.push({filename: "index.js", content: makeIndex(index, names)});
  return files;
}

const makeIndex = ({content, functions}, files)=>`${files.map(
  f=>`const ${f} = require("./${f}")`
).join("\n")}
${content}

module.exports = (opts)=>({
${files.map(f=>`...${f}`).join(",\n")},
${functions.join(",\n")}
})`

module.exports = generateFiles