import { expect } from 'chai';
import MembranaSDK from './MembranaSDK';
import OrderBlank from './OrderBlank';

describe('OrderBlank spec', () => {
  const APIToken = { key: '', secret: '' };

  it('stringified order should be clean structure', () => {
    const sdk = new MembranaSDK({ APIToken });
    const order = new OrderBlank('BTC-USDT', sdk);
    expect(JSON.stringify(order)).to.equals('{"amount":0,"limit":0,"side":"SELL","symbol":"BTC-USDT","type":"LIMIT"}');
  });

  it('each action must not mutate the source state', () => {
    const sdk = new MembranaSDK({ APIToken });
    const orderA = new OrderBlank('BTC-USDT', sdk);
    const orderB = orderA.amount(0.4).limit(6700);
    expect(orderA).to.does.not.equal(orderB);
    expect(orderA.AMOUNT).to.equals(0);
    expect(orderB.AMOUNT).to.equals(0.4);
    expect(orderA.LIMIT).to.equals(0);
    expect(orderB.LIMIT).to.equals(6700);
    expect(orderA.SYMBOL).to.equals(orderB.SYMBOL);
  });
});
