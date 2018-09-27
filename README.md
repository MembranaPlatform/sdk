# Membrana Platform SDK

This package is useful for quickly building applications that communicate with Membrana Platform through the API.

## Usage

### Trading API

```javascript
const MembranaSDK = require('@membrana/sdk');
const sdk = new MembranaSDK({
  APIToken: {
    key: 'your membrana API key',
    secret: 'your membrana API secret',
  }
});

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
      "symbol": "LTC-USDT",
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
  symbol: 'ETH-USDT',
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
    "symbol": "BTC-USDT",
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
const newOrder = await sdk.order('ETH-USDT').sell().amount(2.5).limit(248.85).send();

// You can use 'order' method as a blank builder
const ethUsdtBlank = sdk.order('ETH-USDT').limit().amount(1.15);
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
    "symbol": "BTC-USDT",
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
const orders = await sdk.getOrders('ETH-USDT'); // order will have the same structure as newOrder
/*
  return example:
  {
    "open": [
      {
        "_id": "string",
        "exchange": "binance",
        "symbol": "BTC-USDT",
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
        "symbol": "BTC-USDT",
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
```

### WebSocket API

```javascript
const MembranaWS = require('@membrana/sdk').ws;
const wsSdk = new MembranaWS({
  APIToken: {
    key: 'your membrana API key',
    secret: 'your membrana API secret',
  }
});

const subscribeResult = await wsSdk.rates('binance').subscribe(callback);
const subscribeResult = await wsSdk.ticker('binance', 'BTC-USDT').subscribe((ticker) => {
  console.log('BTC-USDT price changed', ticker);
});
const subscribeResult = await wsSdk.depth('binance', 'BTC-USDT').subscribe((orderLevels) => {
  console.log('BTC-USDT price changed', orderLevels);
});

const candlesChannel = wsSdk.candles('binance', 'LTC-USDT', '1m');
const subscriptionResult = await candlesChannel.subscribe(callback);
const unSubscriptionResult = await candlesChannel.unsubscribe();
```