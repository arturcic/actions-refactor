import * as path from 'node:path';
import * as process from 'node:process';
import * as util from 'node:util';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import { B as BuildAgentBase } from '../../common/agents.js';

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

class BuildAgent extends BuildAgentBase {
  get agentName() {
    return "Local";
  }
  get sourceDir() {
    return this.getVariableAsPath("AGENT_SOURCE_DIR");
  }
  get tempDir() {
    return this.getVariableAsPath("AGENT_TEMP_DIR");
  }
  get cacheDir() {
    return this.getVariableAsPath("AGENT_TOOLS_DIR");
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
