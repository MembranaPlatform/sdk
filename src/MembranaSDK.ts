import { HmacSHA256 } from 'crypto-js';
import 'isomorphic-fetch';
import { URL } from 'whatwg-url';
import OrderBlank from './OrderBlank';

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
    const signStringBuffer = toLengthPrefixedBuffer(signingString);

    const signature = HmacSHA256(signStringBuffer.toString(), this.APIToken.secret).toString();
    headers.Authorization = `membrana-token ${this.APIToken.key}:${signature}:${nonce}`;

    return fetch(url.href, init);
  }
}

export default MembranaSDK;

function toLengthPrefixedBuffer(msg: string): Buffer {
  const msgBuf = Buffer.from(msg, 'utf8');
  const sizeBuf = Buffer.allocUnsafe(8);

  const size = msgBuf.length;
  const big = ~~(size / 0x0100000000);
  const low = (size % 0x0100000000);
  sizeBuf.writeUInt32BE(big, 0);
  sizeBuf.writeUInt32BE(low, 4);
  return Buffer.concat([sizeBuf, msgBuf]);
}
