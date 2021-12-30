import { createSocket, Socket } from 'dgram';

export class PromiseSocket {
  private _socket: Socket;

  constructor(private _attempts: number, private _timeout: number | number[]) {
    if (
      Array.isArray(this._timeout) &&
      this._attempts !== this._timeout.length
    ) {
      throw new Error(`Number of attempts (${this._attempts}) does not match the length of the timeout array (${this._timeout.length})`);
    }
    this._socket = createSocket('udp4');
  }

  public async send(buffer: Buffer, host: string, port: number): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < this._attempts; i++) {
        let timeout: number;
        if (Array.isArray(this._timeout)) {
          timeout = this._timeout[i];
        } else {
          timeout = this._timeout;
        }

        try {
          const messageBuffer = await this._socketSend(buffer, host, port, timeout);
          return resolve(messageBuffer);
        } catch (err) {
          if (i === this._attempts - 1) {
            return reject(err);
          }
        }
      }
    });
  }

  private _socketSend(buffer: Buffer, host: string, port: number, timeout: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this._socket.send(buffer, port, host, (err) => {
        if (err) return reject(typeof err == 'string' ? new Error(err) : err);

        const messageListener = (buffer: any) => {
          this._socket.removeListener('message', messageListener);
          this._socket.removeListener('error', errorListener);
          clearTimeout(timeoutFnc);
          return resolve(buffer);
        };

        const errorListener = (err: Error) => {
          clearTimeout(timeoutFnc);
          return reject(err);
        };

        const timeoutFnc = setTimeout(() => {
          this._socket.removeListener('message', messageListener);
          this._socket.removeListener('error', errorListener);
          return reject('Timeout reached. Possible reasons: You are being rate limited; Timeout too short; Wrong server host configured;');
        }, timeout);

        this._socket.on('message', messageListener);
        this._socket.on('error', errorListener);
      });
    });
  }
}
