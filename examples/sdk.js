/*
  It's plain javascript example so it requires compiled code from '../dist' folder.
  Perform 'npm install' and 'npm run build' before trying these examples.
*/
const MembranaSDK = require('../dist');
const StreamProvider = require('../dist/providers/ws-node');
// const StreamProvider = require('../dist/providers/ws-browser');

const credentials = {
  key: 'your API key',
  secret: 'your API secret',
};

const membrana = new MembranaSDK({
  ...credentials,
  StreamProvider,
  baseUrl: 'https://beta.membrana.io',
});

membrana.on('error', (err) => {
  console.error('error event', err);
  process.exit(1);
});

(async () => {
  try {
    const markets = await membrana.getMarkets();
    console.log('markets', markets);

    const balances = await membrana.getBalances();
    console.log('balances', balances);

    const myOrders = await membrana.getOrders('XRP-ETH');
    console.log('myOrders', myOrders);

    const newOrder = await membrana.order()
      .symbol('ETH-USDT')
      .amount(2)
      .sell()
      .limit(258.65)
      .send();
    console.log('order placed', newOrder);
  } catch (err) {
    console.log('something went wrong', err);
  }
})();

membrana.on('ready', async () => {
  try {
    const ratesSubscription = await membrana.market('rates').subscribe((rates) => {
      console.log('rates updated', rates);
    });
    console.log('rates subscription success', ratesSubscription);

    setTimeout(async () => {
      const unsub = await ratesSubscription.unsubscribe();
      console.log('rates successfully unsubscribed', unsub);
    }, 5000);
  } catch (err) {
    console.log('subscription failed', err);
  }
});

membrana.on('ready', async () => {
  try {
    const candlesSubscription = await membrana.market('candles', 'ETH-USDT', '1m').subscribe((candles) => {
      console.log('candles updated', candles);
    });
    console.log('candles subscription success', candlesSubscription);

    setTimeout(async () => {
      const unsub = await candlesSubscription.unsubscribe();
      console.log('candles successfully unsubscribed', unsub);
    }, 5000);
  } catch (err) {
    console.log('subscription failed', err);
  }
});
