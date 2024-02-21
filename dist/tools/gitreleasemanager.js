import { p as parseCliArgs, g as getAgent } from '../common/tools.js';

class Runner {
  constructor(agent) {
    this.agent = agent;
  }
  async execute(command) {
    switch (command) {
      case "setup":
        await this.setup();
        break;
    }
  }
  async setup() {
    try {
      this.agent.info(`Running on: '${this.agent.agentName}'`);
      this.agent.debug("Disabling telemetry");
    } catch (error) {
      console.log(error);
    }
  }
}

const { command, buildAgent } = parseCliArgs();
const agent = await getAgent(buildAgent);
const runner = new Runner(agent);
await runner.execute(command);
//# sourceMappingURL=gitreleasemanager.js.map
