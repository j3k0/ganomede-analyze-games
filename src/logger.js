/* eslint-disable no-console */
'use strict';

module.exports = {
  stdout: console.log,
  stderr: process.env.hasOwnProperty('DEBUG') ? console.error : () => {}
};
