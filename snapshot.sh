#!/bin/bash

if [ "x$ROOT_URL" = "x" ]; then exit 1; fi
if [ "x$API_SECRET" = "x" ]; then exit 1; fi

test -e input.txt || exit 1

function fcurl() {
    echo $2 ...
    curl -s $1 > $2
}

for i in `cat input.txt`; do
    echo $i
done | sort | uniq > players.txt

for i in `cat players.txt`; do
    mkdir -p coordinator/v1/auth/secret.$i/triominos/v1
    fcurl $ROOT_URL/coordinator/v1/auth/${API_SECRET}.$i/triominos/v1/active-games coordinator/v1/auth/secret.$i/triominos/v1/active-games

    GAMES=`cat coordinator/v1/auth/secret.$i/triominos/v1/active-games | json_pp | grep id | cut -d\" -f4`
    mkdir -p turngame/v1/auth/secret.$i/games
    for g in $GAMES; do
        fcurl $ROOT_URL/turngame/v1/auth/${API_SECRET}.$i/games/$g turngame/v1/auth/secret.$i/games/$g
    done

    mkdir -p statistics/v1/triominos/v1/$i
    fcurl $ROOT_URL/statistics/v1/triominos/v1/$i/archive statistics/v1/triominos/v1/$i/archive

    mkdir -p invitations/v1/auth/secret.$i
    fcurl $ROOT_URL/invitations/v1/auth/${API_SECRET}.$i/invitations invitations/v1/auth/secret.$i/invitations
done
