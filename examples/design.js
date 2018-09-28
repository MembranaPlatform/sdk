var MembranaSDK = require('../dist');
var StreamProvider = require('../dist/providers/ws-node');
// var StreamProvider = require('../dist/providers/ws-browser');

var APIToken = {
  key: 'your API key here',
  secret: 'your API secret here',
};

var membrana = new MembranaSDK({
  APIToken,
  StreamProvider,
});

async function main() {
  var newOrder = await membrana.order('ETH-USDT')
    .amount(2)
    .sell()
    .limit(258.65)
    .subscribe((order) => {
      console.log('order updated', order);
    })
    .send();

  console.log('order placed', newOrder);

  var ratesSubscription = await membrana.market('rates').subscribe((rates) => {
    console.log('rates updated', rates);
  });
  console.log('rates subscription success', ratesSubscription);

  setTimeout(() => ratesSubscription.unsubscribe(), 5000);
}

main();
