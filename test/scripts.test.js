'use strict';

const path = require('path');
const async = require('async');
const {expect} = require('chai');
const rejectValid = require('../bin/validate-usernames');
const lines = require('../src/lines');

const readUsernamesAndExecute = (fn, callback) => {
  const filepath = path.resolve(__dirname, 'usernames.txt');

  async.waterfall([
    (cb) => lines(filepath, cb),
    fn
  ], callback);
};

describe('scripts', () => {
  it('./bin/validate-usernames', (done) => {
    readUsernamesAndExecute(rejectValid, (err, invalid) => {
      expect(err).to.be.null;
      expect(invalid).to.eql([
        'i-do-not-exist',
        'me-too'
      ]);
      done();
    });
  });
});
