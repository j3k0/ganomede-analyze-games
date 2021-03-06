'use strict';

const fs = require('fs');
const readline = require('readline');

// callback(err, [String])
const lines = (path, callback) => {
  const input = fs.createReadStream(path);
  const reader = readline.createInterface({input});
  const result = [];

  input.on('error', e => callback(e));

  reader.on('line', line => {
    const trimmed = line.trim();
    const legitimate = trimmed && !trimmed.startsWith('#');

    if (legitimate)
      result.push(trimmed);
  });

  reader.on('close', () => callback(null, result));
};

module.exports = lines;
