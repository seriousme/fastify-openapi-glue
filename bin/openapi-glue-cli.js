#!/usr/bin/env node

const path = require("path");
const Generator = require("../lib/generator");
const argvParser = require("minimist");

function usage() {
  console.log(`
Usage:
  ${path.basename(__filename)} [options] <openapi specification>
  
Generate a project based on the provided openapi specification.
Any existing files in the project folder will be overwritten!

Options:

  -p <name>                   The name of the project to generate
  --projectName=<name>        [default: ${argvOptions.default.projectName}]
                              
  -b <dir> --baseDir=<dir>    Directory to generate the project in.
                              This directory must already exist.
                              [default: "."]
 
 The following options are only usefull for testing the openapi-glue plugin:
  -c --checksumOnly           Don't generate the project on disk but
                              return checksums only. 
  -l --localPlugin            Use a local path to the plugin. 
                        
`);
  process.exit(1);
}

const argvOptions = {
  string: ["baseDir", "projectName", "_"],
  boolean: ["checksumOnly", "localPlugin"],
  alias: {
    baseDir: "b",
    projectName: "p",
    checksumOnly: "c",
    localPlugin: "l"
  },

  default: {
    projectName: "generatedProject",
    baseDir: process.cwd(),
    checksumOnly: false,
    localPlugin: false
  }
};

const argv = argvParser(process.argv.slice(2), argvOptions);
argv.specification = argv._.shift();

if (!argv.specification) {
  usage();
}

const specPath = path.resolve(process.cwd(), argv.specification);
const generator = new Generator(argv.checksumOnly, argv.localPlugin);
const handler = str => (argv.checksumOnly ? JSON.stringify(str, null, 2) : str);
if (generator.localPlugin) {
  console.log(`Using local plugin at: ${generator.localPlugin}
  `);
}

generator
  .parse(specPath)
  .then(_ =>
    console.log(
      handler(generator.generateProject(argv.baseDir, argv.projectName))
    )
  )
  .catch(e => console.log(e.message));
