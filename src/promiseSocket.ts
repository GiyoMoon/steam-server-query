import { createSocket, Socket } from 'dgram';

export class PromiseSocket {
  private _socket: Socket;

  constructor(private _timeout = 1000) {
    this._socket = createSocket('udp4');
  }

  public async send(buffer: Buffer, host: string, port: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this._socket.send(buffer, port, host, (err) => {
        if (err) return reject(typeof err == 'string' ? new Error(err) : err);

        const messageListener = (buffer: any) => {
          this._socket.removeListener('message', messageListener);
          this._socket.removeListener('error', errorListener);
          clearTimeout(timeout);
          return resolve(buffer);
        };

        const errorListener = (err: Error) => {
          reject(err);
        };

        const timeout = setTimeout(() => {
          this._socket.removeListener('message', messageListener);
          this._socket.removeListener('error', errorListener);
          reject('Timeout reached. Possible reasons: You are being rate limited; Timeout too short; Wrong server host configured;');
        }, this._timeout);

        this._socket.on('message', messageListener);
        this._socket.on('error', errorListener);
      });
    });
  }
}
