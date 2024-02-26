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
  error = (message) => task.error(message);
  setSucceeded = (message, done) => task.setResult(task.TaskResult.Succeeded, message, done);
  setFailed = (message, done) => task.setResult(task.TaskResult.Failed, message, done);
  setOutput = (name, value) => task.setVariable(name, value, false, true);
  setVariable = (name, value) => task.setVariable(name, value);
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
