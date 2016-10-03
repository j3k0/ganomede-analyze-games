'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const util = require('util');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 3000;

const server = http.createServer((req, res) => {
  const headers = {
    'content-type': 'application/json',
    'content-encoding': 'UTF-8'
  };

  try {
    const json = fs.readFileSync(
      path.join(__dirname, 'sample-data', req.url),
      'utf8'
    );

    res.writeHead(200, headers);
    res.end(json);
  }
  catch (e) {
    const code = (e.code === 'ENOENT') ? 404 : 500;
    res.writeHead(code, headers);
    res.write(JSON.stringify({error: util.inspect(e)}, null, 2));
    res.end();
  }
});

module.exports = {
  server: {
    local: ['127.0.0.1', 'localhost'].includes(HOST),
    start (cb) { server.listen(PORT, HOST, cb); },
    stop (cb) { server.close(cb); }
  }
};
