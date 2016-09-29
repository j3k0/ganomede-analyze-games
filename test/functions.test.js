'use strict';

const path = require('path');
const {expect} = require('chai');
const validateUsername = require('../src/validate-username');
const lines = require('../src/lines');

describe('validateUsername()', () => {
  it('true for valid usernames', (done) => {
    validateUsername('jeko', (err, valid) => {
      expect(err).to.be.null;
      expect(valid).to.be.true;
      done();
    });
  });

  it('false for invalid usernames', (done) => {
    validateUsername(`does-not-exist-hopefully-${Date.now()}`, (err, valid) => {
      expect(err).to.be.null;
      expect(valid).to.be.false;
      done();
    });
  });
});

describe('lines()', () => {
  const filepath = path.resolve(__dirname, 'lines.txt');
  const expectedLines = [
    'lines.txt',
    'some stuff'
  ];

  it('parses provided file and returns array of non-empty lines', (done) => {
    lines(filepath, (err, lines) => {
      expect(err).to.be.null;
      expect(lines).to.be.instanceof(Array);
      expect(lines).to.eql(expectedLines);
      done();
    });
  });

  it('fails on missing files', (done) => {
    lines('/missing.txt', (err, lines) => {
      expect(err).to.be.instanceof(Error);
      expect(err.code).to.equal('ENOENT');
      done();
    });
  });
});
