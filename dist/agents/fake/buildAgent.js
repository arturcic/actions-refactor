import * as path from 'node:path';
import path__default from 'node:path';
import * as process from 'node:process';
import process__default from 'node:process';
import * as util from 'node:util';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import fs__default from 'node:fs';
import os from 'node:os';
import { s as semver } from './vendor.js';

const isFilePath = (cmd) => {
  return cmd.includes(path.sep) ? path.resolve(cmd) : void 0;
};
const access = async (filePath) => {
  return new Promise((resolve) => fs.access(filePath, fs.constants.X_OK, (err) => resolve(err ? void 0 : filePath)));
};
const isExecutable = async (absPath, options = {}) => {
  const envVars = options.env || process.env;
  const extension = (envVars.PATHEXT || "").split(path.delimiter).concat("");
  const bins = await Promise.all(extension.map(async (ext) => access(absPath + ext)));
  return bins.find((bin) => !!bin);
};
const getDirsToWalkThrough = (options) => {
  const envVars = options.env || process.env;
  const envName = process.platform === "win32" ? "Path" : "PATH";
  const envPath = envVars[envName] || "";
  return envPath.split(path.delimiter).concat(options.include || []).filter((p) => !(options.exclude || []).includes(p));
};
async function lookPath(command, opt = {}) {
  const directPath = isFilePath(command);
  if (directPath)
    return isExecutable(directPath, opt);
  const dirs = getDirsToWalkThrough(opt);
  const bins = await Promise.all(dirs.map(async (dir) => isExecutable(path.join(dir, command), opt)));
  return bins.find((bin) => !!bin);
}

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
    const val = process__default.env[name] || "";
    return val.trim();
  }
  getVariableAsPath(name) {
    return path__default.resolve(path__default.normalize(this.getVariable(name)));
  }
  dirExists(file) {
    return fs__default.existsSync(file) && fs__default.statSync(file).isDirectory();
  }
  fileExists(file) {
    return fs__default.existsSync(file) && fs__default.statSync(file).isFile();
  }
  async cacheDir(sourceDir, tool, version, arch) {
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
    const cacheRoot = this.getCacheRootDir();
    if (!cacheRoot) {
      this.debug("cache root not set");
      return Promise.resolve("");
    }
    version = semver.clean(version) || version;
    const destPath = path__default.join(cacheRoot, tool, version, arch);
    if (this.dirExists(destPath)) {
      this.debug(`Destination directory ${destPath} already exists, removing`);
      fs__default.rmSync(destPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1e3 });
    }
    this.debug(`Copying ${sourceDir} to ${destPath}`);
    fs__default.mkdirSync(destPath, { recursive: true });
    fs__default.cpSync(sourceDir, destPath, { recursive: true, force: true });
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
    const cacheRoot = this.getCacheRootDir();
    if (!cacheRoot) {
      this.debug("cache root not set");
      return null;
    }
    versionSpec = semver.clean(versionSpec) || versionSpec;
    this.info(`Looking for local tool ${toolName}@${versionSpec} (${arch})`);
    const toolPath = path__default.join(cacheRoot, toolName, versionSpec, arch);
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
    return "Local";
  }
  addPath(toolPath) {
    const newPath = toolPath + path.delimiter + process.env["PATH"];
    this.debug(`new Path: ${newPath}`);
    process.env["PATH"] = newPath;
    this.info(`Updated PATH: ${process.env["PATH"]}`);
  }
  debug = (message) => console.log(`[debug] ${message}`);
  info = (message) => console.log(`[info] - ${message}`);
  warn = (message) => console.warn(`[warn] - ${message}`);
  error = (message) => console.error(`[error] - ${message}`);
  async exec(cmd, args) {
    const exec$1 = util.promisify(exec);
    try {
      const { stdout, stderr } = await exec$1(`${cmd} ${args.join(" ")}`);
      return Promise.resolve({
        code: 0,
        error: null,
        stderr,
        stdout
      });
    } catch (e) {
      const error = e;
      return Promise.resolve({
        code: error.code,
        error,
        stderr: error.stderr,
        stdout: error.stdout
      });
    }
  }
  getSourceDir = () => this.getVariableAsPath("AGENT_SOURCE_DIR");
  getTempRootDir = () => this.getVariableAsPath("AGENT_TEMP_DIR");
  getCacheRootDir = () => this.getVariableAsPath("AGENT_TOOLS_DIR");
  setFailed = (message, done) => this.error(`setFailed - ${message} - ${done}`);
  setOutput = (name, value) => this.debug(`setOutput - ${name} - ${value}`);
  setSucceeded = (message, done) => this.info(`setSucceeded - ${message} - ${done}`);
  setVariable(name, value) {
    this.debug(`setVariable - ${name} - ${value}`);
    process.env[name] = value;
  }
  async which(tool, _check) {
    this.debug(`looking for tool '${tool}' in PATH`);
    let toolPath = await lookPath(tool);
    if (toolPath) {
      toolPath = path.resolve(toolPath);
      this.debug(`found tool '${tool}' in PATH: ${toolPath}`);
      return Promise.resolve(toolPath);
    }
    throw new Error(`Unable to locate executable file: ${tool}`);
  }
}

export { BuildAgent };
//# sourceMappingURL=buildAgent.js.map
