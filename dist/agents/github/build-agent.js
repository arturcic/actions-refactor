import { c as coreExports, g as getExecOutput_1 } from './vendor.js';
import { B as BuildAgentBase } from '../../common/agents.js';

class BuildAgent extends BuildAgentBase {
  agentName = "GitHub Actions";
  sourceDirVariable = "GITHUB_WORKSPACE";
  tempDirVariable = "RUNNER_TEMP";
  cacheDirVariable = "RUNNER_TOOL_CACHE";
  addPath(inputPath) {
    super.addPath(inputPath);
    return coreExports.addPath(inputPath);
  }
  debug = (message) => coreExports.debug(message);
  info = (message) => coreExports.info(message);
  warn = (message) => coreExports.warning(message);
  error = (message) => coreExports.error(message);
  async exec(exec, args) {
    const dotnetPath = await super.which(exec, true);
    const { exitCode, stdout, stderr } = await getExecOutput_1(`"${dotnetPath}"`, args);
    return {
      code: exitCode,
      error: null,
      stderr,
      stdout
    };
  }
  setFailed = (message, _) => coreExports.setFailed(message);
  setOutput = (name, value) => coreExports.setOutput(name, value);
  setSucceeded(_message, _done) {
  }
  setVariable = (name, value) => coreExports.exportVariable(name, value);
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
