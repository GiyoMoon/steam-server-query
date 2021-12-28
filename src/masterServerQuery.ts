import { PromiseSocket } from './promiseSocket';
import { REGIONS, Filters } from './types';

const ZERO_IP = '0.0.0.0:0';
const RESPONSE_START = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x66, 0x0A]);

/**
 * Fetch a Steam master server to retrieve a list of game server hosts (https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol)
 * @param masterServer Host and port of the master server to fetch
 * @param region The region of the world where you wish to find servers in. Use REGIONS.ALL for all regions.
 * @param timeout Time in ms after the call should fail. Defaults to 1 second.
 * @param filters Optional object which contains filters to be sent with the query. Read more here: https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol#Filter
 */
export async function queryMaster(masterServer: string, region: REGIONS, timeout = 1000, filters?: Filters) {
  const splitMasterServer = masterServer.split(':');
  const host = splitMasterServer[0];
  const port = parseInt(splitMasterServer[1]);

  const masterServerQuery = new MasterServerQuery(host, port, region, filters, timeout);
  const servers = await masterServerQuery.fetchServers();
  return servers;
}

class MasterServerQuery {
  private _seedId = ZERO_IP;
  private _promiseSocket: PromiseSocket;

  constructor(private _host: string, private _port: number, private _region: REGIONS, private _filters: Filters = {}, timeout: number) {
    this._promiseSocket = new PromiseSocket(timeout);
  };

  public async fetchServers() {
    const resultBuffer = await this._promiseSocket.send(this._buildPacket(), this._host, this._port);
    const parsedIps = this._parseBuffer(resultBuffer);
    if (parsedIps[parsedIps.length - 1] === ZERO_IP) {
      parsedIps.pop();
    }
    return parsedIps;
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
    const ips: string[] = [];
    if (buffer.compare(RESPONSE_START, 0, 6, 0, 6) === 0) {
      buffer = buffer.slice(6);
    }

    let i = 0;
    while (i < buffer.length) {
      const ip = this._numberToIp(buffer.readInt32BE(i));
      const port = buffer[i + 4] << 8 | buffer[i + 5];
      ips.push(`${ip}:${port}`);
      i += 6;
    }
    return ips;
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
