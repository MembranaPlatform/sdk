import Debug from 'debug';
import { sha256 } from 'js-sha256';
import { URL } from 'whatwg-url';
import EventEmitter from 'wolfy87-eventemitter';
import { Credentials } from '../MembranaSDK';

const debug = Debug('membrana-sdk:ws');

export interface StreamProviderOptions {
  APIToken: Credentials;
  url?: string;
}

export interface ChannelDescriptor {
  subscribe(callback: (msg: any) => void): Promise<any>;
  unsubscribe(callback: (msg: any) => void): Promise<any>;
}

export type MarketDataType = 'candles'|'trades'|'rates'|'ticker'|'orders'|'account';

export interface SubscriptionOptions {
  channel: MarketDataType;
  interval?: string;
  symbol?: string;
}

export interface SubscriptionParams extends SubscriptionOptions {
  apiKey: string;
  exchange: string;
}

export default abstract class StreamProvider extends EventEmitter {
  public static defaultUrl: string = 'wss://membrana.io/api/v1/extern';
  protected Authorization: string;
  protected APIToken: Credentials;
  protected exchange: string = '';
  protected lastReqId: number;
  protected url: string;

  constructor(options: StreamProviderOptions) {
    super();
    this.APIToken = options.APIToken;
    this.lastReqId = 0;
    this.url = options.url || StreamProvider.defaultUrl;

    const url = new URL(this.url);
    const nonce = Date.now();

    const signingString = `${url.host}${url.pathname}${url.search}\n${nonce}`;
    const signature = sha256.hmac(this.APIToken.secret, signingString);
    this.Authorization = `membrana-token ${this.APIToken.key}:${signature}:${nonce}`;
  }

  public subscribe(options: SubscriptionOptions, callback: (msg: any) => void) {
    return this.subAction(options, true, callback);
  }

  public unsubscribe(options: SubscriptionOptions, callback: (msg: any) => void) {
    return this.subAction(options, false, callback);
  }

  protected onMessage(msg: { [k: string]: any }) {
    if ('method' in msg && msg.method === 'notification' && Array.isArray(msg.params)) {
      this.emit.apply(this, msg.params);
      return;
    }
    if ('id' in msg) {
      this.emit(String(msg.id), msg);
      return;
    }
    debug('unknown ws event. msg: %o', msg);
  }

  protected abstract send(data: string): void;

  private subAction(options: SubscriptionOptions, isSubscribe: boolean, callback: (msg: any) => void) {
    const params: SubscriptionParams = {
      apiKey: this.APIToken.key,
      channel: options.channel,
      exchange: this.exchange,
      interval: options.interval,
      symbol: options.symbol,
    };
    const ch = generateChannelName(params);
    const request = {
      id: ++this.lastReqId,
      jsonrpc: '2.0',
      method: isSubscribe ? 'subscribe' : 'unsubscribe',
      params: { ch },
    };
    return new Promise((resolve, reject) => {
      this[isSubscribe ? 'on' : 'off'](ch, callback);
      this.once(String(this.lastReqId), (response: any) => {
        if ('error' in response) {
          reject(response);
        }
        if (isSubscribe) {
          Object.defineProperty(response, 'unsubscribe', {
            value: this.subAction.bind(this, options, false, callback),
          });
        }
        resolve(response);
      });
      this.send(JSON.stringify(request));
    });
  }
}

function generateChannelName(params: SubscriptionParams): string {
  switch (params.channel) {
    case 'candles':
      return `${params.exchange}.${params.channel}.${params.symbol}.${params.interval}`;
    case 'rates':
      return `${params.exchange}.${params.channel}`;
    case 'account':
      return `${params.exchange}.${params.channel}.${params.apiKey}`;
    default:
      return `${params.exchange}.${params.channel}.${params.symbol}`;
  }
}
