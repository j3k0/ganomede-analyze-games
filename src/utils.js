'use strict';

const http = require('http');
const util = require('util');
const async = require('async');
const lodash = require('lodash');
const request = require('request');

const safeReq = (opts, callback) => {
  try {
    request(opts, callback);
  }
  catch (e) {
    setImmediate(callback, e);
  }
};

module.exports = {
  arrays: {
    equalWhenSorted: (a, b) => lodash.isEqual(a.sort(), b.sort())
  },

  // Tries calling functions one after the other.
  // Whichever returns result, "wins", meaning others won't be run.
  // If previous returns null, tries the other.
  // If previous fails, all fail.
  // If all return null, result is null.
  firstResult (...args) {
    const funcs = args.slice(0, -1);
    const callback = args[args.length - 1];

    let currentFunction = 0;
    let currentResult = null;

    const callFn = (cb) => {
      const fn = funcs[currentFunction++];

      fn((err, result) => {
        if (err)
          return cb(err);

        currentResult = result;
        cb();
      });
    };

    async.whilst(
      () => !currentResult && (currentFunction < funcs.length),
      callFn,
      (err) => callback(err, currentResult)
    );
  },

  // Tries calling fnA and fnB.
  // If both succeed, checks that JSON documents are the same, cb(err) otherwise.
  // If one succeeds, returns that.
  // If none succeed, returns error of fnA.
  tryBoth (fnA, fnB, callback) {
    const try_ = (fn) => (cb) => {
      fn((err, result) => cb(null, {
        err: err || null,
        result: err ? null : result
      }));
    };

    const tries = [fnA, fnB].map(try_);

    async.parallel(tries, (err, [retA, retB]) => {
      if (err)
        return callback(err);

      if (retA.err && retB.err) {
        callback(retA.err);
      }
      else if (retA.result && retB.result) {
        const same = lodash.isEqual(retA.result, retB.result);
        return same
          ? callback(null, retA.result)
          : callback(new Error('tryBoth() got conflicting result'));
      }
      else {
        callback(null, retA.result || retB.result);
      }
    });
  },

  getJson (uri, callback) {
    const opts = {
      uri,
      method: 'GET',
      gzip: true,
      json: true
    };

    safeReq(opts, (err, res, body) => {
      if (err)
        return callback(err);

      if (res.statusCode !== 200) {
        const message = util.format(
          `HTTP %d: %s\n%s`,
          res.statusCode,
          http.STATUS_CODES[res.statusCode],
          JSON.stringify(body || '[no body]', null, 2)
        );

        return callback(new Error(message));
      }

      callback(null, body);
    });
  }
};
