export interface InfoResponse {
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

export interface PlayerResponse {
  playerCount: number;
  players: Player[];
}

export interface Player {
  index: number;
  name: string;
  score: number;
  duration: number;
}
