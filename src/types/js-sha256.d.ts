import 'js-sha256';

declare module 'js-sha256' {
  interface Hmac {
    (secretKey: string|Uint8Array, message: Message): string;
  }
}
