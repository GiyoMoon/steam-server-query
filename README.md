# Steam Server Query
Package which implements the Steam master and game server protocols and is working with promises.

## Important
This package is currently in development. The Steam master server protocol is already implemented and the game server protocol will follow.

## API
### `queryMaster(masterServer: string, region: REGIONS, filter?: Filter, timeout?: number): Promise<string[]>`
Function to query a master server with different queries.
- `masterServer`: Host and port of the master server to call. Example: `hl2master.steampowered.com:27011`
- `region`: The region of the world where you wish to find servers in. Use `REGIONS.ALL` for all regions.
- `filter`: Optional. Object which contains filters to be sent with the query. Default is { }.
- `timeout`: Optional. Time in milliseconds after the socket request should fail. Default is 1 second.
- Returns: A promise with an array of game server hosts. Example:
```json
[
  "31.22.30.132:26070",
  "37.114.32.195:25593"
]
```
## Types
### `REGIONS`
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
### `Filter`
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

## Examples
### Master Server Protocol
To retrieve all servers from the game CS:GO with players on it:
```javascript
import { queryMaster, REGIONS } from 'steam-server-query';

queryMaster('hl2master.steampowered.com:27011', REGIONS.ALL, { empty: 1, appid: 730 }).then(servers => {
  console.log(servers);
}).catch((err) => {
  console.error(err);
});
```
Response (shortened):
```json
[
  "31.22.30.132:26070",
  "37.114.32.195:25593",
  "95.208.147.56:27015",
  "77.204.120.73:27015",
]
```

## Notes
- The master servers are rate limited. Requests with large outputs (6000+ servers) will probably reach this limit and a timeout error will be thrown.

## Links
- [Master Server Query Protocol](https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol)
- [Game Server Query](https://developer.valvesoftware.com/wiki/Server_queries)