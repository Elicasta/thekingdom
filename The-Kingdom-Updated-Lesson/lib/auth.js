import crypto from 'node:crypto';

const COOKIE_NAME = 'kingdom_admin';
const MAX_AGE_SECONDS = 60 * 60 * 12;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export function verifyAdminPassword(value) {
  const expected = process.env.ADMIN_PASSWORD || '';
  return Boolean(expected) && safeEqual(value, expected);
}

export function createAdminToken() {
  const key = secret();
  if (!key) throw new Error('SESSION_SECRET is not configured');
  const payload = base64url(JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000 }));
  return `${payload}.${sign(payload, key)}`;
}

export function verifyAdminToken(token) {
  const key = secret();
  if (!key || !token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.', 2);
  if (!safeEqual(signature, sign(payload, key))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

export function readCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((acc, part) => {
    const index = part.indexOf('=');
    if (index < 0) return acc;
    const key = decodeURIComponent(part.slice(0, index).trim());
    const value = decodeURIComponent(part.slice(index + 1).trim());
    acc[key] = value;
    return acc;
  }, {});
}

export function isAdminRequest(req) {
  return verifyAdminToken(readCookies(req)[COOKIE_NAME]);
}

export function requireAdmin(req, res) {
  if (!adminConfigured()) {
    res.status(503).json({ error: 'Admin auth is not configured. Set ADMIN_PASSWORD and SESSION_SECRET.' });
    return false;
  }
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: 'Admin login required.' });
    return false;
  }
  return true;
}

export function setAdminCookie(req, res, token) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '');
  const secure = forwardedProto === 'https' || process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${MAX_AGE_SECONDS}`
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAdminCookie(req, res) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '');
  const secure = forwardedProto === 'https' || process.env.NODE_ENV === 'production';
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
