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
  APIToken: Credentials;
  baseUrl?: string;
  StreamProvider: StreamProviderClass;
  wsUrl?: string;
}

export interface Credentials {
  key: string;
  secret: string;
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
  private APIToken: Credentials;
  private stream: StreamProvider;

  constructor(options: MembranaSDKOptions) {
    this.APIToken = options.APIToken;
    this.baseUrl = options.baseUrl || MembranaSDK.defaultUrl;
    this.stream = new options.StreamProvider({ APIToken: options.APIToken, url: options.wsUrl });
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

  public order(symbol: string) {
    return new OrderBlank(symbol, this);
  }

  public placeOrder(orderReq: OrderRequest) {
    return this.signedRequest('/api/v1/external/order', {
      body: JSON.stringify(orderReq),
      method: 'POST',
    });
  }

  public account(): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: 'account' };
    return {
      subscribe: this.stream.subscribe.bind(this.stream, options),
      unsubscribe: this.stream.unsubscribe.bind(this.stream, options),
    };
  }

  public market(type: 'candles', symbol: string, interval: string): ChannelDescriptor;
  public market(type: 'orders'|'ticker'|'trades', symbol: string): ChannelDescriptor;
  public market(type: 'rates'): ChannelDescriptor;
  public market(type: MarketDataType, symbol?: string, interval?: string): ChannelDescriptor {
    const options: SubscriptionOptions = { channel: type, symbol, interval };
    return {
      subscribe: this.stream.subscribe.bind(this.stream, options),
      unsubscribe: this.stream.unsubscribe.bind(this.stream, options),
    };
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
    const signature = sign(this.APIToken.secret, init.method, url, nonce, init.body as string || '');
    headers.Authorization = `membrana-token ${this.APIToken.key}:${signature}:${nonce}`;
    const response = await fetch(url.href, init);
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw {
        ...data,
        statusCode: response.status,
        statusText: response.statusText,
      };
    }
  }
}

export default MembranaSDK;
