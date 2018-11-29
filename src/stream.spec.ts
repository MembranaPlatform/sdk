import { expect } from 'chai';
import crypto from 'crypto';
import fs from 'fs';
import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import path from 'path';
import { URL } from 'url';
import WebSocket, { Server } from 'ws';
import MembranaSDK from '.';
import StreamProvider from './providers/ws-node';

const credentials = {
  key: '1a1d8a12609cb3d82dc6958036046f67fa5a1ca7',
  secret: '50e83e4bac07f599c8c05928815868d2502dc96a',
};

describe('stream test', () => {
  const port = 4999;
  let wss: Server;
  let membrana: MembranaSDK;
  const mock: { [k: string]: string[] } = {};

  before(() => {
    mock['binance.candles.USDT-ETH.1m'] = fs
      .readFileSync(path.resolve(__dirname, '..', 'mock', 'binance.candles.USDT-ETH.1m.data'))
      .toString().split('\n');
    mock['binance.rates'] = fs
      .readFileSync(path.resolve(__dirname, '..', 'mock', 'binance.rates.data'))
      .toString().split('\n');
  });

  before(() => {
    wss = new Server({ port, verifyClient });
    wss.on('connection', (conn: WebSocket) => {
      conn.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'init',
        params: {
          exchange: 'binance',
        },
      }));
      conn.on('message', (data: WebSocket.Data) => {
        const msg = JSON.parse(String(data));
        conn.send(JSON.stringify({
          id: msg.id,
          jsonrpc: '2.0',
          result: { success: true },
        }));
        if (msg.method === 'subscribe' && msg.params && msg.params.ch && msg.params.ch in mock) {
          mock[msg.params.ch].forEach((dat) => conn.send(dat));
        }
      });
    });

    membrana = new MembranaSDK({
      ...credentials,
      StreamProvider,
      baseUrl: `http://localhost:${port}`,
    });
    membrana.on('error', (err) => {
      throw(err);
    });
  });

  before((done) => membrana.on('ready', done));

  after(() => {
    wss.close();
  });

  it('rates subscription', async () => {
    const ratesSubscription = await membrana.channel('rates').subscribe((rates) => {
      expect(rates).to.be.an('array');
      expect(rates[0]).to.be.an('array');
      expect(rates[0][0]).to.be.a('string');
      expect(rates[0][1]).to.be.a('number');
    });
    expect(ratesSubscription).to.deep.equals({ success: true });
    await new Promise((r) => setTimeout(r, 30));
  });

  it('candles subscription', async () => {
    const candlesSubscription = await membrana.channel('candles', 'USDT-ETH', '1m').subscribe((candles) => {
      expect(candles).to.be.an('array');
      expect(candles[0]).to.haveOwnProperty('BV');
      expect(candles[0]).to.haveOwnProperty('C');
      expect(candles[0]).to.haveOwnProperty('H');
      expect(candles[0]).to.haveOwnProperty('L');
      expect(candles[0]).to.haveOwnProperty('O');
      expect(candles[0]).to.haveOwnProperty('T');
      expect(candles[0]).to.haveOwnProperty('V');
    });
    expect(candlesSubscription).to.deep.equals({ success: true });
    await new Promise((r) => setTimeout(r, 30));
  });

  it('should deny invalid api key', async () => {
    membrana = new MembranaSDK({
      StreamProvider,
      baseUrl: `http://localhost:${port}`,
      key: '123456',
      secret: 'abcdef',
    });
    await new Promise((resolve) => {
      membrana.on('error', (err) => {
        expect(err.message).to.be.a('string');
        // expect(err.message).to.equals('Unexpected server response: 403');
        resolve();
      });
    });
  });
});

async function verifyClient(
  info: { origin: string; secure: boolean; req: IncomingMessage },
  done: (res: boolean, code?: number, message?: string, headers?: OutgoingHttpHeaders) => void): Promise<void> {
  const req = info.req;
  const url = new URL(`ws://${req.headers.host}${req.url}`);

  let authorization: string|null|undefined = req.headers.authorization;
  if (!authorization || !authorization.length) {
    authorization = url.searchParams.get('authorization');
    if (!authorization) {
      done(false, 401, 'UNAUTHORIZED');
      return;
    }
  }

  const delimiterIndex = authorization.indexOf(' ');
  if (delimiterIndex === -1) {
    return done(false, 400, 'INVALID_AUTHORIZATION_HEADER');
  }

  const type = authorization.slice(0, delimiterIndex);
  const payload = authorization.slice(delimiterIndex + 1);
  const [ key, signature, nonceString ] = payload.split(':');

  if (type !== 'membrana-token' || !key || !signature || !nonceString) {
    return done(false, 400, 'INVALID_AUTHORIZATION_HEADER');
  }

  if (key !== credentials.key) {
    return done(false, 403, String('WRONG_API_KEY'));
  }

  const nonce = parseInt(nonceString, 10);
  if (isNaN(nonce)) {
    return done(false, 403, 'INVALID_NONCE');
  }
  url.searchParams.delete('authorization');
  const signingPayload = `${url.host}${url.pathname}${url.search}\n${nonce}`;

  const hmac = crypto.createHmac('sha256', Buffer.from(credentials.secret, 'hex'));
  hmac.update(signingPayload);
  const digest = hmac.digest('hex');

  if (digest !== signature) {
    return done(false, 403, 'INVALID_SIGNATURE');
  }

  done(true);
}
