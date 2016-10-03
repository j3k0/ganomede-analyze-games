'use strict';

const async = require('async');
const lodash = require('lodash');
const {getJson, arrays, tryBoth, firstResult} = require('./utils');

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

// Fetches a game invitation between 2 players.
// callback(err, inivitation|null).
const fetchInvite = (alice, bob, callback) => {
  throw new Error('NotImplemented');
};

module.exports = {fetchGame, fetchInvite};
