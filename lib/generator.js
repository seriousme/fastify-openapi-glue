// generator.js
// this could be extended to include examples mocks etc

const { mkdirSync, writeFileSync } = require("fs");
const path = require("path");
const crypto = require("crypto");
const parser = require("./parser");
const pluginPackage = require("../package.json");

function makeDir(dir, dirMode) {
  try {
    mkdirSync(dir, dirMode);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

function pathLocal(from) {
  // on windows the double backslash needs escaping to ensure it correctly shows up in printing
  return path
    .join(path.relative(from, path.join(__dirname, "..")), "index.js")
    .replace(/\\/g, "/");
}

class generator {
  constructor(checksumOnly, localPlugin) {
    this.parser = parser();
    if (localPlugin) {
      this.localPlugin = true;
    }
    if (checksumOnly) {
      this.checksumOnly = true;
    }
    return this;
  }

  async parse(specification) {
    this.config = await this.parser.parse(specification);
    this.specification = this.parser.specification();
    return this;
  }

  groupPaths(reducer, curr){
    const p = curr.url.split("/");

    let key = "/";
    if (p.length > 1){
      key+= p[1];
    }

    reducer[key] = reducer[key] || [];

    reducer[key].push(curr);

    return reducer
  }

  generateService() {
    const makeService = require("./templates/service");
    const routes = this.config.routes.reduce(this.groupPaths, {});
    return makeService(routes);
  }

  generatePlugin(specFile, service, pluginPackageName) {
    pluginPackageName = pluginPackageName || pluginPackage.name;
    const makePlugin = require("./templates/index");
    return makePlugin({ specFile, service, pluginPackageName });
  }

  generatePackage(opts = {}) {
    const newPkg = require("./templates/package.json");
    const copyProps = (target, source, key) => {
      Object.keys(target[key]).forEach(
        item => (target[key][item] = source[key][item])
      );
    };

    const spec = {};
    const info = this.config.generic.info;
    // name and desciption are mandatory in the spec
    spec.name = info.title
      .toLowerCase()
      .replace(/[^a-z0-9_]/, "")
      .substr(0, 214); //npm package name has maxlength of 214

    spec.description = info.description;

    newPkg.name = opts.name || spec.name;
    newPkg.description = opts.description || spec.description;

    // only include dependencies when not calculating checksums
    // to avoid issues with greenkeeper and the likes
    if (!this.checksumOnly) {
      copyProps(newPkg, pluginPackage, "dependencies");
      copyProps(newPkg, pluginPackage, "devDependencies");
    }

    if (!(this.localPlugin || this.checksumOnly)) {
      // add openapi-glue as dependency for the generated code
      newPkg.dependencies[pluginPackage.name] = `^${pluginPackage.version}`;
    }
    return JSON.stringify(newPkg, null, 2);
  }

  // generateTest(specFile, service, plugin) {
  //   const makeTest = require("./templates/test-plugin");
  //   return makeTest(Object.assign(this.config, { specFile, service, plugin }));
  // }

  // generateReadme(project, instructions) {
  //   const makeReadme = require("./templates/README.md");
  //   return makeReadme(project, instructions);
  // }

  generateProject(dir, project) {
    const instructions = require("./templates/instructions.js");
    const contents = (dir, fileName, data) => {
      return {
        path: path.join(dir, fileName),
        data,
        fileName
      };
    };

    const projectDir = path.join(dir, project);
    const servicesDir = path.join(projectDir, "services")

    // const testDir = path.join(projectDir, "test");
    const dirMode = 0o755;

    const specFile = "openApi.json";
    const plugin = "index.js";
    const files = {
      spec: contents(
        projectDir,
        specFile,
        JSON.stringify(this.specification, null, 2)
      ),
      // service: contents(projectDir, serviceFile, this.generateService()),//todo
      plugin: contents(
        projectDir,
        plugin,
        this.generatePlugin(
          specFile,
          "services",
          this.localPlugin ? pathLocal(projectDir) : undefined
        )
      ),
      package: contents(projectDir, "package.json", this.generatePackage()),
      // readme: contents(
      //   projectDir,
      //   "README.md",
      //   this.generateReadme(project, instructions())
      // ),
      // testPlugin: contents(
      //   testDir,
      //   "test-plugin.js",
      //   this.generateTest(specFile, serviceFile, plugin)
      // )
    };

    const services = this.generateService()//.map(({filename, content})=>contents(servicesDir, filename, content))

    const fileOpts = {
      encoding: "utf8",
      mode: 0o644
    };

    this.generated = { files: {}, dirs: [] };
    if (!this.checksumOnly) {
      this.generated.dirs = [];
      makeDir(projectDir, dirMode);
      this.generated.dirs.push(projectDir);
      makeDir(servicesDir, dirMode);
      this.generated.dirs.push(servicesDir);
      // makeDir(testDir, dirMode);
      // this.generated.dirs.push(testDir);
    }

    for (const key of Object.keys(files)) {
      const file = files[key];
      const hash = crypto.createHash("sha256");
      hash.update(file.data);
      this.generated.files[key] = {
        fileName: file.fileName,
        checksum: hash.digest("hex")
      };
      if (!this.checksumOnly) {
        this.generated.files[key].path = file.path;
        writeFileSync(file.path, file.data, fileOpts);
      }
    }

    for (const service of services) {
      if (service.type === 'folder'){
        makeDir(path.join(servicesDir, service.name), dirMode)
        this.generated.dirs.push(service.name)
      } else {
        const c = contents(path.join(servicesDir, service.folder), service.filename, service.content)
        const hash = crypto.createHash("sha256")
        hash.update(c.data)
        this.generated.files[c.fileName] = {
          fileName: c.fileName,
          checksum: hash.digest("hex")
        }
        if(!this.checksumOnly){
          this.generated.files[c.fileName].path = c.path
          writeFileSync(c.path, c.data, fileOpts)
        }
      }
    }

    if (this.checksumOnly) {
      return this.generated;
    }
    return `Your project has been generated in "${project}"
${instructions(project)}`;
  }
}

module.exports = generator;
