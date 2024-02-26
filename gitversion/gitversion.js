import util from 'node:util'
import { execFile } from 'node:child_process'

const execJsFile = util.promisify(execFile)

export async function run(agent, command) {
    try {
        const { stdout, stderr } = await execJsFile('node', ['dist/tools/gitversion.js', '--buildAgent', agent, '--command', command])
        console.log(stdout)
        if (stderr) {
            console.error(stderr)
        }
    } catch (error) {
        console.error(error)
    }
}
