'use strict';

const path = require('path');
const {expect} = require('chai');
const Script = require('../src/script');

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
