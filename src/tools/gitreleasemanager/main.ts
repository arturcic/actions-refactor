import { getAgent } from '@agents/common'
import { parseCliArgs } from '@tools/common'
import { Commands, Runner } from '@tools/gitreleasemanager'

const { command, buildAgent } = parseCliArgs()
const agent = await getAgent(buildAgent)
const runner = new Runner(agent)
await runner.execute(command as Commands)
