import { c as coreExports, w as which_1, g as getExecOutput_1 } from './vendor.js';
import { B as BuildAgentBase } from '../../common/agents.js';

class BuildAgent extends BuildAgentBase {
  get agentName() {
    return "GitHub Actions";
  }
  get sourceDir() {
    return this.getVariableAsPath("GITHUB_WORKSPACE");
  }
  get tempDir() {
    return this.getVariableAsPath("RUNNER_TEMP");
  }
  get cacheDir() {
    return this.getVariableAsPath("RUNNER_TOOL_CACHE");
  }
  addPath = (inputPath) => coreExports.addPath(inputPath);
  debug = (message) => coreExports.debug(message);
  info = (message) => coreExports.info(message);
  warn = (message) => coreExports.warning(message);
  error = (message) => coreExports.error(message);
  async exec(exec, args) {
    const dotnetPath = await which_1(exec, true);
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
  which = async (tool, check) => which_1(tool, check);
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
