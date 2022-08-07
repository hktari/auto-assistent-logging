const chalk = require('chalk')
const log = console.log;
const error = chalk.red;
const warning = chalk.yellow;
const info = chalk.gray;
const debug = chalk.hex('#4a4a4a');

module.exports = {
    log,
    error,
    warning,
    info,
    debug
}