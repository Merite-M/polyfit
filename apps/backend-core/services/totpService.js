const crypto = require('crypto');
const { getDistanceFromLatLonInM } = require('@polyfit/shared-utils');

const TOTP_SECRET_PEPPER = process.env.TOTP_SECRET_PEPPER || 'polyfit_secure_totp_salt_v1_2026';
const DEFAULT_TIME_STEP_SECONDS = 30;

/**
 * Derives a deterministic 32-byte secret for an employee using HMAC-SHA256
 * @param {string} employeeId - UUID of the employee
 * @returns {Buffer}
 */
function deriveEmployeeSecret(employeeId) {
  return crypto
    .createHmac('sha256', TOTP_SECRET_PEPPER)
    .update(String(employeeId))
    .digest();
}

/**
 * Generates an RFC 6238 compliant 6-digit TOTP token
 * @param {Buffer|string} secret
 * @param {number} [timeStepSeconds=30]
 * @param {number} [timestamp=Date.now()]
 * @returns {string} 6-digit TOTP string
 */
function generateTotp(secret, timeStepSeconds = DEFAULT_TIME_STEP_SECONDS, timestamp = Date.now()) {
  const secretBuf = Buffer.isBuffer(secret) ? secret : Buffer.from(secret, 'hex');
  const counter = Math.floor(timestamp / 1000 / timeStepSeconds);

  // 8-byte big-endian counter buffer
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuf).update(counterBuf).digest();

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
 * Validates an RFC 6238 TOTP token with configurable grace window (±window steps)
 * @param {string} token - 6-digit token to verify
 * @param {Buffer|string} secret
 * @param {number} [timeStepSeconds=30]
 * @param {number} [window=1] - 1 step grace before and after (30s grace)
 * @param {number} [timestamp=Date.now()]
 * @returns {{valid: boolean, stepOffset: number | null}}
 */
function verifyTotp(token, secret, timeStepSeconds = DEFAULT_TIME_STEP_SECONDS, window = 1, timestamp = Date.now()) {
  if (!token || String(token).length !== 6) {
    return { valid: false, stepOffset: null };
  }

  const secretBuf = Buffer.isBuffer(secret) ? secret : Buffer.from(secret, 'hex');
  const baseCounter = Math.floor(timestamp / 1000 / timeStepSeconds);

  for (let offset = -window; offset <= window; offset++) {
    const counter = baseCounter + offset;
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', secretBuf).update(counterBuf).digest();
    const dynOffset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[dynOffset] & 0x7f) << 24) |
      ((hmac[dynOffset + 1] & 0xff) << 16) |
      ((hmac[dynOffset + 2] & 0xff) << 8) |
      (hmac[dynOffset + 3] & 0xff);

    const expectedOtp = (binary % 1000000).toString().padStart(6, '0');
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedOtp))) {
      return { valid: true, stepOffset: offset };
    }
  }

  return { valid: false, stepOffset: null };
}

/**
 * Encodes and signs an access pass payload for the dynamic QR pass
 * @param {Object} passData
 * @returns {string} Signed base64url payload
 */
function signPassPayload(passData) {
  const jsonStr = JSON.stringify(passData);
  const sig = crypto
    .createHmac('sha256', TOTP_SECRET_PEPPER)
    .update(jsonStr)
    .digest('base64url');

  const encodedData = Buffer.from(jsonStr).toString('base64url');
  return `${encodedData}.${sig}`;
}

/**
 * Verifies and decodes a signed pass payload from a scanned QR
 * @param {string} signedPayload
 * @returns {Object|null}
 */
function verifySignedPassPayload(signedPayload) {
  if (!signedPayload || typeof signedPayload !== 'string') return null;
  const parts = signedPayload.split('.');
  if (parts.length !== 2) return null;

  const [encodedData, sig] = parts;
  try {
    const jsonStr = Buffer.from(encodedData, 'base64url').toString('utf8');
    const expectedSig = crypto
      .createHmac('sha256', TOTP_SECRET_PEPPER)
      .update(jsonStr)
      .digest('base64url');

    if (sig !== expectedSig) return null;
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

/**
 * Calculates remaining validity seconds in the current TOTP step
 * @param {number} [timeStepSeconds=30]
 * @param {number} [timestamp=Date.now()]
 * @returns {number}
 */
function getSecondsRemainingInStep(timeStepSeconds = DEFAULT_TIME_STEP_SECONDS, timestamp = Date.now()) {
  const currentSecond = Math.floor(timestamp / 1000) % timeStepSeconds;
  return timeStepSeconds - currentSecond;
}

module.exports = {
  DEFAULT_TIME_STEP_SECONDS,
  deriveEmployeeSecret,
  generateTotp,
  verifyTotp,
  signPassPayload,
  verifySignedPassPayload,
  getSecondsRemainingInStep,
  getDistanceFromLatLonInM
};
