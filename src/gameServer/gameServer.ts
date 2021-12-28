import { PromiseSocket } from '../promiseSocket';
import { InfoResponse, Player, PlayerResponse } from './gameServerTypes';

const CHALLENGE_START = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x41]);

export async function queryGameServerInfo(gameServer: string, timeout = 1000): Promise<InfoResponse> {
  const splitGameServer = gameServer.split(':');
  const host = splitGameServer[0];
  const port = parseInt(splitGameServer[1]);

  const gameServerQuery = new GameServerQuery(host, port, timeout);
  const result = await gameServerQuery.info();
  return result;
}

export async function queryGameServerPlayer(gameServer: string, timeout = 1000): Promise<PlayerResponse> {
  const splitGameServer = gameServer.split(':');
  const host = splitGameServer[0];
  const port = parseInt(splitGameServer[1]);

  const gameServerQuery = new GameServerQuery(host, port, timeout);
  const result = await gameServerQuery.player();
  return result;
}

export function queryGameServerRules() {
  // TODO
}

class GameServerQuery {
  private _promiseSocket: PromiseSocket;

  constructor(private _host: string, private _port: number, timeout: number) {
    this._promiseSocket = new PromiseSocket(timeout);
  };

  public async info(): Promise<InfoResponse> {
    let resultBuffer: Buffer;
    try {
      resultBuffer = await this._promiseSocket.send(this._buildInfoPacket(), this._host, this._port);
    } catch (err: any) {
      throw new Error(err);
    }

    // If the server replied with a challenge, grab challenge number and send request again
    if (resultBuffer.compare(CHALLENGE_START, 0, 5, 0, 5) === 0) {
      resultBuffer = resultBuffer.slice(5);
      const challenge = resultBuffer;
      try {
        resultBuffer = await this._promiseSocket.send(this._buildInfoPacket(challenge), this._host, this._port);
      } catch (err: any) {
        throw new Error(err);
      }
    }
    const parsedInfoBuffer = this._parseInfoBuffer(resultBuffer);
    return parsedInfoBuffer as InfoResponse;
  }

  public async player(): Promise<PlayerResponse> {
    let challengeResultBuffer: Buffer;
    try {
      challengeResultBuffer = await this._promiseSocket.send(this._buildPlayerPacket(), this._host, this._port);
    } catch (err: any) {
      throw new Error(err);
    }

    const challenge = challengeResultBuffer.slice(5);

    let resultBuffer: Buffer;
    try {
      resultBuffer = await this._promiseSocket.send(this._buildPlayerPacket(challenge), this._host, this._port);
    } catch (err: any) {
      throw new Error(err);
    }

    const parsedInfoBuffer = this._parsePlayerBuffer(resultBuffer);
    return parsedInfoBuffer;
  }

  private _buildInfoPacket(challenge?: Buffer) {
    let packet = Buffer.concat([
      Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]),
      Buffer.from([0x54]),
      Buffer.from('Source Engine Query', 'ascii')
    ]);
    if (challenge) {
      packet = Buffer.concat([
        packet,
        challenge
      ]);
    }
    packet = Buffer.concat([
      packet,
      Buffer.from([0x00])
    ]);
    return packet;
  }

  private _buildPlayerPacket(challenge?: Buffer) {
    let packet = Buffer.concat([
      Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]),
      Buffer.from([0x55])
    ]);
    if (challenge) {
      packet = Buffer.concat([
        packet,
        challenge
      ]);
    } else {
      packet = Buffer.concat([
        packet,
        Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])
      ]);
    }
    return packet;
  }

  private _parseInfoBuffer(buffer: Buffer): InfoResponse {
    const infoResponse: Partial<InfoResponse> = {};
    buffer = buffer.slice(5);
    [infoResponse.protocol, buffer] = this._readUInt8(buffer);
    [infoResponse.name, buffer] = this._readString(buffer);
    [infoResponse.map, buffer] = this._readString(buffer);
    [infoResponse.folder, buffer] = this._readString(buffer);
    [infoResponse.game, buffer] = this._readString(buffer);
    [infoResponse.appId, buffer] = this._readInt16LE(buffer);
    [infoResponse.players, buffer] = this._readUInt8(buffer);
    [infoResponse.maxPlayers, buffer] = this._readUInt8(buffer);
    [infoResponse.bots, buffer] = this._readUInt8(buffer);

    infoResponse.serverType = buffer.subarray(0, 1).toString('utf-8');
    buffer = buffer.slice(1);

    infoResponse.environment = buffer.subarray(0, 1).toString('utf-8');
    buffer = buffer.slice(1);

    [infoResponse.visibility, buffer] = this._readUInt8(buffer);
    [infoResponse.vac, buffer] = this._readUInt8(buffer);
    [infoResponse.version, buffer] = this._readString(buffer);

    // if the extra data flag (EDF) is present
    if (buffer.length > 1) {
      let edf: number;
      [edf, buffer] = this._readUInt8(buffer);
      if (edf & 0x80) {
        [infoResponse.port, buffer] = this._readInt16LE(buffer);
      }
      if (edf & 0x10) {
        buffer = buffer.slice(8);
      }
      if (edf & 0x40) {
        [infoResponse.spectatorPort, buffer] = this._readUInt8(buffer);
        [infoResponse.spectatorName, buffer] = this._readString(buffer);
      }
      if (edf & 0x20) {
        [infoResponse.keywords, buffer] = this._readString(buffer);
      }
      if (edf & 0x01) {
        infoResponse.gameId = buffer.readBigInt64LE();
        buffer = buffer.slice(8);
      }
    }

    return infoResponse as InfoResponse;
  }

  private _parsePlayerBuffer(buffer: Buffer): PlayerResponse {
    const playerResponse: Partial<PlayerResponse> = {};
    buffer = buffer.slice(5);
    [playerResponse.playerCount, buffer] = this._readUInt8(buffer);

    playerResponse.players = [];
    for (let i = 0; i < playerResponse.playerCount; i++) {
      let player: Player;
      [player, buffer] = this._readPlayer(buffer);
      playerResponse.players.push(player);
    }

    return playerResponse as PlayerResponse;
  }

  private _readString(buffer: Buffer): [string, Buffer] {
    const endOfName = buffer.indexOf(0x00);
    const stringBuffer = buffer.subarray(0, endOfName);
    const modifiedBuffer = buffer.slice(endOfName + 1);
    return [stringBuffer.toString('utf-8'), modifiedBuffer];
  }

  private _readUInt8(buffer: Buffer): [number, Buffer] {
    return [buffer.readUInt8(), buffer.slice(1)];
  }

  private _readInt16LE(buffer: Buffer): [number, Buffer] {
    return [buffer.readInt16LE(), buffer.slice(2)];
  }

  private _readPlayer(buffer: Buffer): [Player, Buffer] {
    let player: Partial<Player> = {};
    [player.index, buffer] = this._readUInt8(buffer);
    [player.name, buffer] = this._readString(buffer);
    player.score = buffer.readInt32LE();
    buffer = buffer.slice(4);
    player.duration = buffer.readFloatLE();
    buffer = buffer.slice(4);

    return [player as Player, buffer];
  }
}
