import { s as semver, p as prependPath_1, t as task } from './vendor.js';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

class BuildAgentBase {
  getInput(input, required) {
    input = input.replace(/ /g, "_").toUpperCase();
    const val = this.getVariable(`INPUT_${input}`);
    if (required && !val) {
      throw new Error(`Input required and not supplied: ${input}`);
    }
    return val.trim();
  }
  getBooleanInput(input, required) {
    const inputValue = this.getInput(input, required);
    return (inputValue || "false").toLowerCase() === "true";
  }
  getListInput(input, required) {
    return this.getInput(input, required).split("\n").filter((x) => x !== "");
  }
  getVariable(name) {
    this.debug(`getVariable - ${name}`);
    const val = process.env[name] || "";
    return val.trim();
  }
  getVariableAsPath(name) {
    return path.resolve(path.normalize(this.getVariable(name)));
  }
  dirExists(file) {
    return fs.existsSync(file) && fs.statSync(file).isDirectory();
  }
  fileExists(file) {
    return fs.existsSync(file) && fs.statSync(file).isFile();
  }
  async cacheToolDir(sourceDir, tool, version, arch) {
    arch = arch || os.arch();
    if (!tool) {
      throw new Error("tool is a required parameter");
    }
    if (!version) {
      throw new Error("version is a required parameter");
    }
    if (!sourceDir) {
      throw new Error("sourceDir is a required parameter");
    }
    const cacheRoot = this.cacheDir;
    if (!cacheRoot) {
      this.debug("cache root not set");
      return Promise.resolve("");
    }
    version = semver.clean(version) || version;
    const destPath = path.join(cacheRoot, tool, version, arch);
    if (this.dirExists(destPath)) {
      this.debug(`Destination directory ${destPath} already exists, removing`);
      fs.rmSync(destPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1e3 });
    }
    this.debug(`Copying ${sourceDir} to ${destPath}`);
    fs.mkdirSync(destPath, { recursive: true });
    fs.cpSync(sourceDir, destPath, { recursive: true, force: true });
    this.debug(`Caching ${tool}@${version} (${arch}) from ${sourceDir}`);
    return Promise.resolve(destPath);
  }
  findLocalTool(toolName, versionSpec, arch) {
    arch = arch || os.arch();
    if (!toolName) {
      throw new Error("toolName is a required parameter");
    }
    if (!versionSpec) {
      throw new Error("versionSpec is a required parameter");
    }
    const cacheRoot = this.cacheDir;
    if (!cacheRoot) {
      this.debug("cache root not set");
      return null;
    }
    versionSpec = semver.clean(versionSpec) || versionSpec;
    this.info(`Looking for local tool ${toolName}@${versionSpec} (${arch})`);
    const toolPath = path.join(cacheRoot, toolName, versionSpec, arch);
    if (!this.dirExists(toolPath)) {
      this.info(`Directory ${toolPath} not found`);
      return null;
    } else {
      this.info(`Found tool ${toolName}@${versionSpec} (${arch})`);
    }
    return toolPath;
  }
}

class BuildAgent extends BuildAgentBase {
  get agentName() {
    return "Azure Pipelines";
  }
  get sourceDir() {
    return this.getVariableAsPath("Build.SourcesDirectory");
  }
  get tempDir() {
    return this.getVariableAsPath("Agent.TempDirectory");
  }
  get cacheDir() {
    return this.getVariableAsPath("Agent.ToolsDirectory");
  }
  addPath = (inputPath) => prependPath_1(inputPath);
  debug = (message) => task.debug(message);
  info = (message) => task.debug(message);
  warn = (message) => task.warning(message);
  error = (message) => task.error(message);
  async exec(exec, args) {
    const tr = task.tool(exec);
    tr.arg(args);
    const result = tr.execSync();
    return Promise.resolve({
      code: result.code,
      error: result.error,
      stderr: result.stderr,
      stdout: result.stdout
    });
  }
  setFailed = (message, done) => task.setResult(task.TaskResult.Failed, message, done);
  setOutput = (name, value) => task.setVariable(name, value, false, true);
  setSucceeded = (message, done) => task.setResult(task.TaskResult.Succeeded, message, done);
  setVariable = (name, value) => task.setVariable(name, value);
  which = async (tool, check) => Promise.resolve(task.which(tool, check));
}

export { BuildAgent };
//# sourceMappingURL=buildAgent.js.map
