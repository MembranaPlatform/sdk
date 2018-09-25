import { expect } from 'chai';
import { sha256 } from 'js-sha256';
import { sign, toLengthPrefixedUint8Array } from './util';

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
    const signature = sha256.hmac(secret, lengthPrefixed);

    const check = '8d6262e55d0ae5693be90bfc13e2f6894bbb3394220a67eaad5b242a3b9c34ee';
    expect(signature).to.equals(check);
  });

  it('checks singing function', () => {
    const signature = sign(secret, method, `https://${host}${path}`, nonce, body);
    const check = '8d6262e55d0ae5693be90bfc13e2f6894bbb3394220a67eaad5b242a3b9c34ee';
    expect(signature).to.equals(check);
  });
});
