/*
  It is plain javascript example so it requires compiled code from '../dist' folder.
  Perform 'npm install' before trying these examples.
*/
var { MembranaWS } = require('../dist');
var wsSdk = new MembranaWS({
  APIToken: {
    // these are random bytes. Put here your Membrana API credentials.
    key: 'b683f06191e16816f080da73f21c3a41c8e04480',
    secret: 'e54373c2f45d466e0c7f75898a82d80212d60b3c',
  },
  url: 'ws://beta.membrana.io/api/v1/extern'
});

wsSdk.on('error', (err) => {
  console.log('error event occurred', err);
})

wsSdk.on('open', () => {
  console.log('WebSocket open. Press Ctrl+C to stop the program');
  wsSdk.rates('binance').subscribe((msg) => {
    console.log('received rates update:', msg);
  });
  wsSdk.candles('binance', 'BTC-USDT', '1m').subscribe((msg) => {
    console.log('candle data update:', msg);
  })
});
