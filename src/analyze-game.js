'use strict';

const lodash = require('lodash');

const fmtDate = (ts) => {
  try {
    return new Date(ts).toISOString();
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
    score0 || '',
    score1 || ''
  ].join(',');
  const s = Array.prototype.slice.call(arguments).join(',');
  console.log({s})
  return s
};

// Maps game to CSV line.
module.exports = (alice, bob, whatToAnalyze, obj) => {
  const csv = createCsv(alice, bob);
  const started = undefined;
  const ended = undefined;

  switch (whatToAnalyze) {
    case 'finished-coordinator-game': {
      const scores = lodash.zipObject(obj.players, obj.scores);
      const aliceScore = scores[alice];
      const bobScore = scores[bob];
      const winner = (aliceScore > bobScore) ? alice : bob;
      return csv(started, ended, winner, aliceScore, bobScore);
    }

    case 'archived-game':
    case 'in-progress-coordinator-game':
    case 'invitation':
    default:
      throw new Error(`Can not analyze ${whatToAnalyze}`);
  }
}
