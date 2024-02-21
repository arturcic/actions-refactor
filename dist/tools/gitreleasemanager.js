import { p as parseCliArgs, g as getAgent } from '../common/tools.js';

class Runner {
  agent;
  async execute() {
    const { command, buildAgent } = parseCliArgs();
    this.agent = await getAgent(buildAgent);
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

const runner = new Runner();
await runner.execute();
//# sourceMappingURL=gitreleasemanager.js.map
