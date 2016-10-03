'use strict';

const fs = require('fs');
const path = require('path');
const {expect} = require('chai');
const {server} = require('./fixtures');
const {fetchGame} = require('../../src/fetch');

describe('Fetching stuff', () => {
  before(server.start);
  after(server.stop);

  const expectJson = (actual, expectedPath) => {
    const expectedPathResolved = path.resolve(__dirname, expectedPath);
    const expected = JSON.parse(fs.readFileSync(expectedPathResolved, 'utf8'));
    expect(actual).to.eql(expected);
  };

  describe('fetchGame()', () => {
    it('retrieves active finishined games', (done) => {
      fetchGame('p13', 'p07', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.be.ok;
        expectJson(game, './sample-data/turngame/v1/auth/secret.p07/games/0d21e75b4f278acd4e0301c5ad2623de');
        done();
      });
    });

    it('retrieves archived games', (done) => {
      fetchGame('alice', 'bob', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.be.ok;
        // expectJson(game, …)
        done();
      });
    });
  });
});
