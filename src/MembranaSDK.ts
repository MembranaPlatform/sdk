import 'isomorphic-fetch';
import { URL } from 'whatwg-url';
import OrderBlank from './OrderBlank';
import StreamProvider, {
  ChannelDescriptor,
  MarketDataType,
  StreamProviderOptions,
  SubscriptionOptions,
} from './providers/stream';
import { sign } from './util';

interface StreamProviderClass {
  new(options: StreamProviderOptions): StreamProvider;
}

export interface MembranaSDKOptions {
  baseUrl?: string;
  key: string;
  secret: string;
  StreamProvider?: StreamProviderClass;
  wsUrl?: string;
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface OrderRequest {
  amount: number;
  limit: number;
  side: OrderSide;
  symbol: string;
  type?: 'LIMIT';
}

class MembranaSDK {
  public static defaultUrl: string = 'https://membrana.io';
  public baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private stream?: StreamProvider;

  constructor(options: MembranaSDKOptions) {
    this.apiKey = options.key;
    this.apiSecret = options.secret;
    this.baseUrl = options.baseUrl || MembranaSDK.defaultUrl;
    if (options.StreamProvider) {
      this.stream = new options.StreamProvider({
        baseUrl: options.wsUrl || this.baseUrl.replace(/^http/, 'ws'),
        key: options.key,
        secret: options.secret,
      });
    }
  }

  public off(event: 'error', callback: (err: Error) => void): void;
  public off(event: 'open'|'ready', callback: () => void): void;
  public off(event: string, callback: (...params: any[]) => void): void {
    if (!this.stream) {
      throw new Error('StreamProvider was not initialized');
    }
    this.stream.off(event, callback);
  }

  public on(event: 'error', callback: (err: Error) => void): void;
  public on(event: 'open'|'ready', callback: () => void): void;
  public on(event: string, callback: (...params: any[]) => void): void {
    if (!this.stream) {
      throw new Error('StreamProvider was not initialized');
    }
    this.stream.on(event, callback);
  }

  public once(event: 'error', callback: (err: Error) => void): void;
  public once(event: 'open'|'ready', callback: () => void): void;
  public once(event: string, callback: (...params: any[]) => void): void {
    if (!this.stream) {
      throw new Error('StreamProvider was not initialized');
    }
    this.stream.once(event, callback);
  }

  public getBalances() {
    return this.signedRequest('/api/v1/external/balance');
  }

  public getMarkets() {
    return this.signedRequest('/api/v1/external/markets');
  }

  public getOrders(symbol: string) {
    return this.signedRequest('/api/v1/external/order?symbol=' + symbol);
  }

  public cancelOrder(orderId: string) {
    return this.signedRequest('/api/v1/external/order/' + orderId, { method: 'DELETE' });
  }

  public order(init?: string|OrderRequest) {
    return new OrderBlank(this, init);
  }

  public async placeOrder(orderReq: OrderRequest) {
    const order = await this.signedRequest('/api/v1/external/order', {
      body: JSON.stringify(orderReq),
      method: 'POST',
    });
    return order;
  }

  public account(): ChannelDescriptor {
    if (!this.stream) {
      throw new Error('StreamProvider was not initialized');
    }
    const options: SubscriptionOptions = { channel: 'account' };
    return {
      subscribe: this.stream.subscribe.bind(this.stream, options),
      // unsubscribe: this.stream.unsubscribe.bind(this.stream, options),
    };
  }

  public channel(type: 'candles', symbol: string, interval: string): ChannelDescriptor;
  public channel(type: 'orders'|'ticker'|'trades', symbol: string): ChannelDescriptor;
  public channel(type: 'rates'): ChannelDescriptor;
  public channel(type: MarketDataType, symbol?: string, interval?: string): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: type, symbol, interval };
    const subscribe = (usersAction: (msg: any) => void) => {
      if (!this.stream) {
        throw new Error('StreamProvider is not initialized');
      }
      const callback = type === 'orders'
        ? (msg: any) => usersAction(msg.content)
        : (msg: any) => usersAction(msg.content[type]);
      return this.stream.subscribe(options, callback);
    };
    return { subscribe };
  }

  private async signedRequest(path: string, init?: RequestInit): Promise<{ [k: string]: any }> {
    const url = new URL(path, this.baseUrl);
    const headers: { [h: string]: string } = {};
    init = init || {};
    init.headers = headers;

    if (init.method === 'POST' || init.method === 'PUT') {
      headers['content-type'] = 'application/json';
    } else if (!init.method) {
      init.method = 'GET';
    }

    const nonce = Date.now();
    const signature = sign(this.apiSecret, init.method, url, nonce, init.body as string || '');
    headers.Authorization = `membrana-token ${this.apiKey}:${signature}:${nonce}`;
    const response = await fetch(url.href, init);
    const data = await response.json();
    if (response.ok && !('error' in data)) {
      return data;
    } else {
      throw {
        ...data,
        httpStatusCode: response.status,
        httpStatusText: response.statusText,
      };
    }
  }
}

export default MembranaSDK;
