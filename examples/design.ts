import MembranaSDK from '../src';
import StreamProvider from '../src/providers/ws-node';
// import StreamProvider from '../src/providers/ws-browser';

const APIToken = {
  key: '',
  secret: '',
};

const membrana = new MembranaSDK({
  APIToken,
  StreamProvider,
  baseUrl: 'http://beta.membrana.io',
  wsUrl: 'ws://beta.membrana.io/api/v1/extern',
});

async function main() {
  const newOrder = await membrana.order('USDT-ETH')
    .amount(2)
    .sell()
    .limit(258.65)
    // .subscribe((order) => {
    //   console.log('order updated', order);
    // })
    .send();

  console.log('order placed', newOrder);

  try {
    const ratesSubscription = await membrana.market('rates').subscribe((rates) => {
      console.log('rates updated', rates);
    });
    console.log('rates subscription success', ratesSubscription);

    setTimeout(() => ratesSubscription.unsubscribe(), 5000);
  } catch (err) {
    console.log('subscription failed', err);
  }
}

main();
