'use strict';

const async = require('async');
const lodash = require('lodash');
const {getJson, arrays} = require('./utils');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Helper to get stuff from API.
//
// f = getJson('coordinator', {withAuth: true})
// f('alice', 'games/active')
const fetch = (service, {collection, withAuth}) => (username, ...rest) => {
  const base = `http://${HOST}:${PORT}/${service}/v1`;
  const auth = withAuth
    ? `/auth/${process.env.API_SECRET}.${username}/`
    : `/${username}/`;

  const itemId = rest.length === 2 ? `/${rest[0]}` : '';
  const callback = rest[rest.length - 1]; // last argument is callback

  getJson(base + auth + collection + itemId, callback);
};

const collections = {
  // list of games without any game data
  // fn(username, callback)
  coordinator: fetch('coordinator', {
    collection: 'active-games',
    withAuth: true
  }),

  // actual game info (from turngame)
  // fn(username, gameId, callback)
  activeGames: fetch('turngame', {
    collection: 'games',
    withAuth: true
  })
};

const fetchActiveGame = (alice, bob, callback) => {
  // TODO
  // probably query only single player…
  const participants = [alice, bob];

  async.concat(
    participants,
    collections.coordinator,
    (err, games) => {
      const uniqueGames = lodash.uniqBy(games, 'id');
      const gamesBetween = uniqueGames
        .filter(game => arrays.equalWhenSorted(game.players, participants))
        .sort((left, right) => right.endTime - left.endTime);

      if (gamesBetween.length) {
        return tryBoth(
          collections.activeGames.bind(null, alice, gamesBetween[0].id),
          collections.activeGames.bind(null, bob, gamesBetween[0].id),
          callback
        );
      }

      callback(null, null);
    }
  );
};

// Fetches game between 2 players.
// callback(err, game|null)
//
// Will return a game from coordinator or archive,
// or null if players never played each other.
// 1. from coordinator (`active`) and `over`;
// 2. from statistics (`archive` and `over`);
// 3. from coordinator (`active`) but in `progress`;
// 4. null
const fetchGame = (alice, bob, callback) => {
  firstResult(
    (cb) => fetchActiveGame(alice, bob, cb),
    callback
  );
};

// Tries calling functions one after the other.
// Whichever returns result, "wins", meaning others won't be run.
// If previous returns null, tries the other.
// If previous fails, all fail.
// If all return null, result is null.
const firstResult = (...args) => {
  const funcs = args.slice(0, -1);
  const callback = args[args.length - 1];

  let currentFunction = 0;
  let currentResult = null;

  const callFn = (cb) => {
    const fn = funcs[currentFunction++];

    fn((err, result) => {
      if (err)
        return cb(err);

      currentResult = result;
      cb();
    });
  };

  async.whilst(
    () => !currentResult && (currentFunction < funcs.length),
    callFn,
    (err) => callback(err, currentResult)
  );
};

// Tries calling fnA and fnB.
// If both succeed, checks that JSON documents are the same, cb(err) otherwise.
// If one succeeds, returns that.
// If none succeed, returns error of fnA.
const tryBoth = (fnA, fnB, callback) => {
  const try_ = (fn) => (cb) => {
    fn((err, result) => cb(null, {
      err: err || null,
      result: err ? null : result
    }));
  };

  const tries = [fnA, fnB].map(try_);

  async.parallel(tries, (err, [retA, retB]) => {
    if (err)
      return callback(err);

    if (retA.err && retB.err) {
      callback(retA.err);
    }
    else if (retA.result && retB.result) {
      const same = lodash.isEqual(retA.result, retB.result);
      return same
        ? callback(null, retA.result)
        : callback(new Error('tryBoth() got conflicting result'));
    }
    else {
      callback(null, retA.result || retB.result);
    }
  });
};

// Fetches a game invitation between 2 players.
// callback(err, inivitation|null).
const fetchInvite = (alice, bob, callback) => {
  throw new Error('NotImplemented');
};

module.exports = {fetchGame, fetchInvite};
