# Membrana Platform SDK

This package is useful for quickly building applications that communicate with Membrana Platform through the API.

## Usage Examples

### Trading API

```javascript
const MembranaSDK = require('@membrana/sdk');

const sdk = new MembranaSDK({
  key: 'your membrana API key',
  secret: 'your membrana API secret',
});

(async () => {
  const balances = await sdk.getBalances();
  /*
    return format:
    [
      {
        "total": 0,
        "available": 0,
        "name": "string"
      }
    ]
    example:
    [
      { total: 1.74621, available: 1.74621, name: 'BTC' },
      { total: 8.8115, available: 7.8115, name: 'ETH' },
      { total: 3115.14, available: 2610.81, name: 'USDT' },
      { total: 0, available: 0, name: 'LTC' },
      ...
    ]
  */

  const markets = await sdk.getMarkets();
  /*
    return format:
    [
      {
        "symbol": "USDT-LTC",
        "last": 0,
        "marketCurrencyName": "Litecoin",
        "minTradeSize": 0,
        "prevDay": 0,
        "volume": 0,
        "tradeStep": 0,
        "priceStep": 0
      }
    ]
  */

  const newOrder = await sdk.placeOrder({
    symbol: 'USDT-ETH',
    side: 'SELL',
    type: 'LIMIT',
    limit: 248.85,
    amount: 2.5,
  });
  /*
    newOrder will have such a structure:
    {
      "_id": "string",
      "exchange": "binance",
      "symbol": "USDT-ETH",
      "state": "OPEN",
      "type": "buy",
      "dt": "2018-09-24T08:24:14Z",
      "dtClose": "2018-09-24T08:24:14Z",
      "limit": 0,
      "amount": 0,
      "filled": 0,
      "price": 0,
      "commissions": {
        "BTC": 0.001
      }
    }
  */

  /* this command will get the same effect as above */
  const newOrder2 = await sdk.order.market('USDT-ETH').sell().amount(2.5).limit(248.85).send();

  // You can use 'order' method as a blank builder
  const ethUsdtBlank = sdk.order.market('USDT-ETH').limit(248.85).amount(1.15);
  const sellOrder = await ethUsdtBlank.sell().limit(248.5).send();
  const buyOrder = await ethUsdtBlank.buy().limit(247.8).send();
  const anotherSellOrder = await ethUsdtBlank.sell().limit(248).send();
  const anotherBuyOrder = await ethUsdtBlank.buy().limit(246.9).send();

  // Cancel order
  const cancelResult = await sdk.cancelOrder(newOrder.id);
  /*
    return example:
    {
      "_id": "string",
      "exchange": "binance",
      "symbol": "USDT-BTC",
      "state": "CLOSED",
      "type": "buy",
      "dt": "2018-09-24T08:24:14Z",
      "dtClose": "2018-09-24T08:24:14Z",
      "limit": 0,
      "amount": 0,
      "filled": 0,
      "price": 0,
      "commissions": {
        "BTC": 0
      }
    }
  */

  // Get all orders for a symbol
  const orders = await sdk.getOrders('USDT-ETH'); // order will have the same structure as newOrder
  /*
    return example:
    {
      "open": [
        {
          "_id": "string",
          "exchange": "binance",
          "symbol": "USDT-BTC",
          "state": "OPEN",
          "type": "buy",
          "dt": "2018-09-24T08:24:14Z",
          "dtClose": "2018-09-24T08:24:14Z",
          "limit": 0,
          "amount": 0,
          "filled": 0,
          "price": 0,
          "commissions": {
            "BTC": 0.001
          }
        }
      ],
      "closed": [
        {
          "_id": "string",
          "exchange": "binance",
          "symbol": "USDT-BTC",
          "state": "OPEN",
          "type": "buy",
          "dt": "2018-09-24T08:24:14Z",
          "dtClose": "2018-09-24T08:24:14Z",
          "limit": 0,
          "amount": 0,
          "filled": 0,
          "price": 0,
          "commissions": {
            "BTC": 0.001
          }
        }
      ]
    }
  */
})();
```

### Stream API

To use Stream API just add a StreamProvider to MembranaSDK constructor parameter. There are two stream providers at the moment. One for NodeJS environment and another for a browser environment. Both are WebSocket stream.

```javascript
const MembranaSDK = require('@membrana/sdk');
const StreamProvider = require('@membrana/sdk/dist/providers/ws-node');
/*
  for browsers environment use ws-browser
  const StreamProvider = require('@membrana/sdk/dist/providers/ws-browser');
*/

const sdk = new MembranaSDK({
  key: 'your membrana API key',
  secret: 'your membrana API secret',
  StreamProvider
});

membrana.on('ready', async () => {
  try {
    const candlesSubscription = await membrana.channel('candles', 'USDT-ETH', '1m').subscribe((candles) => {
      console.log('candles updated', candles);
      /*
        candles updated [ {
          BV: 15988.9955476,
          C: 230.51,
          H: 230.65,
          L: 230.51,
          O: 230.65,
          T: 1538378940000,
          V: 69.35105
        } ]
      */
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
```

See complete example [here](examples/sdk.js)

## Symbol format

Trading pairs should look like 'USDT-BTC'. "Quote asset" must be first followed by "Base asset". Use dash ("-") as a delimiter.

If you want to buy ETH and give USDT, the symbol will 'USDT-ETH' and price will be expressed by the amount of USDT per ETH.
