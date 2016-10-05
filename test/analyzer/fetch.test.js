'use strict';

const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const {expect} = require('chai');
const {server} = require('./fixtures');
const {fetchGame} = require('../../src/fetch');
const analyzeGame = require('../../src/analyze-game');

describe('Fetching stuff', () => {
  before(server.start);
  after(server.stop);

  const expectJson = (actual, expectedPath) => {
    const expectedPathResolved = path.resolve(__dirname, expectedPath);
    const expected = JSON.parse(fs.readFileSync(expectedPathResolved, 'utf8'));

    expect(
      // We bind this prop inside fetch to know what kind of game we got,
      // remove it for actual comparison.
      lodash.omit(actual, '__analyze_kind')
    ).to.eql(expected);
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
          __analyze_kind: 'archived-game',
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

    it('returns pending invitations', (done) => {
      fetchGame('alice', 'bob', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.eql({
          forAlice: [
            {
              id: 'alice-is-invited-by-bob',
              from: 'bob',
              to: 'alice',
              gameId: 'friendly-game-of-triominos',
              type: 'triominos/v1'
            }
          ],
          forBob: [],
          __analyze_kind: 'invitation'
        });

        done();
      });
    });

    it('returns `null` if no games or invitations between players are found', (done) => {
      // Samples are a bit fragile, so we are trying "solo" game,
      // so coordinator and statistics have something to say.
      fetchGame('p00', 'p00', (err, game) => {
        expect(err).to.be.null;
        expect(game).to.eql({
          __analyze_kind: 'nothing-found'
        });
        done();
      });
    });
  });

  describe('analyzeGame()', () => {
    const test = (p0, p1, kind, obj, expected) => {
      expect(analyzeGame(p0, p1, kind, obj)).to.eql(expected);
    };

    it('finishined coordinator game', () => {
      const game = {
        id: '0d21e75b4f278acd4e0301c5ad2623de',
        players: ['p13', 'p07'],
        scores: [124, 53],
        turn: 'anonymous',
        status: 'gameover',
        gameData: {
          // players: [ [Object], [Object] ],
          // currentPlayerIndex: 1,
          // numPicks: 0,
          // stock: { pieces: [Object] },
          // board: { pieces: [Object] },
          // boardMask: [],
          startTime: 1475026757.189,
          endTime: 0,
          rules: 'original'
        },
        type: 'triominos/v1',
        gameConfig: true
      };

      const started = new Date(game.gameData.startTime * 1000).toISOString();
      const ended = new Date(game.gameData.endTime * 1000).toISOString();

      // username0,username1,started,ended,winner,score0,score1
      test(
        'p07', 'p13', 'finished-coordinator-game', game,
        `p07,p13,${started},${ended},p13,53,124`
      );
    });

    it('archived games', () => {
      const game = {
        id: '989fd29d0b636ac09c7ec947c900f049',
        date: 1439500003,
        players: [{
          username: 'p04',
          score: -89
        }, {
          username: 'p00',
          score: -100
        }]
      };

      const started = new Date(game.date * 1000).toISOString();

      test(
        'p00', 'p04', 'archived-game', game,
        `p00,p04,${started},,p04,-100,-89`
      );
    });

    it('analyzes in-progress coordinator game', () => {
      const game = {
        id: 'f2af83ca45f60909680c38eac245ffe4',
        players: ['p05', 'p07'],
        scores: [0, 9],
        turn: 'p07',  // winner is other player,
                      // even though it's lower score
        status: 'active',
        gameData: {
          // players: [ [Object], [Object] ],
          // currentPlayerIndex: 0,
          // numPicks: 0,
          // stock: { pieces: [Object] },
          // board: { pieces: [Object] },
          // boardMask: [],
          startTime: 1473043752.619,
          endTime: 0,
          rules: 'original'
        },
        type: 'triominos/v1',
        // gameConfig:
        //  { mod:
        //     { tile: 'com.triominos.tile.default',
        //       background: 'com.triominos.background.blue1' } }
      };

      const started = new Date(game.gameData.startTime * 1000).toISOString();

      test(
        'p05', 'p07', 'in-progress-coordinator-game', game,
        `p05,p07,${started},,p05,0,9`
      );
    });

    it('analyzes invitations', () => {
      const obj = {
        forAlice: [
          {
            id: 'alice-is-invited-by-bob',
            from: 'bob',
            to: 'alice',
            gameId: 'friendly-game-of-triominos',
            type: 'triominos/v1'
          }
        ],
        forBob: [],
        __analyze_kind: 'invitation'
      };

      test(
        'alice', 'bob', 'invitation', obj,
        'alice,bob,,,bob,,'
      );
    });

    it('analyzes nothing-found case', () => {
      test(
        'alice', 'bob', 'nothing-found', null,
        'alice,bob,,,,,'
      );
    });
  });
});
