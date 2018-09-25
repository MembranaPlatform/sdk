import 'isomorphic-fetch';
import { sha256 } from 'js-sha256';
import { URL } from 'whatwg-url';
import OrderBlank from './OrderBlank';
import { toLengthPrefixedUint8Array } from './util';

export interface MembranaSDKOptions {
  APIToken: Credentials;
  baseUrl?: string;
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

  constructor(options: MembranaSDKOptions) {
    this.APIToken = options.APIToken;
    this.baseUrl = options.baseUrl || MembranaSDK.defaultUrl;
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

  private signedRequest(path: string, init?: RequestInit): Promise<Response> {
    const url = new URL(path, this.baseUrl);
    const headers: { [h: string]: string } = {};
    init = init || {};
    init.headers = headers;

    if (init.method === 'POST' || init.method === 'PUT') {
      headers['content-type'] = 'application/json';
    } else if (!init.method) {
      init.method = 'GET';
    }

    const body = init.body || '';
    const nonce = Date.now();
    const method = init.method;

    const signingString = `${method}\n${url.host}${url.pathname}${url.search}\n${nonce}\n${body}`;
    const signPrefixedString = toLengthPrefixedUint8Array(signingString);

    const signature = sha256.hmac(this.APIToken.secret, signPrefixedString);
    headers.Authorization = `membrana-token ${this.APIToken.key}:${signature}:${nonce}`;

    return fetch(url.href, init);
  }
}

export default MembranaSDK;
