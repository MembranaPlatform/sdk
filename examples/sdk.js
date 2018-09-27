const { MembranaSDK } = require('../dist');
const { OrderSide } = require('../dist/MembranaSDK');

const sdk = new MembranaSDK({
  APIToken: {
    key: 'your membrana API key',
    secret: 'your membrana API secret',
  }
});

sdk.getBalances().then((balances) => {
  console.log('balances on the account:', balances);
});

sdk.getMarkets().then((markets) => {
  console.log('markets info:', markets);
});

/*
  You can place new orders in two ways. The first one is to invoke "placeOrder" method
  with a plain object as a parameter. The second is to use "order" method which is the
  order builder. See examples below:
*/

sdk.placeOrder({
  symbol: 'ETH-USDT',
  side: OrderSide.SELL,
  type: 'LIMIT',
  amount: 2.5,
  limit: 248.85,
}).then(order => {
  console.log('new order placed', order);
}).catch((err) => {
  console.log('failed to place order', err);
});

/* this command will get the same effect as above */
sdk.order('ETH-USDT').sell().limit(248.85).amount(2.5).send()
.then((newOrder) => {
  console.log('new order placed', newOrder);
  console.log('let\'s cancel it');
  return sdk.cancelOrder(newOrder.id);
})
.then((cancelResult) => {
  console.log('order canceled', cancelResult);
})
.catch((err) => {
  console.log('something went wrong', err);
});

// You can use 'order' method as a blank builder
const ethUsdtBlank = sdk.order('ETH-USDT').amount(1.15);
(async function someAsyncFunction() {
  const sellOrder = await ethUsdtBlank.sell().limit(248.5).send();
  const buyOrder = await ethUsdtBlank.buy().limit(247.8).send();
  const anotherSellOrder = await ethUsdtBlank.sell().limit(248).send();
  const anotherBuyOrder = await ethUsdtBlank.buy().limit(246.9).send();
  console.log({
    sellOrder,
    buyOrder,
    anotherSellOrder,
    anotherBuyOrder,
  });
})();

// Get all orders for a symbol
sdk.getOrders('ETH-USDT').then((ordersInfo) => {
  console.log('my open orders', ordersInfo.open);
  console.log('my closed orders', ordersInfo.closed);
});
