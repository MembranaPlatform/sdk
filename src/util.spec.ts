import { expect } from 'chai';
import crypto from 'crypto';
import { sha256 } from 'js-sha256';
import { decodeHexString, sign, toLengthPrefixedUint8Array } from './util';

describe('signing function', () => {
  const secret = '650e9edc124125edd36c11bd6ba116c3cd26bf10';
  const method = 'GET';
  const host = 'localhost:5000';
  const path = '/api/v1/external/markets';
  const nonce = 1537865904886;
  const body = '';

  it('checks singing mechanism', () => {
    const signingString = `${method}\n${host}${path}\n${nonce}\n${body}`;
    const lengthPrefixed = toLengthPrefixedUint8Array(signingString);
    const signature = sha256.hmac(decodeHexString(secret), lengthPrefixed);

    const check = '3efd6b6b55357b9af19b4bb03e2efc88e1a79cd67d7777725fe15dacd008b777';
    expect(signature).to.equals(check);
  });

  it('checks singing function', () => {
    const signature = sign(secret, method, `https://${host}${path}`, nonce, body);
    const check = '3efd6b6b55357b9af19b4bb03e2efc88e1a79cd67d7777725fe15dacd008b777';
    expect(signature).to.equals(check);
  });

  it('checks hmac algorith consistency', () => {
    const signingPayload = 'any payload';
    const nodeSignature = crypto.createHmac('sha256', Buffer.from(secret, 'hex')).update(signingPayload).digest('hex');
    const browserSignature = sha256.hmac(decodeHexString(secret), signingPayload);
    expect(nodeSignature).to.equals(browserSignature);
  });
});
