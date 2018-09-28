import { expect } from 'chai';
import nock from 'nock';
import MembranaSDK from './MembranaSDK';

describe('MembranaSDK spec', () => {
  const credentials = {
    key: '',
    secret: '',
  };
  const baseUrl = 'http://localhost:5000';

  it('getMarkets method', async () => {
    nock(baseUrl)
      .get('/api/v1/external/markets')
      .reply(200, `[{"last":0.034209,"marketCurrencyName":"ETH","minTradeSize":0.001,"prevDay":0.035946,
        "priceStep":0.000001,"symbol":"ETH-BTC","tradeStep":0.001,"volume":219929.253},{"last":0.008859,
        "marketCurrencyName":"LTC","minTradeSize":0.01,"prevDay":0.008973,"priceStep":0.000001,"symbol":
        "LTC-BTC","tradeStep":0.01,"volume":216935.27},{"last":6468.2,"marketCurrencyName":"BTC",
        "minTradeSize":0.000001,"prevDay":6690.63,"priceStep":0.01,"symbol":"BTC-USDT","tradeStep":
        0.000001,"volume":41352.305216},{"last":221.25,"marketCurrencyName":"ETH","minTradeSize":0.00001,
        "prevDay":240.59,"priceStep":0.01,"symbol":"ETH-USDT","tradeStep":0.00001,"volume":422752.63813}]
        `, { 'content-type': 'application/json' });

    const sdk = new MembranaSDK({ ...credentials, baseUrl });
    const markets = await sdk.getMarkets();
    expect(markets).to.deep.include({
      last: 0.034209,
      marketCurrencyName: 'ETH',
      minTradeSize: 0.001,
      prevDay: 0.035946,
      priceStep: 0.000001,
      symbol: 'ETH-BTC',
      tradeStep: 0.001,
      volume: 219929.253,
    });
    expect(markets).to.deep.include({
      last: 6468.2,
      marketCurrencyName: 'BTC',
      minTradeSize: 0.000001,
      prevDay: 6690.63,
      priceStep: 0.01,
      symbol: 'BTC-USDT',
      tradeStep: 0.000001,
      volume: 41352.305216,
    });
  });

  it('getBalances method', async () => {
    nock(baseUrl)
      .get('/api/v1/external/balance')
      .reply(200, '[{"available":0.00003582,"name":"BTC","total":0.00003582},{"available":0,"name":"LTC","total":0},'
        + '{"available":0.15739601,"name":"ETH","total":0.15739601},{"available":0,"name":"NEO","total":0},'
        + '{"available":0,"name":"USDT","total":0}]', { 'content-type': 'application/json' });

    const sdk = new MembranaSDK({ ...credentials, baseUrl });
    const balances = await sdk.getBalances();
    expect(balances).to.deep.include({ available: 0.00003582, name: 'BTC', total: 0.00003582 });
    expect(balances).to.deep.include({ available: 0.15739601, name: 'ETH', total: 0.15739601 });
    expect(balances).to.deep.include({ available: 0, name: 'LTC', total: 0 });
  });

  it('getOrders method', async () => {
    const symbol = 'LTC-USDT';
    nock(baseUrl)
      .get('/api/v1/external/order')
      .query({ symbol })
      .reply(200, '{"open":[],"closed":[]}', { 'content-type': 'application/json' });

    const sdk = new MembranaSDK({ ...credentials, baseUrl });
    const orders = await sdk.getOrders(symbol);
    expect(orders).to.deep.equals({ open: [], closed: [] });
  });

  // it('order method', async () => {
  //   const symbol = 'USDT-XRP';
  //   const sdk = new MembranaSDK({ APIToken, baseUrl });
  //   const orderBlank = sdk.order(symbol).sell();
  //   const response = await orderBlank.limit(0.47).amount(40).send();
  //   console.log(response);
  //   const order = await response.json();
  //   console.log(order);
  // });

  // it('cancelOrder method', async () => {
  //   const symbol = 'USDT-XRP';
  //   const sdk = new MembranaSDK({ APIToken, baseUrl });
  //   const response = await sdk.cancelOrder(symbol);
  //   console.log(response);
  //   const order = await response.json();
  //   console.log(order);
  // });
});
