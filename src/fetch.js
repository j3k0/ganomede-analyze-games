'use strict';

const async = require('async');
const lodash = require('lodash');
const util = require('util');
const {getJson, arrays, tryBoth, firstResult} = require('./utils');

const parseTournamentStart = (envVar) => {
  const ts = parseInt(envVar, 10) || NaN;
  const tsOkay = (String(ts) === envVar) && Number.isSafeInteger(ts);
  const date = tsOkay ? new Date(ts) : new Date(envVar);
  const stringOkay = String(date) !== 'Invalid Date';
  const result = date.getTime();
  const okay = (tsOkay || stringOkay) && Number.isSafeInteger(result) && (result > 0);

  if (!okay) {
    const message = util.format(
      'parseTournamentStart() failed\n%s',
      util.inspect({
        envVar,
        tsOkay,
        stringOkay,
        result,
        okay
      })
    );

    throw new Error(message);
  }

  console.error('Running with TOURNAMENT_START (%d) %s', result, date);
  return result;
};

const PROTO = process.env.PROTO || 'http';
const DIR = process.env.DIR || '.';
const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const TOURNAMENT_START = process.env.hasOwnProperty('TOURNAMENT_START')
  ? parseTournamentStart(process.env.TOURNAMENT_START)
  : null;

const endpoint = (service, path) => {
  return PROTO == 'file'
    ? `${PROTO}://${DIR}/${service}/v1${path}`
    : `${PROTO}://${HOST}:${PORT}/${service}/v1${path}`;
};
const auth = (username) => `auth/${process.env.API_SECRET}.${username}`;

const collections = {
  // list of games without any game data
  coordinator: (username, callback) => getJson(
    endpoint('coordinator', `/${auth(username)}/triominos/v1/active-games`),
    callback
  ),

  // actual game info (from turngame)
  activeGames: (username, gameId, callback) => getJson(
    endpoint('turngame', `/${auth(username)}/games/${gameId}`),
    callback
  ),

  archivedGames: (username, callback) => getJson(
    endpoint('statistics', `/triominos/v1/${username}/archive`),
    callback
  ),

  invitations: (username, callback) => getJson(
    endpoint('invitations', `/${auth(username)}/invitations`),
    callback
  )
};

const fetchCoordinatorGame = (status) => (alice, bob, callback) => {
  // TODO
  // probably query only single player…
  const participants = [alice, bob];

  async.concat(
    participants,
    collections.coordinator,
    (err, games) => {
      if (err)
        return callback(err);

      const uniqueGames = lodash.uniqBy(games, 'id');
      const gamesBetween = uniqueGames
        .filter(game => {
          return (game.status === status)
            && arrays.equalWhenSorted(game.players, participants);
        })
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

const fetchFinishedCoordinatorGame = fetchCoordinatorGame('gameover');
const fetchInProgressCoordinatorGame = fetchCoordinatorGame('active');

const fetchArchivedGameSince = ({since, latest}) => (alice, bob, callback) => {
  const participants = [alice, bob];

  collections.archivedGames(alice, (err, stats) => {
    if (err)
      return callback(err);

    const gamesBetween = lodash.map(stats, 'game')
      .filter(game => {
        const isSince = game.date >= since;
        return isSince && arrays.equalWhenSorted(
          lodash.map(game.players, 'username'),
          participants
        );
      })
      .sort((left, right) => {
        // We can be interested in either latest game,
        // or the first since date.
        return latest
          ? right.date - left.date
          : left.date - right.date;
      });

    callback(null, (gamesBetween.length > 0) ? gamesBetween[0] : null);
  });
};

const fetchArchivedGame = fetchArchivedGameSince({
  since: 0,
  latest: true
});

const fetchArchivedGameSinceTournamentStarted = fetchArchivedGameSince({
  since: TOURNAMENT_START,
  latest: false
});

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
  console.error('fetchGame()', alice, bob);

  const wrap = (kind, fn) => (cb) => {
    console.error(`  trying ${kind}…`);

    fn(alice, bob, (err, game) => {
      if (err)
        return cb(err);

      if (game)
        game.__analyze_kind = kind;

      cb(err, game);
    });
  };

  // If TOURNAMENT_START is set, try archive since that, otherwise ignore.
  const tournamentArchive = TOURNAMENT_START
    ? wrap('tournament-archive-game', fetchArchivedGameSinceTournamentStarted)
    : (cb) => cb(null, null);

  firstResult(
    tournamentArchive,
    wrap('finished-coordinator-game', fetchFinishedCoordinatorGame),
    wrap('archived-game', fetchArchivedGame),
    wrap('in-progress-coordinator-game', fetchInProgressCoordinatorGame),
    wrap('invitation', fetchInvite),
    wrap('nothing-found', (user0, user1, cb) => {
      // need an object here,
      // so wrap can add correct `__analyze_kind` property.
      cb(null, {});
    }),
    callback
  );
};

// Fetches a game invitations between 2 players.
// (if none found, null)
//
// callback(err, {
//  forAlice: [invitation] // invitations from bob only for game of triominos
//  forBob: [invitation]   // invitations from alice only for game of triominos
// })
const fetchInvite = (alice, bob, callback) => {
  async.parallel([
    collections.invitations.bind(null, alice),
    collections.invitations.bind(null, bob)
  ], (err, [alices, bobs]) => {
    if (err)
      return callback(err);

    const forAlice = alices.filter(invite => {
      return (invite.type === 'triominos/v1') && (invite.from === bob);
    });

    const forBob = bobs.filter(invite => {
      return (invite.type === 'triominos/v1') && (invite.from === alice);
    });

    if ((forAlice.length === 0) && (forBob.length === 0))
      callback(null, null);
    else
      callback(null, {forAlice, forBob});
  });
};

module.exports = {fetchGame, fetchInvite};
