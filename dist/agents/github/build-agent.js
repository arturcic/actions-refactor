import { c as coreExports } from './vendor.js';
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
  error = (message) => coreExports.error(message);
  setSucceeded(_message, _done) {
  }
  setFailed = (message, _) => coreExports.setFailed(message);
  setOutput = (name, value) => coreExports.setOutput(name, value);
  setVariable = (name, value) => coreExports.exportVariable(name, value);
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
