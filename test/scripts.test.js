'use strict';

const fs = require('fs');
const path = require('path');
const {expect} = require('chai');
const Script = require('../src/script');
const child = require('child_process');
const {server} = require('./analyzer/fixtures');

describe('Script', () => {
  const scriptFunction = function (inputLines, {parallelism}, callback) {
    scriptFunction.called = true;
    scriptFunction.calledArgs = [inputLines, {parallelism}];
    setImmediate(callback, null);
  };

  scriptFunction.called = false;
  scriptFunction.calledArgs = null;

  it('#input', () => {
    expect(new Script(scriptFunction))
      .to.have.property('input', process.argv[2]);

    expect(new Script(scriptFunction, {input: './xxx.txt'}))
      .to.have.property('input', './xxx.txt');
  });

  it('#parallelism', () => {
    expect(new Script(scriptFunction))
      .to.have.property('parallelism', 1);

    expect(new Script(scriptFunction, {parallelism: 5}))
      .to.have.property('parallelism', 5);
  });

  it('.exec()', (done) => {
    const script = new Script(scriptFunction, {
      name: 'bin',
      input: path.resolve(__dirname, 'lines.txt')
    });

    script.exec((err, results) => {
      expect(err).to.be.null;
      expect(scriptFunction.called).to.be.true;
      expect(scriptFunction.calledArgs).to.eql([
        ['lines.txt', 'some stuff'],
        {parallelism: 1}
      ]);
      done();
    });
  });
});

describe('Binaries', () => {
  before(server.start);
  after(server.stop);

  const testSciprt = (file, input, expectedStdOutLines) => {
    it(`./${file}`, (done) => {
      const scriptPath = path.resolve(__dirname, '../bin', file);
      const inputPath = path.resolve(__dirname, input);
      const command = `${scriptPath} ${inputPath}`;

      child.exec(command, (err, stdout, stderr) => {
        expect(err).to.be.null;
        expect(stdout).to.equal(expectedStdOutLines.join('\n'));
        done();
      });
    });
  };

  testSciprt('validate-usernames', './usernames.txt', [
    'i-do-not-exist',
    'me-too',
    ''
  ]);

  testSciprt(
    'analyze-games',
    './analyzer/sample-data/input.txt',
    fs.readFileSync(
      path.resolve(__dirname, './analyzer/sample-data/output.txt'),
      'utf8'
    ).split('\n')
  );
});
