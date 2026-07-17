const encoder = new TextEncoder();

const toHex = (value: ArrayBuffer): string =>
  [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export const createSecureToken = (byteLength = 32): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const createOtpCode = (): string => {
  const limit = 0x100000000 - (0x100000000 % 1_000_000);
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0]! >= limit);
  return (value[0]! % 1_000_000).toString().padStart(6, '0');
};

export const keyedHash = async (secret: string, purpose: string, value: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${purpose}:${value}`)));
};
