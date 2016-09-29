'use strict';

const path = require('path');
const util = require('util');
const lines = require('./lines');

const printUsage = (error) => {
  const executable = path.basename(process.argv[1]);
  const usage = `Usage:\n\n  ${executable} PathToInputFilename\n\n`;
  const message = error
    ? `${usage}\n${util.inspect(error)}`
    : usage;

  console.log(message);
};

// mainFn(linesFromInputFilename)
const initScript = (mainFn) => {
  const inputFilename = process.argv[2];

  if (!inputFilename) {
    process.exitCode = 1;
    return printUsage('Missing inputFilename arg');
  }

  lines(path.resolve(process.cwd(), inputFilename), (err, lines) => {
    if (err) {
      process.exitCode = 1;
      return printUsage(err);
    }

    mainFn(lines);
  });
};

module.exports = initScript;
