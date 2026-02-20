#!/usr/bin/env node

import { basename, resolve } from "node:path";
import { exit } from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Generator } from "../lib/generator.js";

const __filename = fileURLToPath(import.meta.url);

const validTypes = new Set(["javascript", "standaloneJS"]);

function usage() {
	console.log(`
Usage:
  ${basename(__filename)} [options] <openapi specification>
  
Generate a project based on the provided openapi specification.
Any existing files in the project folder will be overwritten!

Options:

  -p <name>                   The name of the project to generate
  --projectName=<name>        [default: ${process.cwd()}]
                              
  -b <dir> --baseDir=<dir>    Directory to generate the project in.
                              This directory must already exist.
                              [default: "."]

  -t <type> --type=<type>     Type of project to generate, possible options:
                              javascript (default)
                              standaloneJS
 
 The following options are only usefull for testing the openapi-glue plugin:
  -c --checksumOnly           Don't generate the project on disk but
                              return checksums only. 
  -l --localPlugin           Use a local path to the plugin. 
                        
`);
	exit(1);
}

const options = {
	baseDir: {
		type: "string",
		short: "b",
		default: process.cwd(),
	},
	projectName: {
		type: "string",
		short: "p",
	},
	type: {
		type: "string",
		short: "t",
		default: "javascript",
	},
	checksumOnly: {
		type: "boolean",
		short: "c",
		default: false,
	},
	localPlugin: {
		type: "boolean",
		short: "l",
		default: false,
	},
};

const { values: argv, positionals } = parseArgs({
	options,
	allowPositionals: true,
});

argv.specification = positionals[0];

if (!argv.specification) {
	usage();
}

if (!validTypes.has(argv.type)) {
	console.log(`Unknown type: ${argv.type}`);
	usage();
}

const projectName = argv.projectName || `generated-${argv.type}-project`;
const specPath = resolve(process.cwd(), argv.specification);
const generator = new Generator(argv.checksumOnly, argv.localPlugin);
const handler = (str) =>
	/* node:coverage ignore next */
	argv.checksumOnly ? JSON.stringify(str, null, "\t") : str;
if (generator.localPlugin) {
	console.log(`Using local plugin at: ${generator.localPlugin}
  `);
}

try {
	await generator.parse(specPath);
	console.log(
		handler(
			await generator.generateProject(argv.baseDir, projectName, argv.type),
		),
	);
} catch (e) {
	console.log(e.message);
	exit(1);
}
