import { sha256 } from 'js-sha256';
import { URL } from 'whatwg-url';

function stringToUint8Array(str: string): Uint8Array {
  const arr = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const precedingByte = (charCode >> 8) & 0xFF;
    if (precedingByte === 0) {
      arr.push(charCode);
    } else {
      arr.push(precedingByte);
      arr.push(charCode & 0xFF);
    }
  }

  return Uint8Array.from(arr);
}

export function toLengthPrefixedUint8Array(msg: string): Uint8Array {
  const msgBuf = stringToUint8Array(msg);
  const sizeBuf = new ArrayBuffer(8);
  const dataView = new DataView(sizeBuf);

  const size = msgBuf.length;
  const highOrder32 = size / 0x0100000000 | 0;
  const lowOrder32 = size | 0;
  dataView.setUint32(0, highOrder32);
  dataView.setUint32(4, lowOrder32);

  const result = new Uint8Array(size + 8);
  result.set(new Uint8Array(sizeBuf));
  result.set(msgBuf, 8);
  return result;
}

export function sign(secret: string, method: string, url: string | URL, nonce: number, body?: string): string {
  if (!(typeof url === 'object' && 'href' in url)) {
    url = new URL(url);
  }
  if (typeof body !== 'string') {
    body = '';
  }

  const signingString = `${method}\n${url.host}${url.pathname}${url.search}\n${nonce}\n${body}`;
  const lengthPrefixed = toLengthPrefixedUint8Array(signingString);
  const signature = sha256.hmac(decodeHexString(secret), lengthPrefixed);
  return signature;
}

export function decodeHexString(hexString: string): Uint8Array {
  const length = hexString.length / 2 | 0;
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return arr;
}
