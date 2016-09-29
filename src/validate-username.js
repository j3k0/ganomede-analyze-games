'use strict';

const {getJson} = require('./utils');

const endpoint = (username) => {
  return `http://prod.ggs.ovh/users/v1/${username}/metadata/auth`;
};

const validateUsername = (username, callback) => {
  getJson(endpoint(username), (err, body) => {
    if (err) {
      console.error('validateUsername() failed', err);
      return callback(err);
    }

    const hasBody = body && (typeof body === 'object');
    const hasKey = body.hasOwnProperty('key') && (body.key === 'auth');
    const hasValue = body.hasOwnProperty('value') && (body.value !== null);

    callback(null, hasBody && hasKey && hasValue);
  });
};

module.exports = validateUsername;
