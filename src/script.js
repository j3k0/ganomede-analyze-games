'use strict';

const async = require('async');
const path = require('path');
const util = require('util');
const lines = require('./lines');
const {stderr, stdout} = require('./logger');

class Script {
  constructor (functionToCall, {name, parallelism, input} = {}) {
    if (typeof functionToCall !== 'function') {
      const got = `got \`${typeof functionToCall}\` instead.`;
      throw new Error(`\`functionToCall\` arg must be a Function, ${got}`);
    }

    this.fn = functionToCall;
    this.input = input || process.argv[2];
    this.parallelism = parallelism || parseInt(process.argv[3], 10) || 1;

    if (!this.input || typeof this.input !== 'string') {
      const got = `got \`${this.input}\` instead.`;
      throw new Error(`\`input\` arg must be a non-empty string, ${got}`);
    }
  }

  exec (callback) {
    async.waterfall([
      (cb) => lines(path.resolve(process.cwd(), this.input), cb),
      (inputLines, cb) => this.fn(inputLines, {parallelism: this.parallelism}, cb)
    ], callback);
  }

  static usage (error) {
    const name = path.basename(process.argv[1]);
    const usage = `Usage:

  ${name} input [parallelism]

    * input — path to the file
    * parallelism (defaults to 1) — process this number of inputs at a time\n`;
    const message = error
      ? `${usage}\n${util.inspect(error)}`
      : usage;

    return message;
  }

  static exit (err, linesToOutput) {
    process.exitCode = err ? 1 : 0;

    return err
      ? stderr('%s', Script.usage(err))
      : stdout('%s', linesToOutput.join('\n'));
  }

  static main (func) {
    try {
      new Script(func).exec(Script.exit);
    }
    catch (e) {
      Script.exit(e);
    }
  }
}

module.exports = Script;
