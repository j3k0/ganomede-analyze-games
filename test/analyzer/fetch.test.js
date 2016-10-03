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
    it('retrieves finishined coordinator games', (done) => {
      fetchGame('p13', 'p07', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.be.ok;
        expectJson(game, './sample-data/turngame/v1/auth/secret.p07/games/0d21e75b4f278acd4e0301c5ad2623de');
        done();
      });
    });

    it('retrieves archived games', (done) => {
      fetchGame('p00', 'p04', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.be.ok;
        expect(game).to.eql({
          id: '989fd29d0b636ac09c7ec947c900f049',
          date: 1439500003,
          players: [{
            username: 'p04',
            score: -89
          }, {
            username: 'p00',
            score: -100
          }]
        });
        done();
      });
    });

    it('fetches in progress coordinator games', (done) => {
      fetchGame('p07', 'p05', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.be.ok;
        expectJson(game, './sample-data/turngame/v1/auth/secret.p05/games/f2af83ca45f60909680c38eac245ffe4');
        done();
      });
    });

    it('returns `null` if no games between players are found', (done) => {
      // Samples are a bit fragile, so we are trying "solo" game,
      // so coordinator and statistics have something to say.
      fetchGame('p00', 'p00', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.be.null;
        done();
      });
    });
  });
});
