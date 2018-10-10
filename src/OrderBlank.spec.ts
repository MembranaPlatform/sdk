import { expect } from 'chai';
import MembranaSDK, { OrderSide } from './MembranaSDK';
import OrderBlank from './OrderBlank';

describe('OrderBlank spec', () => {
  it('stringified order should be clean structure', () => {
    const sdk = new MembranaSDK({ key: '', secret: '' });
    const order = new OrderBlank(sdk, 'BTC-USDT');
    expect(JSON.stringify(order)).to.equals('{"amount":0,"limit":0,"side":"SELL","symbol":"BTC-USDT","type":"LIMIT"}');
  });

  it('each action must not mutate the source state', () => {
    const sdk = new MembranaSDK({ key: '', secret: '' });
    const orderA = new OrderBlank(sdk, 'BTC-USDT');
    const orderB = orderA.amount(0.4).limit(6700);
    expect(orderA).to.does.not.equal(orderB);
    expect(orderA.AMOUNT).to.equals(0);
    expect(orderB.AMOUNT).to.equals(0.4);
    expect(orderA.LIMIT).to.equals(0);
    expect(orderB.LIMIT).to.equals(6700);
    expect(orderA.SYMBOL).to.equals(orderB.SYMBOL);
  });

  it('another approach should also work', () => {
    const sdk = new MembranaSDK({ key: '', secret: '' });
    const orderA = new OrderBlank(sdk);
    expect(orderA.AMOUNT).to.equals(0);
    expect(orderA.LIMIT).to.equals(0);
    expect(orderA.SYMBOL).to.equals('');
  });

  it('pass object as init', () => {
    const sdk = new MembranaSDK({ key: '', secret: '' });
    const orderA = new OrderBlank(sdk, {
      amount: 1.4,
      limit: 7000,
      side: OrderSide.SELL,
      symbol: 'BTC-USDT',
      type: 'LIMIT',
    });
    expect(orderA.AMOUNT).to.equals(1.4);
    expect(orderA.LIMIT).to.equals(7000);
    expect(orderA.SYMBOL).to.equals('BTC-USDT');
  });
});
