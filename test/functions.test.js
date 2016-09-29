'use strict';

const {expect} = require('chai');
const validateUsername = require('../src/validate-username');
const parseGame = require('../src/parse-game');

describe('validateUsername()', () => {
  it('exists', () => {
    expect(validateUsername).to.be.a('function');
  });
});

describe('parseGame()', () => {
  expect(parseGame).to.be.a('function');
});
