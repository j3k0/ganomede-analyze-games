'use strict';

const lodash = require('lodash');
const {stderr} = require('./logger');

const fmtDate = (ts) => {
  try {
    return typeof ts === 'string'
      ? ts
      : new Date(ts).toISOString();
  }
  catch (e) {
    return '[ INVALID DATE ]';
  }
};

const createCsv = (alice, bob) => function (
  started,
  ended,
  winner,
  score0,
  score1
) {
  return [
    alice,
    bob,
    fmtDate(started),
    fmtDate(ended),
    winner || '',
    (score0 === undefined) ? '' : score0,
    (score1 === undefined) ? '' : score1,
  ].join(',');
};

const parseScores = (scores, alice, bob) => {
  const aliceScore = scores[alice];
  const bobScore = scores[bob];
  const winner = (aliceScore > bobScore) ? alice : bob;
  return {aliceScore, bobScore, winner};
};

// Maps game to CSV line.
module.exports = (alice, bob, whatToAnalyze, obj) => {
  const csvGen = createCsv(alice, bob);
  const print = () => {
    const analyzeInput = {
      alice,
      bob,
      kind: whatToAnalyze,
      obj
    };

    const serialized = JSON.stringify(analyzeInput, null, 2)
      .split('\n')
      .map(line => `    ${line}`)
      .join('\n');

    stderr('  analyzing…\n%s', serialized);
  };
  const csv = (...args) => {
    print();
    return csvGen(...args);
  };

  switch (whatToAnalyze) {
    case 'finished-coordinator-game': {
      // seems times are in seconds, not millis.
      const started = obj.gameData.startTime * 1000;
      const ended = obj.gameData.endTime * 1000;
      const {aliceScore, bobScore, winner} = parseScores(
        lodash.zipObject(obj.players, obj.scores),
        alice,
        bob
      );
      return csv(started, ended, winner, aliceScore, bobScore);
    }

    case 'tournament-archive-game':
    case 'archived-game': {
      const started = obj.date * 1000;
      const ended = '';
      const scores = Object.assign({}, ...obj.players.map(p => {
        const obj = {};
        obj[p.username] = p.score;
        return obj;
      }));
      const {aliceScore, bobScore, winner} = parseScores(scores, alice, bob);
      return csv(started, ended, winner, aliceScore, bobScore);
    }

    case 'in-progress-coordinator-game': {
      const started = obj.gameData.startTime * 1000;
      const ended = '';
      const {aliceScore, bobScore} = parseScores(
        lodash.zipObject(obj.players, obj.scores),
        alice,
        bob
      );
      const winner = obj.turn === alice ? bob : alice;
      return csv(started, ended, winner, aliceScore, bobScore);
    }

    case 'invitation': {
      const started = '';
      const ended = '';
      let winner = '';

      // if alice has invitation, bob wins
      // if bob has invitation, alice wins
      // no winner
      if (obj.forAlice.length)
        winner = bob;
      else if (obj.forBob.length)
        winner = alice;

      return csv(started, ended, winner);
    }

    case 'nothing-found': {
      const started = '';
      const ended = '';
      return csv(started, ended);
    }

    default:
      throw new Error(`Can not analyze ${whatToAnalyze}`);
  }
};
