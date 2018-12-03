import MembranaSDK from '../../src';
import StreamProvider from '../../src/providers/ws-browser';

const credentials = {
  key: process.env.API_KEY || '',
  secret: process.env.API_SECRET || '',
};

const membrana = new MembranaSDK({
  ...credentials,
  StreamProvider,
  baseUrl: process.env.API_SERVER || 'https://beta.membrana.io',
});

membrana.on('error', (err) => {
  console.error('error event', err);
});

(async () => {
  try {
    const markets = await membrana.getMarkets();
    console.log('markets', markets);

    const balances = await membrana.getBalances();
    console.log('balances', balances);

    // const myOrders = await membrana.getOrders('XRP-ETH');
    // console.log('myOrders', myOrders);

    // const newOrder = await membrana.order()
    //   .market('USDT-ETH')
    //   .amount(2)
    //   .sell()
    //   .limit(258.65)
    //   .send();
    // console.log('order placed', newOrder);
  } catch (err) {
    console.error(err);
  }
})();

membrana.on('ready', async () => {
  try {
    const { unsubscribe } = await membrana.channel('rates').subscribe((rates) => {
      console.log('rates updated', rates);
    });
    console.log('rates subscription success');

    setTimeout(async () => {
      await unsubscribe();
      console.log('rates successfully unsubscribed');
    }, 5000);
  } catch (err) {
    console.log('subscription failed', err);
  }
});

membrana.on('ready', async () => {
  try {
    const { unsubscribe } = await membrana.channel('candles', 'USDT-ETH', '1m').subscribe((candles) => {
      console.log('candles updated', candles);
    });
    console.log('candles subscription success');

    setTimeout(async () => {
      await unsubscribe();
      console.log('candles successfully unsubscribed');
    }, 5000);
  } catch (err) {
    console.log('subscription failed', err);
  }
});
