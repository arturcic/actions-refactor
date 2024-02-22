import { t as task } from './vendor.js';
import { B as BuildAgentBase } from '../../common/agents.js';

class BuildAgent extends BuildAgentBase {
  agentName = "Azure Pipelines";
  sourceDirVariable = "BUILD_SOURCESDIRECTORY";
  tempDirVariable = "AGENT_TEMPDIRECTORY";
  cacheDirVariable = "AGENT_TOOLSDIRECTORY";
  addPath(inputPath) {
    super.addPath(inputPath);
    console.log(`##vso[task.prependpath]${inputPath}`);
  }
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
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
