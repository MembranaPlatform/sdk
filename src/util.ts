import { sha256 } from 'js-sha256';
import { URL } from 'whatwg-url';

export function stringToUint8Array(str: string): Uint8Array {
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

export function stringFromUint8Array(arr: Uint8Array): string {
  // this will work only for strings contain single-byte utf8 characters
  return String.fromCharCode.apply(null, arr);
}

export function toLengthPrefixedUint8Array(msg: string): Uint8Array {
  const msgBuf = stringToUint8Array(msg);
  const sizeBuf = new Uint8Array(8);

  const size = msgBuf.length;
  sizeBuf[7] = size & 0xFF;
  if (size > 0xFF) {
    sizeBuf[6] = (size >> 8) & 0xFF;
    if (size > 0xFFFF) {
      sizeBuf[5] = (size >> 16) & 0xFF;
      if (size > 0xFFFFFF) {
        sizeBuf[4] = (size >> 24) & 0xFF;
      }
    }
  }

  const result = new Uint8Array(size + 8);
  result.set(sizeBuf);
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
  const signature = sha256.hmac(secret, lengthPrefixed);
  return signature;
}
