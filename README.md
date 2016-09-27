# ganomede-analyze-games

Analyze games between players

It consists in 2 scripts writen with nodejs.

## analyse-games script

 * Goal: analyse a collection of game in batch.
 * Input: a file with 2 usernames per line.
 * Output: result of the last game against each 2 users pairs.

Example input:

```
# file game.txt
Alice Bob
Charlse Damien
Jeko Chicken
Harry Sally
Invitr Absent
```

Example output:

```
./analyse-games games.txt

username0,username1,started,ended,winner,score0,score1
Alice,Bob,,,,,
Charlse,Damien,,,,,
Jeko,Chicken,2016-sep-12,2016-sep-15,Jeko,101,50
Harry,Sally,2016-sep-16,,Sally,90,12
Invitr,Absent,,,Invitr,,
```

#### Possible cases

|  Priority  | Condition | Winner |
|------------|-----------|--------|
| **1** | There's an active game that is **Over** | Player with largest score |
| **2** | There are games in the **Archives** | Player with largest score in the last game |
| **3** | There's an active game in **Progress** | Player that played last |
| **4** | There's a pending **Invitation** | Player that sent the invitation |
| **5** | **None** of the above | No Winner |

##### Output

For a game between `user0` and `user1`. `userX` refers to any of those two players.

###### 1. Over

Players are currently playing between each other. The active game started september 2. It is in state "gameover". Player X won this game.

**Output** `user0,user1,2016-sep-2,,userX,score0,score1`

**Retrieve the info**. Check both players list of active games from `https://prod.ggs.ovh/coordinator/v1/auth/:authToken/triominos/v1/active-games`. Load all games from `https://prod.ggs.ovh/turngame/v1/auth/:authToken/games/:gameId`. If one of the games is between user0 and user1, and has status `gameover`, return the output.

##### 2. Archive

Players played and finished one (or many) games between each other. The last game started september 12 and finished september 16. Player X won this game.

**Output** `user0,user1,2016-sep-12,2016-sep-15,userX,score0,score1`

**Retrieve the info**. Read the archive from `https://prod.ggs.ovh/statistics/v1/triominos/v1/:username/archive`. If one of the games is between user0 and user1, return the output.

##### 3. Progress

Players never finished a game between each other. An active game exists between the two player that was started september 15. Player X played last, it's Player Y turn.

**Output** `user0,user1,2016-sep-15,,userX,score0,score1`

**Retrieve the info**. Similar to 1.

##### 4. Invitation

No games were ever played between the two players. Player X sent an invitation to the other. Invitation is still pending.

**Output** `user0,user1,,,userX,,`

**Retrieve the info**. Using `https://prod.ggs.ovh/invitations/v1/auth/:authToken/invitations`.

###### 5. None

No games were ever played between the two players. No players sent an invitation to the other.

Output `user0,user1,,,,,`

### Ground work

Add impersonation to `coordinator`, `turngame` and `invitations`. Good timing to also upgrade those modules to the latest node version.

## validate-usernames script

 * Goal: validate that all usernames are valid and exist.
 * Input: a file with 2 usernames per line.
 * Output: list of invalid usernames

Example output:

```
./validate-usernames games.txt

Invalid users:
Charlse
```

#### How to validate if an user is valid?

Username exists if a request to `https://prod.ggs.ovh/users/v1/:username/metadata/auth` returns a non-null `"value"`.
