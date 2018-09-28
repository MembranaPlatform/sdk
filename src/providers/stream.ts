import Debug from 'debug';
import { sha256 } from 'js-sha256';
import { URL } from 'whatwg-url';
import EventEmitter from 'wolfy87-eventemitter';

const debug = Debug('membrana-sdk:ws');

export interface StreamProviderOptions {
  baseUrl?: string;
  initTimeout?: number;
  key: string;
  secret: string;
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
  public static defaultUrl: string = 'wss://membrana.io';
  protected Authorization: string;
  protected exchange: string = '';
  protected initTimeout: NodeJS.Timer;
  protected lastReqId: number;
  protected apiKey: string;
  protected apiSecret: string;
  protected url: string;

  constructor(options: StreamProviderOptions) {
    super();
    this.lastReqId = 0;
    this.apiKey = options.key;
    this.apiSecret = options.secret;
    this.url = (options.baseUrl || StreamProvider.defaultUrl) + '/api/v1/extern';

    const url = new URL(this.url);
    const nonce = Date.now();

    const signingString = `${url.host}${url.pathname}${url.search}\n${nonce}`;
    const signature = sha256.hmac(this.apiSecret, signingString);
    this.Authorization = `membrana-token ${this.apiKey}:${signature}:${nonce}`;

    this.initTimeout = setTimeout(() => {
      this.emit('error', new Error('init timeout exceeded'));
    }, options.initTimeout || 5000);
  }

  public subscribe(options: SubscriptionOptions, callback: (msg: any) => void) {
    return this.subAction(options, true, callback);
  }

  public unsubscribe(options: SubscriptionOptions, callback: (msg: any) => void) {
    return this.subAction(options, false, callback);
  }

  protected onMessage(msg: { [k: string]: any }) {
    if ('method' in msg) {
      if (msg.method === 'notification' && Array.isArray(msg.params)) {
        this.emit.apply(this, msg.params);
        return;
      }
      if (msg.method === 'init') {
        this.exchange = msg.params.exchange;
        clearTimeout(this.initTimeout);
        this.emit('ready');
        return;
      }
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
      apiKey: this.apiKey,
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
