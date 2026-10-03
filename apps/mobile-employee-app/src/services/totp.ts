/**
 * PolyFit Corporate Employee App - RFC 6238 Dynamic TOTP Engine
 * Pure TypeScript implementation for universal offline execution (Expo, Web, Hermes)
 * Compliant with backend totpService.js (HMAC-SHA1, 15-second time step)
 */

export const TOTP_STEP_SECONDS = 15;

/**
 * Pure JavaScript SHA-1 implementation (RFC 3174)
 */
function sha1(message: Uint8Array): Uint8Array {
  const words: number[] = [];
  for (let i = 0; i < message.length; i++) {
    words[i >> 2] = (words[i >> 2] || 0) | (message[i] << (24 - (i % 4) * 8));
  }

  const bitLength = message.length * 8;
  words[bitLength >> 5] = (words[bitLength >> 5] || 0) | (0x80 << (24 - (bitLength % 32)));
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;
  let e = 0xc3d2e1f0;

  const w = new Int32Array(80);

  for (let i = 0; i < words.length; i += 16) {
    const oldA = a;
    const oldB = b;
    const oldC = c;
    const oldD = d;
    const oldE = e;

    for (let j = 0; j < 80; j++) {
      if (j < 16) {
        w[j] = words[i + j] || 0;
      } else {
        const t = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
        w[j] = (t << 1) | (t >>> 31);
      }

      let f = 0;
      let k = 0;
      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    a = (a + oldA) | 0;
    b = (b + oldB) | 0;
    c = (c + oldC) | 0;
    d = (d + oldD) | 0;
    e = (e + oldE) | 0;
  }

  const result = new Uint8Array(20);
  const outWords = [a, b, c, d, e];
  for (let i = 0; i < 5; i++) {
    result[i * 4] = (outWords[i] >>> 24) & 0xff;
    result[i * 4 + 1] = (outWords[i] >>> 16) & 0xff;
    result[i * 4 + 2] = (outWords[i] >>> 8) & 0xff;
    result[i * 4 + 3] = outWords[i] & 0xff;
  }
  return result;
}

/**
 * Pure JavaScript HMAC-SHA1
 */
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let normalizedKey = key;

  if (normalizedKey.length > blockSize) {
    normalizedKey = sha1(normalizedKey);
  }
  if (normalizedKey.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(normalizedKey);
    normalizedKey = padded;
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = normalizedKey[i] ^ 0x5c;
    iKeyPad[i] = normalizedKey[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(iKeyPad.length + message.length);
  innerMsg.set(iKeyPad);
  innerMsg.set(message, iKeyPad.length);
  const innerHash = sha1(innerMsg);

  const outerMsg = new Uint8Array(oKeyPad.length + innerHash.length);
  outerMsg.set(oKeyPad);
  outerMsg.set(innerHash, oKeyPad.length);
  return sha1(outerMsg);
}

/**
 * Converts hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts UTF-8 string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
}

/**
 * Generates an RFC 6238 compliant 6-digit TOTP token
 */
export function generateClientTotp(
  secret: string | Uint8Array,
  timeStepSeconds: number = TOTP_STEP_SECONDS,
  timestamp: number = Date.now()
): string {
  const keyBytes = typeof secret === 'string'
    ? (secret.length === 64 ? hexToBytes(secret) : stringToBytes(secret))
    : secret;

  const counter = Math.floor(timestamp / 1000 / timeStepSeconds);

  // 8-byte big-endian counter buffer
  const counterBytes = new Uint8Array(8);
  let tempCounter = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(tempCounter & BigInt(0xff));
    tempCounter = tempCounter >> BigInt(8);
  }

  const hmac = hmacSha1(keyBytes, counterBytes);

  // Dynamic truncation (RFC 4226 / RFC 6238)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Computes remaining seconds in the current 15-second time step
 */
export function getClientSecondsRemaining(
  timeStepSeconds: number = TOTP_STEP_SECONDS,
  timestamp: number = Date.now()
): number {
  const currentSecond = Math.floor(timestamp / 1000) % timeStepSeconds;
  return timeStepSeconds - currentSecond;
}

/**
 * Base64URL encoder helper
 */
export function base64UrlEncode(str: string): string {
  const bytes = stringToBytes(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Universal base64
  let base64 = '';
  if (typeof btoa !== 'undefined') {
    base64 = btoa(binary);
  } else {
    // Fallback
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    for (let i = 0; i < binary.length; i += 3) {
      const b1 = binary.charCodeAt(i);
      const b2 = binary.charCodeAt(i + 1);
      const b3 = binary.charCodeAt(i + 2);
      output += chars.charAt(b1 >> 2);
      output += chars.charAt(((b1 & 3) << 4) | (b2 >> 4));
      output += isNaN(b2) ? '=' : chars.charAt(((b2 & 15) << 2) | (b3 >> 6));
      output += isNaN(b3) ? '=' : chars.charAt(b3 & 63);
    }
    base64 = output;
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encodes signed QR pass payload for turnstiles and partner scanners
 */
export function createDynamicPassPayload(params: {
  employeeId: string;
  orgId?: string;
  token: string;
  providerLocationId?: string;
  offline?: boolean;
}): string {
  const timestamp = Date.now();
  const payload = {
    type: 'polyfit_totp_pass',
    v: 1,
    employee_id: params.employeeId,
    org_id: params.orgId || null,
    provider_location_id: params.providerLocationId || null,
    token: params.token,
    timestamp,
    offline: params.offline ?? false,
    expires_at: new Date(timestamp + TOTP_STEP_SECONDS * 1000).toISOString(),
  };

  const jsonStr = JSON.stringify(payload);
  const encoded = base64UrlEncode(jsonStr);

  // Client pseudo-signature hash for tamper detection
  const sigBytes = sha1(stringToBytes(jsonStr + (params.token || '')));
  let sigHex = '';
  for (let i = 0; i < sigBytes.length; i++) {
    sigHex += sigBytes[i].toString(16).padStart(2, '0');
  }

  return `${encoded}.${sigHex.slice(0, 16)}`;
}
