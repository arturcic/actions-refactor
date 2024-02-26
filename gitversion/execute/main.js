// import { exec } from 'node:child_process'
//
// exec('node dist/tools/gitversion.js --buildAgent github --command setup', (error, stdout, stderr) => {
//     if (error) {
//         console.log(`error: ${error.message}`)
//         return
//     }
//     if (stderr) {
//         console.log(`stderr: ${stderr}`)
//         return
//     }
//     console.log(`stdout: ${stdout}`)
// })
import util from 'node:util'
import { execFile } from 'node:child_process'

const execJsFile = util.promisify(execFile)
try {
    const { stdout, stderr } = await execJsFile('node', ['dist/tools/gitversion.js', '--buildAgent', 'github', '--command', 'execute'])
    console.log(stdout)
    console.error(stderr)
} catch (error) {
    console.log(error)
}
