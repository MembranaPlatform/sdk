import Debug from 'debug';
import { sha256 } from 'js-sha256';
import { URL } from 'whatwg-url';
import EventEmitter from 'wolfy87-eventemitter';
import WebSocket, { Data } from 'ws';
import { Credentials } from './MembranaSDK';

const debug = Debug('membrana-sdk:ws');

export interface MembranaWSOptions {
  APIToken: Credentials;
  url?: string;
}

export interface ChannelDescriptor {
  subscribe(callback: (msg: any) => void): Promise<any>;
  unsubscribe(callback: (msg: any) => void): Promise<any>;
}

export enum Channel {
  CANDLES = 'candles',
  TRADES = 'trades',
  RATES = 'rates',
  TICKER = 'ticker',
  ORDERS = 'orders',
  ACCOUNT = 'account',
}

export interface SubscriptionOptions {
  channel: Channel;
  exchange: string;
  interval?: string;
  symbol?: string;
}

export interface SubscriptionParams extends SubscriptionOptions {
  apiKey: string;
}

export default class MembranaWS extends EventEmitter {
  public static defaultUrl: string = 'wss://membrana.io/api/v1/extern';
  private APIToken: Credentials;
  private lastReqId: number;
  private url: string;
  private wsInstance: WebSocket;

  constructor(options: MembranaWSOptions) {
    super();
    this.APIToken = options.APIToken;
    this.lastReqId = 0;
    this.url = options.url || MembranaWS.defaultUrl;

    const url = new URL(this.url);
    const nonce = Date.now();

    const signingString = `${url.host}${url.pathname}${url.search}\n${nonce}`;
    const signature = sha256.hmac(this.APIToken.secret, signingString);

    url.searchParams.set('authorization', `membrana-token ${this.APIToken.key}:${signature}:${nonce}`);
    this.wsInstance = new WebSocket(url.href);
    this.wsInstance.on('open', () => this.emit('open'));
    this.wsInstance.on('error', (err: any) => this.emit('error', err));
    this.wsInstance.on('message', (msgData: Data) => {
      try {
        const msg = JSON.parse(String(msgData));
        if ('ch' in msg) {
          this.emit(msg.ch, msg);
          return;
        } else if ('id' in msg) {
          this.emit(String(msg.id), msg);
          return;
        }
        debug('unknown ws event. msg: %o', msg);
      } catch (e) {
        debug('failed to parse ws event data', e.message || e);
      }
    });
  }

  public account(exchange: string): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: Channel.ACCOUNT, exchange };
    return {
      subscribe: this.subscribe.bind(this, options),
      unsubscribe: this.unsubscribe.bind(this, options),
    };
  }

  public candles(exchange: string, symbol: string, interval: string = '1m'): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: Channel.CANDLES, exchange, symbol, interval };
    return {
      subscribe: this.subscribe.bind(this, options),
      unsubscribe: this.unsubscribe.bind(this, options),
    };
  }

  public orders(exchange: string, symbol: string): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: Channel.ACCOUNT, exchange, symbol };
    return {
      subscribe: this.subscribe.bind(this, options),
      unsubscribe: this.unsubscribe.bind(this, options),
    };
  }

  public rates(exchange: string): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: Channel.RATES, exchange };
    return {
      subscribe: this.subscribe.bind(this, options),
      unsubscribe: this.unsubscribe.bind(this, options),
    };
  }

  public ticker(exchange: string, symbol: string): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: Channel.TICKER, exchange, symbol };
    return {
      subscribe: this.subscribe.bind(this, options),
      unsubscribe: this.unsubscribe.bind(this, options),
    };
  }

  public trades(exchange: string, symbol: string): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: Channel.TRADES, exchange, symbol };
    return {
      subscribe: this.subscribe.bind(this, options),
      unsubscribe: this.unsubscribe.bind(this, options),
    };
  }

  public subscribe(options: SubscriptionOptions, callback: (msg: any) => void) {
    return this.subAction(options, true, callback);
  }

  public unsubscribe(options: SubscriptionOptions, callback: (msg: any) => void) {
    return this.subAction(options, false, callback);
  }

  private subAction(options: SubscriptionOptions, isSubscribe: boolean, callback: (msg: any) => void) {
    const params: SubscriptionParams = {
      apiKey: this.APIToken.key,
      channel: options.channel,
      exchange: options.exchange,
      interval: options.interval,
      symbol: options.symbol,
    };
    const request = {
      ch: generateChannelName(params),
      id: ++this.lastReqId,
      jsonrpc: '2.0',
      method: isSubscribe ? 'subscribe' : 'unsubscribe',
      params,
    };
    return new Promise((resolve) => {
      this[isSubscribe ? 'on' : 'off'](request.ch, callback);
      this.once(String(this.lastReqId), resolve);
      this.wsInstance.send(JSON.stringify(request));
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
