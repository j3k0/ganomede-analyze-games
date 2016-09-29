'use strict';

const http = require('http');
const util = require('util');
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
