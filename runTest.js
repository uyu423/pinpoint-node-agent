const exec = require('child_process').execSync;


const fileName = process.argv[2] || '*'
const filePath = '**/' + fileName + '.test.js'

const testNamePattern = process.argv[3] || null

let cmd = './node_modules/.bin/tap '
if (testNamePattern) {
    cmd += '--grep ' + testNamePattern + ' '
}
cmd += filePath

console.log ('>> run cmd : ' + cmd)

try {
  exec(cmd, {stdio: [process.stdin, process.stdout, 'ignore']});
} catch (e) {
  process.exit(1)
}
