import { PromiseSocket } from '../promiseSocket';
import { REGIONS, Filter } from './masterServerTypes';

const ZERO_IP = '0.0.0.0:0';
const RESPONSE_START = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x66, 0x0A]);

/**
 * Fetch a Steam master server to retrieve a list of game server hosts.
 * 
 * Read more [here](https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol).
 * @param masterServer Host and port of the master server to call.
 * @param region The region of the world where you wish to find servers in. Use REGIONS.ALL for all regions.
 * @param filters Optional. Object which contains filters to be sent with the query. Default is { }. Read more [here](https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol#Filter).
 * @param timeout Optional. Time in milliseconds after the socket request should fail. Default is 1 second.
 * @returns A promise including an array of game server hosts.
 */
export async function queryMasterServer(masterServer: string, region: REGIONS, filters: Filter = {}, timeout = 1000): Promise<string[]> {
  const splitMasterServer = masterServer.split(':');
  const host = splitMasterServer[0];
  const port = parseInt(splitMasterServer[1]);

  const masterServerQuery = new MasterServerQuery(host, port, region, filters, timeout);
  const hosts = await masterServerQuery.fetchServers();
  return hosts;
}

class MasterServerQuery {
  private _seedId = ZERO_IP;
  private _promiseSocket: PromiseSocket;
  private _hosts: string[] = [];

  constructor(private _host: string, private _port: number, private _region: REGIONS, private _filters: Filter, timeout: number) {
    this._promiseSocket = new PromiseSocket(timeout);
  };

  public async fetchServers() {
    do {
      let resultBuffer: Buffer;
      try {
        resultBuffer = await this._promiseSocket.send(this._buildPacket(), this._host, this._port);
        // catch promise rejections and throw error
      } catch (err: any) {
        throw new Error(err);
      }

      const parsedHosts = this._parseBuffer(resultBuffer);
      this._seedId = parsedHosts[parsedHosts.length - 1];
      this._hosts.push(...parsedHosts);
    } while (this._seedId !== ZERO_IP);

    // remove ZERO_IP from end of host list
    this._hosts.pop();
    return this._hosts;
  }

  private _buildPacket() {
    return Buffer.concat([
      Buffer.from([0x31]),
      Buffer.from([this._region]),
      Buffer.from(this._seedId, 'ascii'), Buffer.from([0x00]),
      Buffer.from(this.formatFilters(), 'ascii'),
    ]);
  }

  private formatFilters() {
    let str = '';
    for (const key of Object.keys(this._filters)) {
      // @ts-ignore
      let val = this._filters[key];
      str += '\\' + key + '\\';
      str += (key === 'nor' || key === 'nand')
        ? Object.keys(val).length + this._slashifyObject(val)
        : val;
    }
    str += '\x00';
    return str;
  }

  private _slashifyObject(object: any) {
    let str = '';
    for (const key of Object.keys(object)) {
      let val = object[key];
      str += '\\' + key + '\\' + val;
    }
    return str;
  }

  private _parseBuffer(buffer: Buffer) {
    const hosts: string[] = [];
    if (buffer.compare(RESPONSE_START, 0, 6, 0, 6) === 0) {
      buffer = buffer.slice(6);
    }

    let i = 0;
    while (i < buffer.length) {
      const ip = this._numberToIp(buffer.readInt32BE(i));
      const port = buffer[i + 4] << 8 | buffer[i + 5];
      hosts.push(`${ip}:${port}`);
      i += 6;
    }
    return hosts;
  }

  private _numberToIp(number: number) {
    var nbuffer = new ArrayBuffer(4);
    var ndv = new DataView(nbuffer);
    ndv.setUint32(0, number);

    var a = new Array();
    for (var i = 0; i < 4; i++) {
      a[i] = ndv.getUint8(i);
    }
    return a.join('.');
  }
}
