import Debug from 'debug';
import StreamProvider, { StreamProviderOptions } from './stream';

const debug = Debug('membrana-sdk:ws');

class WSStreamProviderBrowser extends StreamProvider {
  protected wsInstance: WebSocket;

  constructor(options: StreamProviderOptions) {
    super(options);
    const url = new URL(this.url);
    url.searchParams.set('authorization', this.Authorization);
    this.wsInstance = new WebSocket(url.href);
    this.wsInstance.onopen = () => this.emit('open');
    this.wsInstance.onerror = (err: any) => this.emit('error', err);
    this.wsInstance.onmessage = (msgData: MessageEvent) => {
      try {
        const msg = JSON.parse(String(msgData.data));
        this.onMessage(msg);
      } catch (e) {
        debug('failed to parse ws event data', e.message || e);
      }
    };
  }

  protected send(data: string): void {
    if (this.wsInstance.readyState === this.wsInstance.OPEN) {
      this.wsInstance.send(data);
    } else {
      this.wsInstance.addEventListener('open', this.wsInstance.send.bind(this.wsInstance, data), { once: true });
    }
  }
}

export = WSStreamProviderBrowser;
