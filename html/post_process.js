import * as fs from 'fs';

if (process.argv.length < 3) {
    console.log("please add file name as argument")
}
var filename = process.argv[2]

var output = fs.readFileSync(filename).toString()
const reg = /export {.*};/
const outputMod = output.replace(reg, "");

fs.writeFileSync(filename, outputMod);