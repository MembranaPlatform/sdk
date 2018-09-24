import { expect } from 'chai';
import MembranaSDK from './MembranaSDK';

describe('MembranaSDK spec', () => {
  const APIToken = { key: '', secret: '' };
  const baseUrl = 'http://localhost:5000';

  it('getMarkets method', async () => {
    const sdk = new MembranaSDK({ APIToken, baseUrl });
    const markets = await sdk.getMarkets();
    // tslint:disable-next-line:no-unused-expression
    expect(markets.ok).to.be.true;
    // tslint:disable-next-line:no-console
    console.log(markets);
  });
});
