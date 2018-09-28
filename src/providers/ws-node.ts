import Debug from 'debug';
import WebSocket from 'ws';
import StreamProvider, { StreamProviderOptions } from './stream';

const debug = Debug('membrana-sdk:ws');

export default class WSStreamProviderNode extends StreamProvider {
  protected wsInstance: WebSocket;

  constructor(options: StreamProviderOptions) {
    super(options);
    const headers = { Authorization: this.Authorization };
    this.wsInstance = new WebSocket(this.url, { headers });
    this.wsInstance.on('open', () => this.emit('open'));
    this.wsInstance.on('error', (err: any) => this.emit('error', err));
    this.wsInstance.on('message', (msgData: WebSocket.Data) => {
      try {
        const msg = JSON.parse(String(msgData));
        this.onMessage(msg);
      } catch (e) {
        debug('failed to parse ws event data', e.message || e);
      }
    });
  }

  protected send(data: string): void {
    if (this.wsInstance.readyState !== this.wsInstance.OPEN) {
      throw new Error('websocket is not ready');
    }
    this.wsInstance.send(data);
  }
}
