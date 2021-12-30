# Steam Server Query
[![npm version](https://img.shields.io/npm/v/steam-server-query.svg)](https://npmjs.com/package/steam-server-query)
[![npm downloads](https://img.shields.io/npm/dm/steam-server-query.svg)](https://npmjs.com/package/steam-server-query)
[![license](https://img.shields.io/npm/l/steam-server-query.svg)](https://github.com/GiyoMoon/steam-server-query/blob/main/LICENSE)

Module which implements the [Master Server Query Protocol](https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol) and [Game Server Queries](https://developer.valvesoftware.com/wiki/Server_queries). It is working with promises.

## Install
```bash
npm install steam-server-query
```

## API
### Master Server Query
```javascript
queryMasterServer(masterServer: string, region: REGIONS, filter?: Filter, timeout?: number, maxHosts?: number): Promise<string[]>
```
Fetch a Steam master server to retrieve a list of game server hosts.
- `masterServer`: Host and port of the master server to call.
- `region`: The region of the world where you wish to find servers in. Use `REGIONS.ALL` for all regions.
- `filter`: Optional. Object which contains filters to be sent with the query. Default is { }.
- `timeout`: Optional. Time in milliseconds after the socket request should fail. Default is 1 second.
- `maxHosts`: Optional. Return a limited amount of hosts. Stops calling the master server after this limit is reached. Can be used to prevent getting rate limited.
- Returns: A promise including an array of game server hosts.
### Game Server Query
```javascript
queryGameServerInfo(gameServer: string, attempts?: number, timeout?: number | number[]): Promise<InfoResponse>
```
Send a A2S_INFO request to a game server. Retrieves information like its name, the current map, the number of players and so on. Read more [here](https://developer.valvesoftware.com/wiki/Server_queries#A2S_INFO).

---
```javascript
queryGameServerPlayer(gameServer: string, attempts?: number, timeout?: number | number[]): Promise<PlayerResponse>
```
Send a A2S_PLAYER request to a game server. Retrieves the current playercount and for every player their name, score and duration. Read more [here](https://developer.valvesoftware.com/wiki/Server_queries#A2S_PLAYER).

---
```javascript
queryGameServerRules(gameServer: string, attempts?: number, timeout?: number | number[]): Promise<RulesResponse>
```
Send a A2S_RULES request to a game server. Retrieves the rule count and for every rule its name and value. Read more [here](https://developer.valvesoftware.com/wiki/Server_queries#A2S_RULES).

---
Parameters for every Game Server Query function
- `gameServer`: Host and port of the game server to call.
- `attempts`: Optional. Number of call attempts to make. Default is 1 attempt.
- `timeout`: Optional. Time in milliseconds after the socket request should fail. Default is 1000. Specify an array of timeouts if they should be different for every attempt. (Example for 3 attempts: `[1000, 1000, 2000]`)
- Returns: A promise including an object (Either type `InfoResponse`, `PlayerResponse` or `RulesResponse`)

## Types
### Master Server Query
#### `REGIONS`
```javscript
enum REGIONS {
  'US_EAST_COAST' = 0x00,
  'US_WEST_COAST' = 0x01,
  'SOUTH_AMERICA' = 0x02,
  'EUROPE' = 0x03,
  'ASIA' = 0x04,
  'AUSTRALIA' = 0x05,
  'MIDDLE_EAST' = 0x06,
  'AFRICA' = 0x07,
  'ALL' = 0xFF
}
```
#### `Filter`
```javscript
interface Filter extends BasicFilter {
  nor?: BasicFilter;
  nand?: BasicFilter;
}

interface BasicFilter {
  dedicated?: 1;
  secure?: 1;
  gamedir?: string;
  map?: string;
  linux?: 1;
  password?: 0;
  empty?: 1;
  full?: 1;
  proxy?: 1;
  appid?: number;
  napp?: number;
  noplayers?: 1;
  white?: 1;
  gametype?: string[];
  gamedata?: string[];
  gamedataor?: string[];
  name_match?: string;
  version_match?: string;
  collapse_addr_hash?: 1;
  gameaddr?: string;
}
```
### Game Server Query
#### `InfoResponse`
```javascript
interface InfoResponse {
  protocol: number;
  name: string;
  map: string;
  folder: string;
  game: string;
  appId: number;
  players: number;
  maxPlayers: number;
  bots: number;
  serverType: string;
  environment: string;
  visibility: number;
  vac: number;
  version: string;
  port?: number;
  serverId?: BigInt;
  spectatorPort?: number;
  spectatorName?: string;
  keywords?: string;
  gameId?: BigInt;
}
```
#### `PlayerResponse`
```javascript
interface PlayerResponse {
  playerCount: number;
  players: Player[];
}

interface Player {
  index: number;
  name: string;
  score: number;
  duration: number;
}
```
#### `RulesResponse`
```javascript
interface RulesResponse {
  ruleCount: number;
  rules: Rule[];
}

interface Rule {
  name: string;
  value: string;
}
```
## Examples
### Master Server Protocol
To retrieve all servers from the game [Witch It](https://store.steampowered.com/app/559650/Witch_It/) with players on it:
```javascript
import { queryMasterServer, REGIONS } from 'steam-server-query';

queryMasterServer('hl2master.steampowered.com:27011', REGIONS.ALL, { empty: 1, appid: 559650 }).then(servers => {
  console.log(servers);
}).catch((err) => {
  console.error(err);
});
```
Response (shortened):
```json
[
  "176.57.181.178:27003"
  "176.57.181.178:27008"
  "176.57.171.49:27005"
  "176.57.181.178:27005"
]
```
### Game Server Protocol
#### A2S_INFO
To retrieve information about the game server with the address `176.57.181.178:27003`:
```javascript
import { queryGameServerInfo } from 'steam-server-query';

queryGameServerInfo('176.57.181.178:27003').then(infoResponse => {
  console.log(infoResponse);
}).catch((err) => {
  console.error(err);
});
```
Response:
```json
{
  "protocol": 17,
  "name": "EU04",
  "map": "RandomMapCycle",
  "folder": "WitchIt",
  "game": "Witch Hunt",
  "appId": 0,
  "players": 10,
  "maxPlayers": 16,
  "bots": 0,
  "serverType": "d",
  "environment": "l",
  "visibility": 0,
  "vac": 1,
  "version": "1.0.0.0",
  "port": 7780,
  "keywords": "BUILDID:0,OWNINGID:90154510593238022,OWNINGNAME:EU04,SESSIONFLAGS:683,GameMode_s:Hide and Seek,PlayerCount_i:10,MatchTime_i:265",
  "gameId": 559650
}
```
#### A2S_PLAYER
To retrieve players playing on the game server with the address `176.57.181.178:27003`:
```javascript
import { queryGameServerPlayer } from 'steam-server-query';

queryGameServerPlayer('176.57.181.178:27003').then(playerResponse => {
  console.log(playerResponse);
}).catch((err) => {
  console.error(err);
});
```
Response (shortened):
```json
{
  "playerCount": 10,
  "players": [
    {
      "index": 0,
      "name": "Player_1",
      "score": 0,
      "duration": 1969.7518310546875
    },
    {
      "index": 0,
      "name": "Player_2",
      "score": 0,
      "duration": 1958.9234619140625
    },
    {
      "index": 0,
      "name": "Player_3",
      "score": 0,
      "duration": 1509.9417724609375
    }
  ]
}
```
#### A2S_RULES
To retrieve rules of the game server with the address `176.57.181.178:27003`:
```javascript
import { queryGameServerRules } from 'steam-server-query';

queryGameServerRules('176.57.181.178:27003').then(rulesResponse => {
  console.log(rulesResponse);
}).catch((err) => {
  console.error(err);
});
```
Response:
```json
{
  "ruleCount": 14,
  "rules": [
    { "name": "CONMETHOD", "value": "P2P" },
    { "name": "GameMode_s", "value": "Hide and Seek" },
    { "name": "MatchStarted_b", "value": "true" },
    { "name": "MatchTime_i", "value": "265" },
    { "name": "OWNINGID", "value": "90154510593238022" },
    { "name": "OWNINGNAME", "value": "EU04" },
    { "name": "P2PADDR", "value": "90154510593238022" },
    { "name": "P2PPORT", "value": "7780" },
    { "name": "PlayerCount_i", "value": "10" },
    { "name": "SESSIONFLAGS", "value": "683" },
    { "name": "SessionName_s", "value": "EU04" },
    { "name": "StartTime_s", "value": "2021.12.29-00.47.20" },
    { "name": "Tournament_b", "value": "false" },
    { "name": "VersionNumber_s", "value": "1.2.3" }
  ]
}
```
## Notes
- The master servers are rate limited. Requests with large outputs (6000+ servers) will probably reach this limit and a timeout error will be thrown.

## Links
- [Master Server Query Protocol](https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol)
- [Game Server Queries](https://developer.valvesoftware.com/wiki/Server_queries)

## License
This repository and the code inside it is licensed under the MIT License. Read [LICENSE](https://github.com/GiyoMoon/steam-server-query/blob/main/LICENSE) for more information.