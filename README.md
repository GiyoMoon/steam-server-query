# Steam Server Query
Package which implements the Steam master and game server protocols and is working with promises.

## Important
This package is currently in development. The Steam master server protocol is already implemented and the game server protocol will follow.

## Examples
### Master Server Protocol
To retrieve all servers from the game CS:GO with players on it:
```javascript
import { queryMaster, REGIONS } from 'steam-server-query';

queryMaster('hl2master.steampowered.com:27011', REGIONS.ALL, 1000, { empty: 1, appid: 730 }).then(servers => {
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